import "./patchCustomElements";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import ReferralsPage from "./pages/ReferralsPage";
// import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import LeaderBoardPage from "./pages/LeaderBoardPage";
import TelegramLogin from "./pages/TelegramLogin";
import { debugNetworkRequests } from "./lib/debugNetworkRequests";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { tonConnectConfig } from "./config/tonconnect";
import { useEffect } from "react";

const queryClient = new QueryClient();

// debugNetworkRequests();

const App = () => {
 
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      return;
    }
  }, []);

   useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return (
    <TonConnectUIProvider manifestUrl={tonConnectConfig.manifestUrl}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/telegramLogin" element={<TelegramLogin />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute>
                      <TasksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <LeaderBoardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/referrals"
                  element={
                    <ProtectedRoute>
                      <ReferralsPage />
                    </ProtectedRoute>
                  }
                />
                {/* <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            /> */}

                {/* Not Found Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </TonConnectUIProvider>
  );
};

export default App;
