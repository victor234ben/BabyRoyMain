import AppLayout from "@/components/layout/AppLayout";
import { tokenIcon } from "@/images";
import { Trophy } from "lucide-react";
import { useState } from "react";

type LeaderboardItem = {
  wallet: string;
  balance: string;
  place: string | number;
  medal?: "🥇" | "🥈" | "🥉";
};

const LeaderBoardPage = () => {
  const [displayLb] = useState(false);
  const leaderboardData: LeaderboardItem[] = [
    { wallet: "Pishnahad_Sup", balance: "53,137,490", place: "🥇" },
    { wallet: "imGet", balance: "52,374,426", place: "🥈" },
    { wallet: "Esalat", balance: "45,459,702", place: "🥉" },
    { wallet: "mehranseydi", balance: "42,660,196", place: "#4" },
    { wallet: "abbas", balance: "34,626,638", place: "#5" },
    { wallet: "CenterProd", balance: "32,032,520", place: "#6" },
    { wallet: "tuxeoqt", balance: "31,568,259", place: "#7" },
    { wallet: "ladesov", balance: "28,707,823", place: "#8" },
  ];

  return (
    <AppLayout>
      {!displayLb && (
        <div className="h-screen w-full flex text-center justify-center items-center">
          <h1 className="text-white">LeaderBoard Coming soon</h1>
        </div>
      )}
      {displayLb && (
        <div className="mt-[50px]">
          <div className={`leaderboard-tab-con transition-all duration-300`}>
            {/* Header */}
            <div className="px-4">
              <div className="flex flex-col items-center mt-4">
                <Trophy />
                <h1 className="text-2xl font-bold mb-2">Leaderboard</h1>
                <div className="w-full mt-2 px-6 py-1 flex justify-between rounded-lg text-sm font-medium text-[#fefefe] bg-[#151516]">
                  <span>Total</span>
                  <span>23,253,686 users</span>
                </div>
              </div>

              {/* Current User Stats */}
              <div className="bg-white rounded-2xl p-6 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 p-1.5 bg-black rounded-lg">
                      <img src={tokenIcon} className="w-full h-full" />
                    </div>
                    <div className="text-black font-medium">
                      <div className="text-base">nikandr_s</div>
                      <div className="text-xs">4,646 BabyRoy</div>
                    </div>
                  </div>
                  <div className="text-black">#15,355,328</div>
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="mt-4 space-y-0 rounded-t-2xl">
                {leaderboardData.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 flex items-center justify-between border-b-[1px] border-[#222622] ${
                      index === 0
                        ? "bg-[#2d2b1b] rounded-t-2xl"
                        : index === 1
                        ? "bg-[#272728]"
                        : index === 2
                        ? "bg-[#2d241b]"
                        : "bg-[#151515]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 p-1.5 bg-white rounded-lg">
                        <img
                          src={tokenIcon}
                          className="w-full h-full text-black"
                        />
                      </div>
                      <div>
                        <div className="text-base font-medium">
                          {item.wallet}
                        </div>
                        <div className="text-sm font-medium text-[#7c7c7c]">
                          {item.balance} BabyRoy
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-base font-medium ${
                        typeof item.place === "string" &&
                        item.place.startsWith("#")
                          ? "text-white"
                          : ""
                      }`}
                    >
                      {item.place}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default LeaderBoardPage;
