
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Baby Roy App</h1>
        <p className="text-xl text-gray-600">
          <Link to={"/dashboard"}>Dashboard</Link>
        </p>
      </div>
    </div>
  );
};

export default Index;
