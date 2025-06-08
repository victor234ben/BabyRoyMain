export {};

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        platform: any;
        version: any;
        colorScheme: any;
        themeParams: any;
        isExpanded: any;
        viewportHeight: any;
        viewportStableHeight: any;
        initData: string;
        initDataUnsafe: {
          id?: number;
          first_name?: string;
          last_name?: string;
          username?: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          [key: string]: any;
        };
        expand(): void;
        close(): void;
        sendData(data: string): void;
        ready(): void;
        // You can extend this further based on the Telegram WebApp API
      };
    };
  }
}


export const initTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    return tg;
  }
  return null;
};