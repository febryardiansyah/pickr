"use client";

import React from "react";
import BottomNavLayout from "../layout/BottomNavLayout";

export default function ProfilePage() {
  return (
    <BottomNavLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-[var(--ock-text-foreground-muted)]">
          Connect your wallet and view your raffle stats here soon.
        </p>
      </div>
    </BottomNavLayout>
  );
}
