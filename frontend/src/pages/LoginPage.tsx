import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader, PawPrint } from "lucide-react";

const LoginPage = () => {
  const { telegramOauth } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [tgUser, setTgUser] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
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
        setError(null);

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

        // Call telegramOauth - this should now only find/authenticate existing users
        await telegramOauth(telegramId, first_name, last_name, username);

        // Navigate to dashboard or intended route
        navigate(from, { replace: true });
      } catch (error) {
        console.error("Telegram OAuth failed:", error);

        // If user not found and we haven't retried too many times
        if (error.message?.includes("User not found") && retryCount < 3) {
          console.log(
            `User not found, retrying... (attempt ${retryCount + 1}/3)`
          );
          setRetryCount((prev) => prev + 1);

          // Wait a bit and retry (webhook might still be processing)
          setTimeout(() => {
            authenticateTelegramUser();
          }, 2000);
          return;
        }

        // Show error after retries exhausted or other errors
        if (error.message?.includes("User not found")) {
          setError(
            "Account not found. Please try opening the app from Telegram /start command first."
          );
        } else {
          setError("Authentication failed. Please try again.");
        }
        setIsLoading(false);
      }
    };

    authenticateTelegramUser();
  }, [tgUser, telegramOauth, from, navigate, retryCount]);

  // Loading state with more informative messages
  if (isLoading) {
    let loadingMessage = "Connecting to BabyRoy...";
    if (retryCount > 0) {
      loadingMessage = `Setting up your account... (${retryCount}/3)`;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-paws-primary/20 to-paws-accent/20 p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paws-primary">
            <PawPrint className="h-8 w-8 text-white" />
          </div>
          <Loader className="animate-spin w-8 h-8 text-paws-primary" />
          <p className="text-center text-paws-primary font-medium">
            {loadingMessage}
          </p>
          {retryCount > 0 && (
            <p className="text-center text-paws-primary/70 text-sm">
              Please wait while we set up your account...
            </p>
          )}
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
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => {
                  setRetryCount(0);
                  setError(null);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-paws-primary text-white rounded-lg hover:bg-paws-accent transition-colors"
              >
                Try Again
              </button>
              {error.includes("Account not found") && (
                <button
                  onClick={() => {
                    if (window.Telegram?.WebApp) {
                      window.Telegram.WebApp.close();
                    }
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Go Back to Telegram
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This should not render if everything works correctly
  return <p>Authentication complete</p>;
};

export default LoginPage;
