// Fixed AuthContext with proper session handling
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { authAPI, profileAPI, UserProfile } from "@/services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

type TelegramOauthResponse = {
  success: boolean;
  user: {
    _id: string;
    first_name: string;
    last_name?: string;
    username?: string;
    telegramId: string;
    referralCode: string;
    points: number;
    totalEarned: number;
  };
};

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  isAuth: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  telegramOauth: (
    telegramId: number,
    first_name: string,
    last_name: string,
    username: string
  ) => Promise<TelegramOauthResponse>;
  register: (
    name: string,
    email: string,
    password: string,
    referralCode?: string
  ) => Promise<void>;
  logout: () => void;
  updateUserData: (userData: UserProfile) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Single authentication check on app initialization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Regular token validation
        console.log("🔍 [DEBUG] Checking existing token...");
        const isValid = await authAPI.validateToken();

        if (isValid) {
          console.log("✅ [DEBUG] Existing token valid, fetching profile...");
          // Fetch user profile only if token is valid
          const userData = await profileAPI.getProfile();
          setUser(userData);
          setIsAuth(true);
        } else {
          console.log("❌ [DEBUG] No valid token found");
          setUser(null);
          setIsAuth(false);
        }
      } catch (error) {
        console.error("❌ [DEBUG] Authentication error:", error);
        setUser(null);
        setIsAuth(false);
        toast.error("Authentication check failed");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Remove location dependency to avoid re-runs

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authAPI.login({ email, password });
      setUser(data.user);
      setIsAuth(true);
      toast.success("Login successful!");

      // Navigate to intended page or dashboard
      const intendedPath = location.state?.from || "/dashboard";
      navigate(intendedPath, { replace: true });
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    referralCode?: string
  ) => {
    setLoading(true);
    try {
      await authAPI.register({ name, email, password, referralCode });
      toast.success("Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const telegramOauth = async (
    telegramId: number,
    first_name: string,
    last_name: string,
    username: string
  ): Promise<TelegramOauthResponse> => {
    setLoading(true);
    try {
      const requestData = {
        telegramId: telegramId.toString(),
        first_name: first_name || "",
        last_name: last_name || "",
        username: username || "",
      };

      const data = await authAPI.telegramOauth(requestData);

      if (data && data.user) {
        setUser(data.user);
        setIsAuth(true);
        // toast.success("Authentication successful!");
        const intendedPath = location.state?.from || "/dashboard";
        navigate(intendedPath, { replace: true });
      }
      return data;
    } catch (error) {
      console.error("Telegram OAuth error:", error);
      toast.error("Authentication failed. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuth(false);
    navigate("/login");
    toast.info("You have been logged out.");
  };

  const updateUserData = (userData: UserProfile) => {
    setUser(userData);
  };

  const isAuthenticated = !!user && isAuth;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAuth,
        login,
        register,
        logout,
        updateUserData,
        telegramOauth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
