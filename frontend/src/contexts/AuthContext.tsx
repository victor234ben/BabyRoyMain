// Updated AuthContext - Handles session tokens from URL
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

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  telegramOauth: (
    telegramId: string,
    first_name: string,
    last_name: string,
    username: string
  ) => Promise<void>;
  sessionAuth: (sessionToken: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Single authentication check on app initialization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First, check for session token in URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionToken = urlParams.get("session");

        if (sessionToken) {
          console.log("Session token found in URL, attempting session auth...");

          // Clean URL immediately
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          try {
            const data = await authAPI.sessionAuth({ sessionToken });
            if (data && data.user) {
              setUser(data.user);
              toast.success("Welcome back!");
              return; // Exit early on success
            }
          } catch (error) {
            console.error("Session authentication failed:", error);
            // Continue to regular token validation
          }
        }

        // Fall back to regular token validation
        const isValid = await authAPI.validateToken();

        if (isValid) {
          // Fetch user profile only if token is valid
          const userData = await profileAPI.getProfile();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setUser(null);
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
    telegramId: string,
    first_name: string,
    last_name: string,
    username: string
  ) => {
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

  const sessionAuth = async (sessionToken: string) => {
    setLoading(true);
    try {
      const requestData = {
        sessionToken: sessionToken,
      };

      const data = await authAPI.sessionAuth(requestData);

      if (data && data.user) {
        setUser(data.user);
        toast.success("Welcome back!");
        return data;
      }
    } catch (error) {
      console.error("Session authentication error:", error);
      toast.error("Session expired. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    navigate("/login");
    toast.info("You have been logged out.");
  };

  const updateUserData = (userData: UserProfile) => {
    setUser(userData);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUserData,
        telegramOauth,
        sessionAuth,
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
