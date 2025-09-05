"use client";

import BottomNavLayout from "@/layout/BottomNavLayout";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/global/ButtonComponent";
import { Card } from "@/components/global/CardComponent";
import { Dialog } from "@/components/global/DialogComponent";
import { Input } from "@/components/global/InputComponent";

export default function RafflePage() {
  const router = useRouter();
  const params = useParams();
  const raffleCode = params?.code;

  const host = {
    name: "Host User",
    address: "0x1234...ABCD",
  };
  const [participants] = useState([
    { id: 1, name: "Alice", address: "0xA1c3...1111" },
    { id: 2, name: "Bob", address: "0xB0b0...2222" },
    { id: 3, name: "Charlie", address: "0xC0de...3333" },
    { id: 4, name: "David", address: "0xD4v1...4444" },
    { id: 5, name: "Eve", address: "0xE7e7...5555" },
    { id: 6, name: "Frank", address: "0xF47k...6666" },
    { id: 7, name: "Grace", address: "0xG4c3...7777" },
    { id: 8, name: "Henry", address: "0xH3n7...8888" },
    { id: 9, name: "Ivy", address: "0x1v7y...9999" },
    { id: 10, name: "Jack", address: "0xJ4ck...AAAA" },
  ] as { id: number; name: string; address: string }[]);

  const [totalReward, setTotalReward] = useState<number>(250); // USDC
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [starting, setStarting] = useState(false);

  const handleDeposit = () => {
    const v = Number(depositAmount);
    if (!isNaN(v) && v > 0) {
      setTotalReward((prev) => prev + v);
      setDepositAmount("");
      setDepositOpen(false);
    }
  };

  const handleStartRaffle = async () => {
    try {
      setStarting(true);
      await new Promise((r) => setTimeout(r, 1200));
      console.log("Raffle started for:", raffleCode);
    } finally {
      setStarting(false);
    }
  };

  return (
    <BottomNavLayout>
      <div className="flex flex-col gap-6 pb-24 animate-fade-in">
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="sm"
              shadow={false}
              onClick={() => router.push("/")}
              aria-label="Go back"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              }
              className="px-2"
            >
              Back
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-wide text-[var(--app-foreground)]">
                Raffle #{raffleCode}
              </h1>
              <p className="text-xs text-[var(--app-foreground-muted)]">
                Hosted by{" "}
                <span className="text-[var(--app-foreground)] font-medium">
                  {host.name}
                </span>{" "}
                ({host.address})
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 col-span-2 sm:col-span-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">
                Total Rewards (USDC)
              </span>
              <span className="text-2xl font-semibold text-[var(--app-foreground)]">
                {totalReward.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                })}
              </span>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDepositOpen(true)}
                >
                  Deposit
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={participants.length === 0 || starting}
                  onClick={handleStartRaffle}
                >
                  {starting ? "Starting..." : "Start Raffle"}
                </Button>
              </div>
            </div>
          </Card>
          <Card className="p-4 col-span-2 sm:col-span-1">
            <div className="flex flex-col gap-1 h-full">
              <span className="text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">
                Participants
              </span>
              <span className="text-2xl font-semibold text-[var(--app-foreground)]">
                {participants.length}
              </span>
              <span className="text-[11px] text-[var(--app-foreground-muted)] mt-auto">
                Waiting for more entrants...
              </span>
            </div>
          </Card>
        </div>

        {/* Participants List */}
        <Card title="Participants" className="">
          <ul className="divide-y divide-[var(--app-card-border)] -mx-5 mt-[-1rem] mb-[-1rem]">
            {participants.map((p) => (
              <li
                key={p.id}
                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--app-foreground)]">
                    {p.name}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--app-foreground-muted)]">
                    {p.address}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">
                  Joined
                </span>
              </li>
            ))}
            {participants.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-[var(--app-foreground-muted)]">
                No participants yet.
              </li>
            )}
          </ul>
        </Card>
      </div>

      {/* Deposit Dialog */}
      <Dialog
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        title="Deposit Rewards"
        description="Add more USDC to the total prize pool."
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Amount (USDC)"
            type="number"
            placeholder="100"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            min={0}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              shadow={false}
              onClick={() => setDepositOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!depositAmount || Number(depositAmount) <= 0}
              onClick={handleDeposit}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>
    </BottomNavLayout>
  );
}
