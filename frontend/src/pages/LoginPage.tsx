import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader, PawPrint } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
  const { telegramOauth, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || "/dashboard";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    const initTelegramLogin = async () => {
      try {
        if (typeof window === "undefined" || !window.Telegram?.WebApp) {
          throw new Error("This app must be opened through Telegram.");
        }

        const tg = window.Telegram.WebApp;
        tg.ready();

        const user = tg.initDataUnsafe?.user;
        if (!user || !user.id) {
          throw new Error("Unable to retrieve Telegram user.");
        }

        // Expand UI & auth user
        tg.expand();

        await telegramOauth(
          user.id,
          user.first_name || "",
          user.last_name || "",
          user.username || ""
        );

        setIsLoading(false); // navigate will be triggered by context
      } catch (err: any) {
        console.error("Telegram login failed:", err);
        setError(err.message || "Telegram login failed.");
        setIsLoading(false);
      }
    };

    if (!isAuthenticated) {
      initTelegramLogin();
    }
  }, [telegramOauth, isAuthenticated]);

  if (isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-paws-primary/20 to-paws-accent/20 p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
            <PawPrint className="h-8 w-8 text-white" />
          </div>
          <Loader className="animate-spin w-8 h-8 text-paws-primary" />
          <p className="text-paws-primary font-medium text-center">
            Connecting to Telegram...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-paws-primary/20 to-paws-accent/20 p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
            <PawPrint className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-red-600">Login Error</h2>
          <p className="text-red-500 max-w-md text-sm">{error}</p>
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Kindly close and reopen the app. Thanks
            </button>
            {error.includes("Telegram") && (
              <button
                onClick={() => window.Telegram?.WebApp?.close()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                Return to Telegram
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <p>Authentication complete</p>;
};

export default LoginPage;
