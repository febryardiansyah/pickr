import { TUserRoomItem } from "@/type/contract";
import React from "react";
import { Button } from "./ButtonComponent";
import { useRouter } from "next/navigation";

export default function RoomItemCard({ room }: { room: TUserRoomItem }) {
  const router = useRouter();

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
      case "open":
        return {
          text: "ACTIVE",
          color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
        };
      case "started":
        return {
          text: "STARTED",
          color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
        };
      case "closed":
      case "inactive":
        return {
          text: "INACTIVE",
          color: "bg-amber-500/10 text-amber-500 border-amber-500/30",
        };
      default:
        return {
          text: status.toUpperCase(),
          color: "bg-gray-500/10 text-gray-500 border-gray-500/30",
        };
    }
  };

  const statusDisplay = getStatusDisplay(room.status);

  return (
    <li
      key={room.code}
      className="rounded-lg border border-[var(--app-card-border)] bg-[var(--app-card)] p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium mb-1">
            <span className="font-mono truncate max-w-[12rem]">
              {room.title} [#{room.code}]
            </span>
            <span
              className={`px-2 py-0.5 rounded-full border text-[10px] ${statusDisplay.color}`}
            >
              {statusDisplay.text}
            </span>
          </div>
          <div className="text-xs text-[var(--app-foreground-muted)] flex items-center gap-2 mt-1">
            <span>
              {room.participants.length}/{room.maxParticipants} participants
            </span>
            {room.initialDepositEth !== "0" && (
              <span>• {room.initialDepositEth} ETH</span>
            )}
          </div>
          <div className="text-sm text-[var(--app-foreground-muted)] flex items-center gap-2 mt-1 text-blue-400 font-medium">
            <span>
              {room.accessMode.charAt(0).toUpperCase() +
                room.accessMode.slice(1)}{" "}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          shadow={false}
          onClick={() => router.push(`/room/${room.code}`)}
        >
          Open
        </Button>
      </div>
    </li>
  );
}
