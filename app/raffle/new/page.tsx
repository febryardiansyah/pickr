"use client";

import React, { useState } from "react";
import BottomNavLayout from "@/layout/BottomNavLayout";
import { Button } from "@/components/global/ButtonComponent";
import { Input } from "@/components/global/InputComponent";
import { Card } from "@/components/global/CardComponent";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function CreateRafflePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    ticketPrice: "",
    maxParticipants: "",
    closeAt: "",
    rewardSymbol: "USDC",
    initialReward: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const isValid = () => {
    return (
      form.title.trim() &&
      Number(form.ticketPrice) > 0 &&
      Number(form.maxParticipants) > 0 &&
      (form.closeAt === "" || new Date(form.closeAt).getTime() > Date.now())
    );
  };

  const handleSubmit = async () => {
    if (!isValid()) return;
    try {
      setSubmitting(true);
      const docRef = await addDoc(collection(db, "raffles"), {
        title: form.title.trim(),
        ticketPrice: Number(form.ticketPrice),
        maxParticipants: Number(form.maxParticipants),
        closeAt: form.closeAt ? new Date(form.closeAt).toISOString() : null,
        rewardSymbol: form.rewardSymbol,
        initialReward: form.initialReward ? Number(form.initialReward) : 0,
        totalReward: form.initialReward ? Number(form.initialReward) : 0,
        participants: [],
        createdAt: serverTimestamp(),
        status: "open",
      });
      router.push(`/raffle/${docRef.id}`);
    } catch (e) {
      console.error("Error creating raffle:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomNavLayout>
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
            <h1 className="text-xl font-semibold tracking-wide">
              Create Raffle
            </h1>
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
                label="Ticket Price (USDC)"
                type="number"
                placeholder="5"
                min={0}
                value={form.ticketPrice}
                onChange={(e) => update("ticketPrice", e.target.value)}
              />
              <Input
                label="Max Participants"
                type="number"
                placeholder="100"
                min={1}
                value={form.maxParticipants}
                onChange={(e) => update("maxParticipants", e.target.value)}
              />
            </div>
            <Input
              label="Initial Reward (optional)"
              type="number"
              placeholder="250"
              min={0}
              value={form.initialReward}
              onChange={(e) => update("initialReward", e.target.value)}
              helperText="You can deposit more later."
            />
            <Input
              label="Close At (optional)"
              type="datetime-local"
              value={form.closeAt}
              onChange={(e) => update("closeAt", e.target.value)}
              helperText="Raffle stops accepting entrants after this time."
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
    </BottomNavLayout>
  );
}
