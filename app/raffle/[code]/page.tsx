"use client";

import BottomNavLayout from "@/layout/BottomNavLayout";
import React from "react";
import DetailRaffleComponent from "@/components/module/raffle/DetailRaffleComponent";

export default function RafflePage() {
  return (
    <BottomNavLayout>
      <DetailRaffleComponent />
    </BottomNavLayout>
  );
}
