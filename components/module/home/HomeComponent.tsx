"use client";

import React, { useMemo, useState } from "react";
import { Button } from "../../global/ButtonComponent";
import { JoinRoomDialog } from "./JoinRoomDialog";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { shortAddress } from "@/lib/utils";
import abi from "@/contracts/abi.json";
import type { TUserRoomItem, RoomStatus } from "@/type/contract";

export default function HomeComponent() {
  const [showJoin, setShowJoin] = useState(false);
  const router = useRouter();
  const { address } = useAccount();

  const CONTRACT_ADDRESS = useMemo(
    () => process.env.NEXT_PUBLIC_ROOM_CONTRACT as `0x${string}` | undefined,
    [],
  );

  const {
    data: userRoomsRaw,
    isPending: loadingUserRooms,
    error: userRoomsError,
  } = useReadContract({
    chainId: 84532,
    abi,
    address: CONTRACT_ADDRESS,
    functionName: "getUserRooms",
    args: [address as `0x${string}`],
    query: { enabled: Boolean(CONTRACT_ADDRESS && address) },
  });

  const userRooms: TUserRoomItem[] = useMemo(() => {
    if (!userRoomsRaw) return [];
    try {
      const [rooms, codes] = userRoomsRaw as unknown as [
        readonly [
          `0x${string}`,
          bigint,
          number | bigint,
          bigint,
          bigint,
          bigint,
          bigint | number | undefined,
        ][],
        readonly string[],
      ];
      return rooms.map((r, i) => ({
        code: codes[i],
        creator: r[0],
        balance: r[1],
        status: Number(r[2] ?? 0) as RoomStatus,
        max: typeof r[3] === "bigint" ? Number(r[3]) : Number(r[3] || 0),
        min: typeof r[4] === "bigint" ? Number(r[4]) : Number(r[4] || 0),
        total: typeof r[5] === "bigint" ? Number(r[5]) : Number(r[5] || 0),
        createdAt: typeof r[6] === "bigint" ? Number(r[6]) : (r[6] as number | undefined),
      }));
    } catch (e) {
      console.warn("Failed to parse getUserRooms result", e, userRoomsRaw);
      return [];
    }
  }, [userRoomsRaw]);

  const statusText = (s?: number) =>
    s === 0 ? "ACTIVE" : s === 1 ? "INACTIVE" : s === 2 ? "STARTED" : "-";

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="text-lg font-semibold mt-4">
          GM {shortAddress(address)}!
        </div>
        <div className="w-full flex items-center justify-center">
          <div className="grid grid-cols-2 gap-6 w-full h-full max-w-md">
            <Button
              size="lg"
              className="w-full"
              variant="primary"
              shadow={false}
              onClick={() => router.push("/room/new")}
            >
              Create Room
            </Button>
            <Button
              size="lg"
              className="w-full"
              variant="outline"
              shadow={false}
              onClick={() => setShowJoin(true)}
            >
              Join Room
            </Button>
          </div>
        </div>

        {/* Your rooms (from getUserRooms) */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Your rooms</h2>
            {!CONTRACT_ADDRESS && (
              <span className="text-[11px] text-[var(--app-foreground-muted)]">Contract not configured</span>
            )}
          </div>
          {address ? (
            loadingUserRooms ? (
              <div className="text-sm text-[var(--app-foreground-muted)]">Loading…</div>
            ) : userRoomsError ? (
              <div className="text-sm text-red-500">Failed to load rooms</div>
            ) : userRooms.length === 0 ? (
              <div className="text-sm text-[var(--app-foreground-muted)]">No rooms yet. Create one to get started.</div>
            ) : (
              <ul className="flex flex-col gap-2">
                {userRooms.map((r) => (
                  <li key={r.code} className="rounded-lg border border-[var(--app-card-border)] bg-[var(--app-card)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="font-mono truncate max-w-[12rem]">{r.code}</span>
                          <span
                            className={
                              `px-2 py-0.5 rounded-full border text-[10px] ` +
                              (r.status === 0
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : r.status === 2
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                  : "bg-amber-500/10 text-amber-500 border-amber-500/30")
                            }
                          >
                            {statusText(r.status)}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" shadow={false} onClick={() => router.push(`/room/${r.code}`)}>
                        Open
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="text-sm text-[var(--app-foreground-muted)]">Connect your wallet to see your rooms.</div>
          )}
        </div>
        </div>
        <JoinRoomDialog
          open={showJoin}
          onClose={() => setShowJoin(false)}
          onSubmit={(code) => {
            console.log("Joining room with code:", code);
            router.push(`/room/${code.trim()}`);
          }}
        />
    </>
  );
}
