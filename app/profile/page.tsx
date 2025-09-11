"use client";

import React from "react";
import BottomNavLayout from "../../layout/BottomNavLayout";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/global/ButtonComponent";
import { Card } from "@/components/global/CardComponent";
import { shortAddress } from "@/lib/utils";

export default function ProfilePage() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect, isPending } = useDisconnect();

  return (
    <BottomNavLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold mt-4">Profile</h1>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--ock-text-foreground-muted)]">
                Connected wallet {chain ? `on ${chain.name}` : ""}
              </p>
              <p className="text-base font-medium">
                {isConnected ? shortAddress(address) : "Not connected"}
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
        </Card>
      </div>
    </BottomNavLayout>
  );
}
