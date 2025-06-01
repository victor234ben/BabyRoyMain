import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader, PawPrint } from "lucide-react";

const LoginPage = () => {
  const { telegramOauth } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [tgUser, setTgUser] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]); // For visual debugging
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || "/dashboard";

  // Helper function to add debug info
  const addDebug = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    let retryTimeout;

    const initializeTelegramWebApp = () => {
      try {
        addDebug(
          `🔄 Telegram WebApp init attempt ${retryCount + 1}/${maxRetries}`
        );

        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;

          addDebug("📱 Telegram WebApp found, calling ready()...");
          tg.ready();
          tg.expand();

          setTimeout(() => {
            const user = tg.initDataUnsafe?.user;

            if (user && user.id) {
              addDebug(
                `✅ User data found: ID=${user.id}, Name=${user.first_name}`
              );
              setTgUser(user);
            } else if (retryCount < maxRetries - 1) {
              addDebug(
                `❌ No user data yet, retrying... (attempt ${retryCount + 1})`
              );
              retryCount++;
              retryTimeout = setTimeout(initializeTelegramWebApp, 300);
            } else {
              addDebug("❌ Failed to get user data after all retries");
              setError(
                "Unable to get user information from Telegram. Please make sure you opened this through the Telegram bot."
              );
              setIsLoading(false);
            }
          }, 200);
        } else if (retryCount < maxRetries - 1) {
          addDebug(
            `⏳ Telegram WebApp not ready, retrying... (attempt ${
              retryCount + 1
            })`
          );
          retryCount++;
          retryTimeout = setTimeout(initializeTelegramWebApp, 200);
        } else {
          // Final fallback - check if we're in development
          if (
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
          ) {
            addDebug("🛠️ Development mode detected - using mock data");
            setTgUser({
              id: 123456789,
              first_name: "Dev",
              last_name: "User",
              username: "devuser",
            });
          } else {
            addDebug("❌ Telegram WebApp not available after all retries");
            setError("This app must be opened through Telegram");
            setIsLoading(false);
          }
        }
      } catch (err) {
        addDebug(`💥 Error initializing Telegram WebApp: ${err.message}`);
        if (retryCount < maxRetries - 1) {
          retryCount++;
          retryTimeout = setTimeout(initializeTelegramWebApp, 500);
        } else {
          setError("Failed to initialize Telegram WebApp");
          setIsLoading(false);
        }
      }
    };

    initializeTelegramWebApp();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
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

        addDebug("=== AUTHENTICATION START ===");
        addDebug(`User: ${first_name} (ID: ${telegramId})`);
        addDebug("Note: User account already created via bot /start command");

        // Simplified authentication - no referral code needed
        const authResult = await telegramOauth(
          telegramId,
          first_name,
          last_name,
          username
        );

        addDebug(
          `✅ Auth successful: ${JSON.stringify(
            authResult?.user?.first_name || "Unknown"
          )}`
        );
        navigate(from, { replace: true });
      } catch (error) {
        addDebug(`❌ Auth failed: ${error.message}`);
        setError("Authentication failed. Please try again.");
        setIsLoading(false);
      }
    };

    authenticateTelegramUser();
  }, [tgUser, telegramOauth, from, navigate]);

  // Show debug info in UI (only in loading state)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-paws-primary/20 to-paws-accent/20 p-4">
        <div className="flex flex-col items-center space-y-4 w-full max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paws-primary">
            <PawPrint className="h-8 w-8 text-white" />
          </div>
          <Loader className="animate-spin w-8 h-8 text-paws-primary" />
          <div className="text-center">
            <p className="text-paws-primary font-medium">
              Connecting to BabyRoy...
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Initializing Telegram connection
            </p>
          </div>

          {/* DEBUG OUTPUT - Remove this in production */}
          <div className="w-full mt-4 p-3 bg-black/10 rounded-lg max-h-48 overflow-y-auto">
            <p className="text-xs font-bold text-gray-700 mb-2">Debug Log:</p>
            {debugInfo.map((info, index) => (
              <p
                key={index}
                className="text-xs text-gray-600 font-mono break-words"
              >
                {info}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state with debug info
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-paws-primary/20 to-paws-accent/20 p-4">
        <div className="flex flex-col items-center space-y-4 text-center w-full max-w-md">
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

          {/* DEBUG OUTPUT - Remove this in production */}
          <div className="w-full mt-4 p-3 bg-black/10 rounded-lg max-h-48 overflow-y-auto">
            <p className="text-xs font-bold text-gray-700 mb-2">Debug Log:</p>
            {debugInfo.map((info, index) => (
              <p
                key={index}
                className="text-xs text-gray-600 font-mono break-words"
              >
                {info}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <p>Authentication complete</p>;
};

export default LoginPage;
