import { type FC, useEffect, useMemo } from "react";
import {
  initDataRaw as _initDataRaw,
  initDataState as _initDataState,
  type User,
  useSignal,
} from "@telegram-apps/sdk-react";
import { List, Placeholder } from "@telegram-apps/telegram-ui";

import {
  DisplayData,
  type DisplayDataRow,
} from "@/components/DisplayData/DisplayData.tsx";
import { Page } from "@/components/Page.tsx";
import { Link } from "react-router-dom";

function getUserRows(user: User): DisplayDataRow[] {
  return Object.entries(user).map(([title, value]) => ({ title, value }));
}

export const InitDataPage: FC = () => {
  const initDataRaw = useSignal(_initDataRaw);
  const initDataState = useSignal(_initDataState);

  const initDataRows = useMemo<DisplayDataRow[] | undefined>(() => {
    if (!initDataState || !initDataRaw) {
      return;
    }
    return [
      { title: "raw", value: initDataRaw },
      ...Object.entries(initDataState).reduce<DisplayDataRow[]>(
        (acc, [title, value]) => {
          if (value instanceof Date) {
            acc.push({ title, value: value.toISOString() });
          } else if (!value || typeof value !== "object") {
            acc.push({ title, value });
          }
          return acc;
        },
        []
      ),
    ];
  }, [initDataState, initDataRaw]);

  console.log("this is the initdata data", initDataRows);

  useEffect(() => {
    console.log(initDataState?.user);
  }, []);

  const userRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return initDataState && initDataState.user
      ? getUserRows(initDataState.user)
      : undefined;
  }, [initDataState]);

  console.log("this is the user data", userRows);

  const receiverRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return initDataState && initDataState.receiver
      ? getUserRows(initDataState.receiver)
      : undefined;
  }, [initDataState]);

  const chatRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return !initDataState?.chat
      ? undefined
      : Object.entries(initDataState.chat).map(([title, value]) => ({
          title,
          value,
        }));
  }, [initDataState]);

  if (!initDataRows) {
    return (
      <Page>
        <Placeholder
          header="Oops"
          description="Application was launched with missing init data"
        >
          <img
            alt="Telegram sticker"
            src="https://xelene.me/telegram.gif"
            style={{ display: "block", width: "144px", height: "144px" }}
          />
        </Placeholder>
      </Page>
    );
  }
  return (
    <Page>
      <List>
        <DisplayData header={"Init Data"} rows={initDataRows} />
        {userRows && <DisplayData header={"User"} rows={userRows} />}
        {receiverRows && (
          <DisplayData header={"Receiver"} rows={receiverRows} />
        )}
        {chatRows && <DisplayData header={"Chat"} rows={chatRows} />}
      </List>

      <Link to={"/check"}>Check</Link>
      <Link to={"/login"}>Login</Link>
    </Page>
  );
};
