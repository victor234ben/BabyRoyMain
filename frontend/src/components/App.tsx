import { useMemo } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import {
  retrieveLaunchParams,
  useSignal,
  isMiniAppDark,
} from "@telegram-apps/sdk-react";
import { AppRoot } from "@telegram-apps/telegram-ui";

import { routes } from "@/navigation/routes.tsx";
import { Toaster } from "./ui/toaster";
import { Toaster as Sonner } from "./ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/NotFound";

export function App() {
  const lp = useMemo(() => retrieveLaunchParams(), []);
  const isDark = useSignal(isMiniAppDark);

  return (
    <AppRoot
      appearance={isDark ? "dark" : "light"}
      platform={["macos", "ios"].includes(lp.tgWebAppPlatform) ? "ios" : "base"}
    >
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} {...route} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AppRoot>
  );
}
