"use client";

import React, { useState } from "react";
import { Button } from "../../global/ButtonComponent";
import { JoinRaffleDialog } from "./JoinRaffleDialog";
import { useRouter } from "next/navigation";

export default function HomeComponent() {
  const [showJoin, setShowJoin] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="text-lg font-semibold mt-4">Gm febryards!</div>
        <div className="w-full flex items-center justify-center">
          <div className="grid grid-cols-2 gap-6 w-full h-full max-w-md">
            <Button
              size="lg"
              className="w-full"
              variant="primary"
              shadow={false}
              onClick={() => router.push("/raffle/new")}
            >
              Create Raffle
            </Button>
            <Button
              size="lg"
              className="w-full"
              variant="outline"
              shadow={false}
              onClick={() => setShowJoin(true)}
            >
              Join Raffle
            </Button>
          </div>
        </div>
      </div>
      <JoinRaffleDialog
        open={showJoin}
        onClose={() => setShowJoin(false)}
        onSubmit={(code) => {
          console.log("Joining raffle with code:", code);
          router.push(`/raffle/${code.trim()}`);
        }}
      />
    </>
  );
}
