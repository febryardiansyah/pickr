"use client";

import React from "react";
import BottomNavLayout from "@/layout/BottomNavLayout";
import NewRoomComponent from "@/components/module/room/NewRoomComponent";

export default function CreateRoomPage() {
  return (
    <BottomNavLayout>
      <NewRoomComponent />
    </BottomNavLayout>
  );
}
