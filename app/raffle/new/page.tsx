"use client";

import React from "react";
import BottomNavLayout from "@/layout/BottomNavLayout";
import NewRaffleComponent from "@/components/module/raffle/NewRaffleComponent";

export default function CreateRafflePage() {
  return (
    <BottomNavLayout>
      <NewRaffleComponent />
    </BottomNavLayout>
  );
}
