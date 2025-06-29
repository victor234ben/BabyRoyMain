import React, { useState, useEffect } from "react";
import { Wrench, RefreshCw } from "lucide-react";

const MaintenancePage: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const animationTimer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }, 3000);

    return () => clearInterval(animationTimer);
  }, []);

  return (
    <div className="flex min-h-screen w-full md:max-w-[600px] lg:max-w-md mx-auto">
      <div className="flex flex-col justify-between">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="absolute top-4 left-4 w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="absolute top-12 right-8 w-4 h-4 bg-indigo-500 rounded-full animate-bounce"></div>
            <div className="absolute bottom-8 left-8 w-6 h-6 bg-purple-500 rounded-full animate-ping"></div>
          </div>

          {/* Icon Section */}
          <div className="relative mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
              <Wrench
                size={40}
                className={`text-white transition-transform duration-1000 ${
                  isAnimating ? "rotate-12 scale-110" : "rotate-0 scale-100"
                }`}
              />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md animate-bounce">
              <span className="text-xs">⚡</span>
            </div>
          </div>

          {/* Main Content */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Under Maintenance
          </h1>

          <p className="text-gray-600 mb-8 leading-relaxed">
            We're making some improvements to enhance your experience. Please
            check back in a couple of hours!
          </p>

          {/* Action Button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center group"
          >
            <RefreshCw
              size={20}
              className="mr-2 group-hover:rotate-180 transition-transform duration-500"
            />
            Refresh Page
          </button>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Thank you for your patience 💙
            </p>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-white bg-opacity-70 backdrop-blur-sm rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Need urgent help?</span> Contact our
            support team
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
