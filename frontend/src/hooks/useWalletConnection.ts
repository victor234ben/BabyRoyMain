import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useCallback } from "react";

export const useWalletConnection = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const connectWallet = useCallback(async () => {
    try {
      await tonConnectUI.openModal();
      return new Promise((resolve, reject) => {
        const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
          if (wallet) {
            unsubscribe();
            resolve(wallet.account.address);
          }
        });

        // Handle modal close without connection
        tonConnectUI.onModalStateChange((state) => {
          if (state.status === "closed" && !wallet) {
            unsubscribe();
            reject(new Error("Modal closed without connection"));
          }
        });
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }, [tonConnectUI, wallet]);

  const disconnectWallet = useCallback(async () => {
    await tonConnectUI.disconnect();
  }, [tonConnectUI]);

  return {
    wallet,
    connectWallet,
    disconnectWallet,
    isConnected: !!wallet,
    walletAddress: wallet?.account.address,
  };
};
