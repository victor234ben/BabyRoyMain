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

  // Referral code management functions
  const saveReferralCode = (code: unknown) => {
    if (code && typeof window !== "undefined") {
      const expirationTime = Date.now() + 60 * 60 * 1000; // 1 hour from now
      const referralData = {
        code: code,
        timestamp: Date.now(),
        expiration: expirationTime,
      };

      try {
        sessionStorage.setItem(
          "babyroy_referral",
          JSON.stringify(referralData)
        );
        console.log("Referral code saved:", code);
      } catch (err) {
        console.warn("Could not save referral to session storage:", err);
      }
    }
  };

  const getReferralCode = () => {
    if (typeof window === "undefined") return null;

    try {
      const stored = sessionStorage.getItem("babyroy_referral");
      if (stored) {
        const referralData = JSON.parse(stored);

        // Check if expired
        if (Date.now() > referralData.expiration) {
          sessionStorage.removeItem("babyroy_referral");
          console.log("Referral code expired and removed");
          return null;
        }

        console.log("Retrieved stored referral code:", referralData.code);
        return referralData.code;
      }
    } catch (err) {
      console.warn("Could not retrieve referral from session storage:", err);
    }
    return null;
  };

  const clearReferralCode = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("babyroy_referral");
        console.log("Referral code cleared");
      } catch (err) {
        console.warn("Could not clear referral from session storage:", err);
      }
    }
  };

  useEffect(() => {
    const initializeTelegramWebApp = () => {
      try {
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();

          console.log("Telegram WebApp initialized:", tg.initDataUnsafe);

          // CRITICAL: Extract and save referral code IMMEDIATELY
          let referralCode = null;

          // Method 1: Check start_param from Telegram
          if (tg.initDataUnsafe?.start_param) {
            referralCode = tg.initDataUnsafe.start_param;
            console.log("Referral code from start_param:", referralCode);
          }

          // Method 2: Check URL parameters as fallback
          if (!referralCode) {
            const urlParams = new URLSearchParams(window.location.search);
            referralCode = urlParams.get("ref") || urlParams.get("start");
          }

          // Method 3: Check URL hash
          if (!referralCode && window.location.hash) {
            const hashParams = new URLSearchParams(
              window.location.hash.substring(1)
            );
            referralCode = hashParams.get("start") || hashParams.get("ref");
          }

          // Save referral code if found
          if (referralCode) {
            saveReferralCode(referralCode);
          }

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

        // Get referral code from storage (this ensures persistence across reloads)
        let referralCode = getReferralCode();

        // If not in storage, try to extract again as fallback
        if (!referralCode) {
          const tg = window.Telegram?.WebApp;
          referralCode = tg?.initDataUnsafe?.start_param || null;

          if (!referralCode) {
            const urlParams = new URLSearchParams(window.location.search);
            referralCode = urlParams.get("ref");
          }

          // Save it if we found it
          if (referralCode) {
            saveReferralCode(referralCode);
          }
        }

        // Debug logging
        console.log("=== AUTHENTICATION DEBUG ===");
        console.log("User:", tgUser);
        console.log("Final referral code:", referralCode);
        console.log(
          "Telegram initDataUnsafe:",
          window.Telegram?.WebApp?.initDataUnsafe
        );
        console.log("URL params:", window.location.search);
        console.log(
          "Session storage check:",
          sessionStorage.getItem("babyroy_referral")
        );

        const telegramId = tgUser.id;
        const first_name = tgUser.first_name || "";
        const last_name = tgUser.last_name || "";
        const username = tgUser.username || "";

        // Call telegramOauth with referral code
        const authResult = await telegramOauth(
          telegramId,
          first_name,
          last_name,
          username,
          referralCode
        );

        // Clear referral code after successful authentication
        if (referralCode && authResult) {
          clearReferralCode();
        }

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
          {getReferralCode() && (
            <p className="text-xs text-paws-accent">
              Processing referral bonus...
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
