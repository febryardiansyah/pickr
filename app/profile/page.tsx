"use client";

import React from "react";
import BottomNavLayout from "../../layout/BottomNavLayout";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/global/ButtonComponent";

export default function ProfilePage() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect, isPending } = useDisconnect();

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  return (
    <BottomNavLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Profile</h1>

        <div className="rounded-xl border border-[var(--app-border)] bg-[rgba(17,23,31,0.35)] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--ock-text-foreground-muted)]">
                Connected wallet {chain ? `on ${chain.name}` : ""}
              </p>
              <p className="text-base font-medium">
                {isConnected ? shortAddress : "Not connected"}
              </p>
            </div>
            {isConnected && (
              <Button
                variant="outline"
                size="md"
                onClick={() => disconnect()}
                disabled={isPending}
              >
                {isPending ? "Disconnecting…" : "Disconnect"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </BottomNavLayout>
  );
}
