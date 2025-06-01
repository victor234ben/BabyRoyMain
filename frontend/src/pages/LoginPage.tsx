import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader, PawPrint } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
  const { telegramOauth } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [tgUser, setTgUser] = useState(null);
  const [error, setError] = useState(null);
  const [referralCode, setReferralCode] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || "/dashboard";

  // Storage keys
  const REFERRAL_CODE_KEY = "babyroy_referral_code";
  const USER_REGISTERED_KEY = "babyroy_user_registered";

  // Helper function to get stored referral code
  const getStoredReferralCode = () => {
    try {
      return localStorage.getItem(REFERRAL_CODE_KEY);
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return null;
    }
  };

  // Helper function to store referral code
  const storeReferralCode = (code) => {
    try {
      if (code) {
        localStorage.setItem(REFERRAL_CODE_KEY, code);
        toast.success(`🎁 Referral bonus activated! Code: ${code}`);
      }
    } catch (error) {
      console.error("Error storing referral code:", error);
    }
  };

  // Helper function to check if user is already registered
  const isUserRegistered = () => {
    try {
      return localStorage.getItem(USER_REGISTERED_KEY) === "true";
    } catch (error) {
      return false;
    }
  };

  // Helper function to mark user as registered
  const markUserAsRegistered = () => {
    try {
      localStorage.setItem(USER_REGISTERED_KEY, "true");
    } catch (error) {
      console.error("Error marking user as registered:", error);
    }
  };

  // Extract referral code immediately when component mounts
  useEffect(() => {
    const extractReferralCode = () => {
      let code = null;

      console.log("🔍 Starting referral extraction...");
      console.log("URL:", window.location.href);

      // First check if we already have a stored referral code for returning users
      const storedCode = getStoredReferralCode();
      if (storedCode && !isUserRegistered()) {
        console.log("✅ Using stored referral code:", storedCode);
        setReferralCode(storedCode);
        toast.info(
          `🎁 Welcome back! Referral bonus still active: ${storedCode}`
        );
        return;
      }

      // Method 1: Check URL search parameters (?ref=code)
      const urlParams = new URLSearchParams(window.location.search);
      code = urlParams.get("ref") || urlParams.get("start");

      if (code) {
        console.log("✅ Referral code from URL params:", code);
        setReferralCode(code);
        storeReferralCode(code);
        return;
      }

      // Method 2: Check URL hash parameters (#ref=code)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        code = hashParams.get("start") || hashParams.get("ref");
        if (code) {
          console.log("✅ Referral code from URL hash:", code);
          setReferralCode(code);
          storeReferralCode(code);
          return;
        }
      }

      // Method 3: Check if Telegram WebApp is available and has start_param
      if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
        code = window.Telegram.WebApp.initDataUnsafe.start_param;
        console.log("✅ Referral code from Telegram start_param:", code);
        setReferralCode(code);
        storeReferralCode(code);
        return;
      }

      // If no new referral code found, check stored one again for existing users
      if (storedCode) {
        console.log("ℹ️ Using existing stored referral code:", storedCode);
        setReferralCode(storedCode);
        return;
      }

      console.log("ℹ️ No referral code found");
    };

    // Extract referral code immediately
    extractReferralCode();

    // Also try again after a short delay in case Telegram data loads later
    const timeout = setTimeout(extractReferralCode, 500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    let retryTimeout;

    const initializeTelegramWebApp = () => {
      try {
        console.log(
          `🔄 Telegram WebApp init attempt ${retryCount + 1}/${maxRetries}`
        );

        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;

          console.log("📱 Telegram WebApp found, calling ready()...");
          tg.ready();
          tg.expand();

          setTimeout(() => {
            const user = tg.initDataUnsafe?.user;

            if (user && user.id) {
              console.log(
                `✅ User data found: ID=${user.id}, Name=${user.first_name}`
              );

              // Check for referral code from Telegram if we don't have one yet
              if (!referralCode && tg.initDataUnsafe?.start_param) {
                const tgReferralCode = tg.initDataUnsafe.start_param;
                console.log(
                  `✅ Late referral code from Telegram: ${tgReferralCode}`
                );
                setReferralCode(tgReferralCode);
                storeReferralCode(tgReferralCode);
              }

              setTgUser(user);
            } else if (retryCount < maxRetries - 1) {
              console.log(
                `❌ No user data yet, retrying... (attempt ${retryCount + 1})`
              );
              retryCount++;
              retryTimeout = setTimeout(initializeTelegramWebApp, 300);
            } else {
              console.log("❌ Failed to get user data after all retries");
              setError(
                "Unable to get user information from Telegram. Please make sure you opened this through the Telegram bot."
              );
              setIsLoading(false);
            }
          }, 200);
        } else if (retryCount < maxRetries - 1) {
          console.log(
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
            console.log("🛠️ Development mode detected - using mock data");
            setTgUser({
              id: 123456789,
              first_name: "Dev",
              last_name: "User",
              username: "devuser",
            });
          } else {
            console.log("❌ Telegram WebApp not available after all retries");
            setError("This app must be opened through Telegram");
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.log(`💥 Error initializing Telegram WebApp: ${err.message}`);
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
  }, [referralCode]);

  useEffect(() => {
    const authenticateTelegramUser = async () => {
      if (!tgUser) return;

      try {
        setIsLoading(true);

        const telegramId = tgUser.id;
        const first_name = tgUser.first_name || "";
        const last_name = tgUser.last_name || "";
        const username = tgUser.username || "";

        console.log("=== AUTHENTICATION START ===");
        console.log(`User: ${first_name} (ID: ${telegramId})`);
        console.log(`Referral code: ${referralCode || "null"}`);

        if (referralCode) {
          toast.info(`🎁 Processing referral bonus: ${referralCode}`);
        }

        const authResult = await telegramOauth(
          telegramId,
          first_name,
          last_name,
          username,
          referralCode || null
        );

        console.log(
          `✅ Auth successful: ${authResult?.user?.first_name || "Unknown"}`
        );

        // Mark user as registered after successful authentication
        markUserAsRegistered();

        // Show success message
        if (referralCode) {
          toast.success(
            `🎉 Welcome! Referral bonus applied with code: ${referralCode}`
          );
        } else {
          toast.success("🎉 Welcome to BabyRoy!");
        }

        navigate(from, { replace: true });
      } catch (error) {
        console.log(`❌ Auth failed: ${error.message}`);
        setError("Authentication failed. Please try again.");
        toast.error("Authentication failed. Please try again.");
        setIsLoading(false);
      }
    };

    authenticateTelegramUser();
  }, [tgUser, telegramOauth, from, navigate, referralCode]);

  // Loading state
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
            {referralCode && (
              <p className="text-xs text-paws-accent mt-2">
                🎁 Processing referral bonus ({referralCode})...
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Initializing Telegram connection
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
        </div>
      </div>
    );
  }

  return <p>Authentication complete</p>;
};

export default LoginPage;
