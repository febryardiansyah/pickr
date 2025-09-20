"use client";

import BottomNavLayout from "@/layout/BottomNavLayout";
import React from "react";
import DetailRoomComponent from "@/components/module/room/DetailRoomComponent";

export default function RoomPage() {
  return (
    <BottomNavLayout>
      <DetailRoomComponent />
    </BottomNavLayout>
  );
}
