import { useEffect, useState } from "react";
import {
  initDataRaw as _initDataRaw,
  initDataState as _initDataState,
  type User,
  useSignal,
} from "@telegram-apps/sdk-react";
import { Link } from "react-router-dom";

const CheckIdPage = () => {
  const initDataState = useSignal(_initDataState);

  const [user] = useState<User>(initDataState?.user as User);

  useEffect(() => {
    console.log(user.id);
  }, []);

  return (
    <div>
      <Link to="/login">Login</Link>
    </div>
  );
};

export default CheckIdPage;
