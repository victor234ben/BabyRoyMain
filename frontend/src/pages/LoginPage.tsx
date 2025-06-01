import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader, PawPrint } from "lucide-react";

const LoginPage = () => {
  const { telegramOauth } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [tgUser, setTgUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = (location.state as any)?.from || "/dashboard";

  useEffect(() => {
    const initializeTelegramWebApp = () => {
      try {
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();

          console.log("Telegram WebApp initialized:", tg.initDataUnsafe);

          // Get user info from Telegram
          const user = tg.initDataUnsafe?.user;
          if (user) {
            setTgUser(user);
          } else {
            setError("Unable to get user information from Telegram");
            setIsLoading(false);
          }
        } else {
          // Fallback for development or non-Telegram environment
          console.warn("Telegram WebApp not available");
          setError("This app must be opened through Telegram");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error initializing Telegram WebApp:", err);
        setError("Failed to initialize Telegram WebApp");
        setIsLoading(false);
      }
    };

    // Small delay to ensure Telegram WebApp is ready
    setTimeout(initializeTelegramWebApp, 100);
  }, []);

  useEffect(() => {
    const authenticateTelegramUser = async () => {
      if (!tgUser) return;

      try {
        setIsLoading(true);

        const telegramId = tgUser.id;
        const first_name = tgUser.first_name || "";
        const last_name = tgUser.last_name || "";
        const username = tgUser.username || "";

        console.log("Authenticating user:", {
          telegramId,
          first_name,
          last_name,
          username,
        });

        // Call telegramOauth WITHOUT referral code (handled in /start webhook)
        await telegramOauth(
          telegramId,
          first_name,
          last_name,
          username
          // No referral code parameter needed anymore
        );

        // Navigate to dashboard or intended route
        navigate(from, { replace: true });
      } catch (error) {
        console.error("Telegram OAuth failed:", error);
        setError("Authentication failed. Please try again.");
        setIsLoading(false);
      }
    };

    authenticateTelegramUser();
  }, [tgUser, telegramOauth, from, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-paws-primary/20 to-paws-accent/20 p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paws-primary">
            <PawPrint className="h-8 w-8 text-white" />
          </div>
          <Loader className="animate-spin w-8 h-8 text-paws-primary" />
          <p className="text-center text-paws-primary font-medium">
            Connecting to BabyRoy...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-paws-primary/20 to-paws-accent/20 p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
            <PawPrint className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-red-600">Connection Error</h2>
            <p className="text-red-500 max-w-md">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-paws-primary text-white rounded-lg hover:bg-paws-accent transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This should not render if everything works correctly
  return <p>Authentication complete</p>;
};

export default LoginPage;
