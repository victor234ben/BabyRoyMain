import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { profileAPI } from "@/services/api";

// This hook extends the functionality from the AuthContext
// with additional authentication-related utilities
export const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get user profile - will fail if not authenticated
        await profileAPI.getProfile();
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      // Only redirect to login if we're not already on an auth page
      const authPages = ["/login", "/register"];
      if (!authPages.includes(location.pathname)) {
        navigate("/login", {
          state: { from: location.pathname },
          replace: true,
        });
      }
    }
  }, [isAuthenticated, navigate, location.pathname]);

  return { isAuthenticated, loading: isAuthenticated === null };
};
