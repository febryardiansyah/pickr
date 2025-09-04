"use client";

import { useMiniKit, useOpenUrl } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";
import { Button } from "./components/global/ButtonComponent";
import HomeComponent from "./components/module/home/HomeComponent";
import BottomNavLayout from "./layout/BottomNavLayout";

export default function App() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  // State previously used for in-component tab navigation removed in favor of layout nav

  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Frame adding logic removed with Save Frame button

  // SaveFrame button removed for now; can be reintroduced in a shared header if needed

  return (
    <BottomNavLayout>
  {/* Header removed; can be added back if needed */}
      <HomeComponent />
      <footer className="mt-2 pt-4 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-[var(--ock-text-foreground-muted)] text-xs"
          onClick={() => openUrl("https://base.org/builders/minikit")}
        >
          Built on Base with MiniKit
        </Button>
      </footer>
    </BottomNavLayout>
  );
}
