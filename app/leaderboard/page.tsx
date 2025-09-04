"use client";

import React from "react";
import BottomNavLayout from "../../layout/BottomNavLayout";

export default function LeaderboardPage() {
  return (
    <BottomNavLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Leaderboard</h1>
        <p className="text-sm text-[var(--ock-text-foreground-muted)]">
          Coming soon: top participants will appear here.
        </p>
      </div>
    </BottomNavLayout>
  );
}
