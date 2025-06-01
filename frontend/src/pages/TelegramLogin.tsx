import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const TelegramLogin = () => {
  const { telegramOauth } = useAuth();

  useEffect(() => {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (!tgUser) {
      const telegramId = tgUser.id;
      const firstName = tgUser.first_name || "";
      const lastName = tgUser.last_name || "";
      const username = tgUser.username || "";

      const fullName = `${firstName} ${lastName}`.trim();



      console.log(telegramId, firstName, lastName, username);

      // Send to your backend
      telegramOauth(telegramId, fullName, username);
    }
  }, [telegramOauth]); // run only once on mount

  return <div></div>;
};

export default TelegramLogin;
