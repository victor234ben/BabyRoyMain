import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthCheck } from "@/hooks/use-auth";
import { Loader } from "lucide-react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuthCheck();
  const location = useLocation();
  console.log(isAuthenticated);

  if (loading) {
    return (
      <div className="block w-full">
        <div className="text-center flex-col flex w-full h-full items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-paws-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-center block">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
