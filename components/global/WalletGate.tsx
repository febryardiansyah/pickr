"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletGate() {
  const { isConnected } = useAccount();

  if (isConnected) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl dark:bg-zinc-900">
        <h2 className="mb-2 text-lg font-semibold">Connect your wallet</h2>
        <p className="mb-5 text-sm text-zinc-600 dark:text-zinc-300">
          Please connect a wallet to continue using the app.
        </p>
        <div className="flex justify-center">
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </div>
  );
}
