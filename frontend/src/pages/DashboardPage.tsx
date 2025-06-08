import { useState, useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import AppLayout from "@/components/layout/AppLayout";
import { dashboardAPI, DashboardData } from "@/services/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import Community from "@/icons/Community";

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardAPI.getData();
        setDashboardData(data.dashboard);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AppLayout>
      <div className="p-2.5 space-y-6 pt-10">
        <div className={`home-tab-con transition-all duration-300 pt-1.5`}>
          {/* BabyRoy Balance */}
          <div className="flex flex-col items-center mt-8">
            <div className="flex items-center gap-1 text-center mt-[150px]">
              <CardContent className=" p-0 flex items-center justify-center opacity-85 bg-[#041c31] w-[350px] h-[80px] rounded-xl">
                {loading ? (
                  <Skeleton className="h-full w-full bg-white/20" />
                ) : (
                  <div className="text-5xl font-bold text-white flex gap-2 items-center justify-center">
                    <span>
                      {(dashboardData?.totalEarned || 0).toLocaleString()}
                    </span>

                    <div className="text-white font-medium text-xl">
                      BabyRoy
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 px-4 mt-8 mb-8">
            <a
              href="https://t.me/babyroyarmy"
              target="_blank"
              className="shine-effect w-full text-white bg-[#ffffff0d] border-[1px] border-[#2d2d2e] rounded-lg px-4 py-2 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 font-medium">
                <Community className="w-8 h-8" />
                <span className="text-white">Join our community</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
