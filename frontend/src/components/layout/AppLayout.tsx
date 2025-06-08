import { ReactNode, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Home, Package, Trophy, Share, User, Settings } from "lucide-react";
import Friends from "@/icons/Friends";
import { useTonConnectUI } from "@tonconnect/ui-react";

interface AppLayoutProps {
  children: ReactNode;
}
type MenuItem = {
  id: number;
  title: string;
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
};

const mainMenuItems: MenuItem[] = [
  { id: 1, title: "Dashboard", path: "/", icon: Home },
  { id: 3, title: "Leaderboard", path: "/leaderboard", icon: Trophy },
  { id: 2, title: "Earn", path: "/tasks", icon: Package },
  { id: 4, title: "Friends", path: "/referrals", icon: Friends },
];

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();

  const { pathname } = location;

  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    const restore = async () => {
      const restored = await tonConnectUI.connectionRestored;
      console.log("Wallet connection restored?", restored);
    };
    restore();
  }, []);

  return (
    <div className="flex min-h-screen w-full md:max-w-[600px] lg:max-w-md mx-auto">
      <div
        className={`${
          pathname === "/" ? "special_background" : "bg-[#041c31]"
        } relative w-full md:max-w-[600px] lg:max-w-md mx-auto flex flex-col items-center flex-1`}
      >
        {/* Main content */}
        <main className=" w-full flex-1 ">{children}</main>

        {/* Bottom nav */}
        <div className=" w-full md:max-w-[600px] lg:max-w-md fixed bottom-2 bg-[#041c31] opacity-95 ">
          <div className="flex justify-between border px-4 py-4 w-[90%] border-gray-4 rounded-2xl 00 mx-auto">
            {mainMenuItems.map((item) => {
              const isActive = item.path === pathname;
              return (
                <button
                  key={item.id}
                  className={`flex flex-col items-center justify-center `}
                >
                  <Link
                    className="text-center flex flex-col items-center justify-center gap-2"
                    to={item.path}
                  >
                    <item.icon
                      className={`w-6 h-6 ${
                        isActive ? "text-[#65a0d3]" : "text-[#727272]"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isActive ? "text-[#4c9ce2]" : "text-[#727272]"
                      }`}
                    >
                      {item.title}
                    </span>
                  </Link>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
