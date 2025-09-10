"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/global/ButtonComponent";
import { Input } from "@/components/global/InputComponent";
import { Card } from "@/components/global/CardComponent";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { serverTimestamp, setDoc, doc } from "firebase/firestore";
import abi from "@/contracts/abi.json";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { generateUniqueCode } from "@/lib/utils";

export default function NewRaffleComponent() {
  const router = useRouter();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const CONTRACT_ADDRESS = useMemo(
    () => process.env.NEXT_PUBLIC_RAFFLE_CONTRACT as `0x${string}` | undefined,
    [],
  );

  const [form, setForm] = useState({
    title: "",
    minParticipants: "",
    maxParticipants: "",
    initialDepositEth: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const isValid = () => {
    const min = Number(form.minParticipants);
    const max = Number(form.maxParticipants);
    const dep = Number(form.initialDepositEth);
    return form.title.trim() && max > 0 && min > 0 && max > min && dep > 0;
  };

  const handleSubmit = async () => {
    if (!isValid()) return;
    if (!CONTRACT_ADDRESS) {
      console.error("Missing NEXT_PUBLIC_RAFFLE_CONTRACT env var");
      return;
    }
    try {
      setSubmitting(true);
      const max = BigInt(Number(form.maxParticipants));
      const min = BigInt(Number(form.minParticipants));
      const value = parseEther(form.initialDepositEth);
      const code = await generateUniqueCode();

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "createRaffle",
        args: [max, min, code],
        value,
      });

      await setDoc(doc(db, "raffles", code), {
        title: form.title.trim(),
        maxParticipants: Number(form.maxParticipants),
        minParticipants: Number(form.minParticipants),
        initialDepositEth: form.initialDepositEth,
        code: code,
        host: address ? { address } : null,
        participants: [],
        createdAt: serverTimestamp(),
        status: "open",
      });

      router.push(`/raffle/${code}`);
    } catch (e) {
      console.error("Error creating raffle:", e);
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24 animate-fade-in mt-4">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          shadow={false}
          onClick={() => router.back()}
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
          <h1 className="text-xl font-semibold tracking-wide">Create Raffle</h1>
          <p className="text-xs text-[var(--app-foreground-muted)]">
            Configure parameters then deploy your raffle.
          </p>
        </div>
      </div>

      <Card title="Raffle Details" className="p-5">
        <div className="flex flex-col gap-6">
          <Input
            label="Title"
            placeholder="My awesome raffle"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Max Participants"
              type="number"
              placeholder="100"
              min={1}
              value={form.maxParticipants}
              onChange={(e) => update("maxParticipants", e.target.value)}
            />
            <Input
              label="Min Participants"
              type="number"
              placeholder="10"
              min={1}
              value={form.minParticipants}
              onChange={(e) => update("minParticipants", e.target.value)}
            />
          </div>
          <Input
            label="Initial Deposit (ETH)"
            type="number"
            placeholder="0.01"
            min={0}
            value={form.initialDepositEth}
            onChange={(e) => update("initialDepositEth", e.target.value)}
            helperText="This will be sent as the initial prize pool."
          />
          <div className="flex justify-end pt-1">
            <Button
              size="md"
              variant="primary"
              disabled={!isValid() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Deploying..." : "Create Raffle"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
