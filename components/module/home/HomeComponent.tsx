"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../../global/ButtonComponent";
import { JoinRoomDialog } from "./JoinRoomDialog";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { shortAddress } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import type { TUserRoomItem } from "@/type/contract";

export default function HomeComponent() {
  const [showJoin, setShowJoin] = useState(false);
  const [userRooms, setUserRooms] = useState<TUserRoomItem[]>([]);
  const [loadingUserRooms, setLoadingUserRooms] = useState(false);
  const [userRoomsError, setUserRoomsError] = useState<string | null>(null);
  const router = useRouter();
  const { address } = useAccount();

  // Fetch user rooms from Firestore
  useEffect(() => {
    if (!address) {
      setUserRooms([]);
      return;
    }

    const fetchUserRooms = async () => {
      setLoadingUserRooms(true);
      setUserRoomsError(null);

      try {
        const q = query(
          collection(db, "rooms"),
          where("creator", "==", address),
          orderBy("createdAt", "desc"),
        );

        const querySnapshot = await getDocs(q);
        const rooms: TUserRoomItem[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          rooms.push({
            accessMode: data.accessMode || "private",
            code: data.code || doc.id,
            createdAt:
              data.createdAt?.toDate?.() || data.createdAt || new Date(),
            creator: data.creator || "",
            initialDepositEth: data.initialDepositEth || "0",
            maxParticipants: data.maxParticipants || 0,
            minParticipants: data.minParticipants || 0,
            participants: data.participants || [],
            password: data.password || "",
            status: data.status || "open",
            title: data.title || "",
            totalWinners: data.totalWinners || 0,
          } as TUserRoomItem);
        });

        setUserRooms(rooms);
      } catch (error) {
        console.error("Error fetching user rooms:", error);
        setUserRoomsError("Failed to load rooms");
      } finally {
        setLoadingUserRooms(false);
      }
    };

    fetchUserRooms();
  }, [address]);

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
      case "active":
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

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Your rooms</h2>
          </div>
          {address ? (
            loadingUserRooms ? (
              <div className="text-sm text-[var(--app-foreground-muted)]">
                Loading…
              </div>
            ) : userRoomsError ? (
              <div className="text-sm text-red-500">{userRoomsError}</div>
            ) : userRooms.length === 0 ? (
              <div className="text-sm text-[var(--app-foreground-muted)]">
                No rooms yet. Create one to get started.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {userRooms.map((r) => {
                  const statusDisplay = getStatusDisplay(r.status);
                  return (
                    <li
                      key={r.code}
                      className="rounded-lg border border-[var(--app-card-border)] bg-[var(--app-card)] p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium mb-1">
                            <span className="font-mono truncate max-w-[12rem]">
                              {r.title} [#{r.code}]
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] ${statusDisplay.color}`}
                            >
                              {statusDisplay.text}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--app-foreground-muted)] flex items-center gap-2 mt-1">
                            <span>
                              {r.participants.length}/{r.maxParticipants}{" "}
                              participants
                            </span>
                            {r.initialDepositEth !== "0" && (
                              <span>• {r.initialDepositEth} ETH</span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          shadow={false}
                          onClick={() => router.push(`/room/${r.code}`)}
                        >
                          Open
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <div className="text-sm text-[var(--app-foreground-muted)]">
              Connect your wallet to see your rooms.
            </div>
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
