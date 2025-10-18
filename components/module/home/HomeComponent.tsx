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
import RoomItemCard from "@/components/global/RoomItemCard";

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
                  return <RoomItemCard room={r} key={r.code} />;
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
