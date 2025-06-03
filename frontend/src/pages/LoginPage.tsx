import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader, PawPrint } from "lucide-react";

const LoginPage = () => {
  const { telegramOauth, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [tgUser, setTgUser] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [initAttempt, setInitAttempt] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = (location.state as any)?.from || "/dashboard";
  const MAX_INIT_ATTEMPTS = 10;
  const INIT_RETRY_DELAY = 200;

  // Redirect if already authenticated (handles session auth success)
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const checkTelegramWebApp = useCallback(() => {
    return new Promise((resolve, reject) => {
      const checkWebApp = (attempt = 0) => {
        if (attempt >= MAX_INIT_ATTEMPTS) {
          reject(new Error("Telegram WebApp initialization timeout"));
          return;
        }

        try {
          // Check if Telegram WebApp is available
          if (typeof window !== "undefined" && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;

            // Ensure WebApp is ready
            tg.ready();

            // Check if initData is available
            if (tg.initData && tg.initDataUnsafe) {
              const user = tg.initDataUnsafe.user;
              if (user && user.id) {
                tg.expand();
                resolve(user);
                return;
              }
            }
          }

          // If not ready, retry with exponential backoff
          const delay = INIT_RETRY_DELAY * Math.pow(1.5, attempt);
          setTimeout(() => checkWebApp(attempt + 1), delay);
        } catch (err) {
          reject(err);
        }
      };

      checkWebApp();
    });
  }, []);

  useEffect(() => {
    const initializeTelegramWebApp = async () => {
      // Skip if already authenticated (session auth succeeded)
      if (isAuthenticated) {
        return;
      }

      try {
        setInitAttempt((prev) => prev + 1);

        // Wait for Telegram WebApp to be fully ready
        const user = await checkTelegramWebApp();

        console.log("Telegram user found:", user);
        setTgUser(user);
        setError(null);
      } catch (err) {
        console.error("Error initializing Telegram WebApp:", err);

        // Provide more specific error messages
        if (err.message.includes("timeout")) {
          setError(
            "Telegram is taking longer than expected to load. Please try refreshing the app."
          );
        } else if (typeof window === "undefined" || !window.Telegram?.WebApp) {
          setError(
            "This app must be opened through Telegram. Please access it from the Telegram bot."
          );
        } else {
          setError(
            "Unable to get user information from Telegram. Please try again."
          );
        }

        setIsLoading(false);
      }
    };

    initializeTelegramWebApp();
  }, [checkTelegramWebApp, retryCount, isAuthenticated]);

  useEffect(() => {
    const authenticateTelegramUser = async () => {
      if (!tgUser || isAuthenticated) return;

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

        await telegramOauth(telegramId, first_name, last_name, username);
        // Navigation is handled in the auth context
      } catch (error) {
        console.error("Telegram OAuth failed:", error);
        setError(error.message || "Authentication failed. Please try again.");
        setIsLoading(false);
      }
    };

    authenticateTelegramUser();
  }, [tgUser, telegramOauth, isAuthenticated]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
    setIsLoading(true);
    setInitAttempt(0);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Don't show anything if already authenticated (prevents flash)
  if (isAuthenticated) {
    return null;
  }

  // Loading state
  if (isLoading) {
    const getLoadingMessage = () => {
      if (initAttempt <= 1) return "Connecting to BabyRoy...";
      if (initAttempt <= 3) return "Initializing Telegram connection...";
      if (initAttempt <= 6) return "Please wait, still connecting...";
      return "Almost ready, just a moment more...";
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-paws-primary/20 to-paws-accent/20 p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
            <PawPrint className="h-8 w-8 text-white" />
          </div>
          <Loader className="animate-spin w-8 h-8 text-paws-primary" />
          <p className="text-center text-paws-primary font-medium">
            {getLoadingMessage()}
          </p>
          {initAttempt > 3 && (
            <div className="text-center space-y-2">
              <p className="text-paws-primary/70 text-sm">
                Attempt {initAttempt} of {MAX_INIT_ATTEMPTS}
              </p>
              <button
                onClick={handleRefresh}
                className="px-3 py-1 text-sm bg-paws-primary/20 text-paws-primary rounded hover:bg-paws-primary/30 transition-colors"
              >
                Refresh if stuck
              </button>
            </div>
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
            <p className="text-red-500 max-w-md text-sm">{error}</p>
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-paws-primary text-white rounded-lg hover:bg-paws-accent transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Refresh App
              </button>
              {(error.includes("Account not found") ||
                error.includes("must be opened through Telegram")) && (
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

  return <p>Authentication complete</p>;
};

export default LoginPage;