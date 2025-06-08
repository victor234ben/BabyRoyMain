import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { referralAPI, Referral, ReferralInfo } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Share, Copy, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

import { tokenIcon } from "@/images";
import { Separator } from "@radix-ui/react-context-menu";

const ReferralsPage = () => {
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [referralsList, setReferralsList] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  console.log(referralInfo);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch referral info and list in parallel
        const [info, list] = await Promise.all([
          referralAPI.getReferralInfo(),
          referralAPI.getReferralsList(),
        ]);

        setReferralInfo(info.referralInfo);
        setReferralsList(list.referrals);
      } catch (error) {
        console.error("Error fetching referral data:", error);
        toast.error("Failed to load referral data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCopyCode = () => {
    if (!referralInfo?.referralCode) return;

    navigator.clipboard
      .writeText(referralInfo.referralCode)
      .then(() => {
        setCopied(true);
        toast.success("Referral code copied to clipboard");

        setTimeout(() => {
          setCopied(false);
        }, 3000);
      })
      .catch(() => {
        toast.error("Failed to copy code");
      });
  };

  const handleShareCode = () => {
    if (!referralInfo?.referralCode) return;

    const shareText = `Join me on BabyRoy and earn rewards! Use my referral link: https://t.me/babyroybot?start=${referralInfo.referralCode}`;

    if (navigator.share) {
      navigator
        .share({
          title: "BabyRoy Referral",
          text: shareText,
          url: `https://t.me/babyroybot?start=${referralInfo.referralCode}`,
        })
        .catch((error) => {
          console.error("Error sharing:", error);
        });
    } else {
      navigator.clipboard
        .writeText(shareText)
        .then(() => {
          toast.success("Referral message copied to clipboard");
        })
        .catch(() => {
          toast.error("Failed to copy message");
        });
    }
  };

  return (
    <AppLayout>
      <div className="p-2.5 space-y-6 pt-10">
        <div
          className={`friends-tab-con px-4 pb-24 transition-all duration-300`}
        >
          {/* Header Text */}
          <div className=" space-y-1">
            <h1 className="text-3xl font-bold text-white">INVITE FRIENDS</h1>
            <div className="text-xl">
              <span className="font-semibold text-white">SHARE</span>
              <span className="ml-2 text-gray-500">YOUR INVITATION</span>
            </div>
            <div className="text-xl">
              <span className="text-gray-500">LINK &</span>
              <span className="ml-2 font-semibold text-white">GET 10%</span>
              <span className="ml-2 text-gray-500">OF</span>
            </div>
            <div className="text-gray-500 text-xl">FRIEND'S POINTS</div>
          </div>

          {/* Empty State */}
          <div className="mt-8 mb-2">
            <div className="bg-[#151516] w-full rounded-2xl p-7 flex flex-col items-center">
              <img
                src={tokenIcon}
                alt="Paws"
                width={171}
                height={132}
                className="mb-4"
              />
              <p className="text-xl text-[#8e8e93] text-center flex flex-row flex-nowrap">
                Your referral code is{" "}
                <span className="text-white text-xl pl-1.5 flex flex-row flex-nowrap">
                  {referralInfo?.referralCode || "LOADING"}{" "}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopyCode}
                    className="h-8 w-8 ml-1.5 rounded-full bg-white/20 hover:bg-white/30"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </span>
                <br />
              </p>
              <p className="text-xl text-[#8e8e93] text-center">
                {" "}
                Invite to get more rewards.
              </p>
            </div>
          </div>

          {/* referral list */}
          <div className="space-y-4">
            <h2 className="text-xl text-white font-bold mb-4">
              Your Referrals
            </h2>
          </div>
          <div>
            <Card>
              <CardContent className="pt-2">
                {loading ? (
                  <div className="space-y-4">
                    {Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="flex items-center py-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="ml-4 space-y-1 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))}
                  </div>
                ) : referralsList?.length === 0 ? (
                  <div className="text-center py-8">
                    <Share className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium mb-1">
                      No referrals yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Share your referral code with friends to start earning
                      rewards
                    </p>
                    <Button
                      className="bg-[#041c31] text-white"
                      onClick={handleShareCode}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share Your Code
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {referralsList?.map((referral, index) => (
                      <div key={referral.id}>
                        <div className="flex items-center justify-between py-3">
                          <div className="flex items-center">
                            <Avatar>
                              <AvatarFallback className="text-white bg-[#041c31]">
                                {referral.first_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <div className="font-medium">
                                {referral.first_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Joined{" "}
                                {format(
                                  new Date(referral.createdAt),
                                  "MMM dd, yyyy"
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < referralsList.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="item-center flex justify-center">
            <div className="w-full max-w-md px-4">
              <button
                onClick={handleShareCode}
                className="w-full bg-[#041c31] text-white py-4 rounded-xl text-lg font-medium"
              >
                Invite
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReferralsPage;
