"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import React, { useEffect } from "react";
import HomeComponent from "../components/module/home/HomeComponent";
import BottomNavLayout from "../layout/BottomNavLayout";
import { sdk } from "@farcaster/miniapp-sdk";

export default function App() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const [user, setUser] = React.useState(null);

  useEffect(() => {
    if (!isFrameReady) {
      (async () => {
        const BACKEND_ORIGIN = "https://hono-backend.miniapps.farcaster.xyz";

        const res = await sdk.quickAuth.fetch(`${BACKEND_ORIGIN}/me`);
        if (res.ok) {
          setUser(await res.json());
          sdk.actions.ready();
        }
      })();
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  if (!user) {
    return null;
  }

  return (
    <BottomNavLayout>
      <HomeComponent />
    </BottomNavLayout>
  );
}
