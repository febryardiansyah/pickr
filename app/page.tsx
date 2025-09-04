"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";
import HomeComponent from "./components/module/home/HomeComponent";
import BottomNavLayout from "./layout/BottomNavLayout";

export default function App() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <BottomNavLayout>
      <HomeComponent />
    </BottomNavLayout>
  );
}
