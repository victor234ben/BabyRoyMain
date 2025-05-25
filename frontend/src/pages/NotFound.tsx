
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-paws-primary/5 to-paws-accent/5 p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="bg-paws-primary rounded-xl p-4">
            <PawPrint className="h-16 w-16 text-white" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold mb-2 text-paws-primary">404</h1>
        <p className="text-2xl font-medium mb-6">Oops! Page not found</p>
        
        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Button asChild className="bg-paws-primary hover:bg-paws-accent">
          <Link to="/">
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
