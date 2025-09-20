"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/global/ButtonComponent";
import { Input } from "@/components/global/InputComponent";
import { Card } from "@/components/global/CardComponent";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { serverTimestamp, addDoc, collection } from "firebase/firestore";
import abi from "@/contracts/abi.json";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther, keccak256, toHex } from "viem";
import { generateUniqueCode } from "@/lib/utils";
import { Eye, EyeClosed } from "lucide-react";

export default function NewRoomComponent() {
  const router = useRouter();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const CONTRACT_ADDRESS = useMemo(
    () => process.env.NEXT_PUBLIC_ROOM_CONTRACT as `0x${string}` | undefined,
    [],
  );

  const [form, setForm] = useState({
    title: "",
    minParticipants: "",
    maxParticipants: "",
    initialDepositEth: "",
    password: "",
    totalWinners: "1",
    accessMode: "private", // public or private
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (k: string, v: string) => {
    setForm((f) => {
      const newForm = { ...f, [k]: v };
      // Clear password when switching to public mode
      if (k === "accessMode" && v === "public") {
        newForm.password = "";
      }
      return newForm;
    });
  };

  const isValid = () => {
    const min = Number(form.minParticipants);
    const max = Number(form.maxParticipants);
    const dep = Number(form.initialDepositEth);
    const winners = Number(form.totalWinners);

    const basicValidation =
      form.title.trim() &&
      max > 0 &&
      min > 0 &&
      max > min &&
      dep > 0 &&
      winners > 0 &&
      winners <= max;

    // If private mode, password is required
    if (form.accessMode === "private") {
      return basicValidation && form.password.trim().length > 0;
    }

    return basicValidation;
  };

  const handleSubmit = async () => {
    if (!isValid()) return;
    if (!CONTRACT_ADDRESS) {
      console.error("Missing NEXT_PUBLIC_ROOM_CONTRACT env var");
      return;
    }
    try {
      setSubmitting(true);
      const max = BigInt(Number(form.maxParticipants));
      const min = BigInt(Number(form.minParticipants));
      const value = parseEther(form.initialDepositEth);
      const code = await generateUniqueCode();

      const _doc = await addDoc(collection(db, "rooms"), {
        title: form.title.trim(),
        maxParticipants: Number(form.maxParticipants),
        minParticipants: Number(form.minParticipants),
        totalWinners: Number(form.totalWinners),
        initialDepositEth: form.initialDepositEth,
        code: code,
        host: address ? { address } : null,
        participants: [],
        password: form.accessMode === "private" ? form.password : null,
        accessMode: form.accessMode,
        createdAt: serverTimestamp(),
        status: "open",
      });

      // Convert code to bytes32 hash for the contract
      const docIdHash = keccak256(toHex(_doc.id));

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "createRoom",
        args: [min, max, docIdHash],
        value,
      });

      router.push(`/room/${code}`);
    } catch (e) {
      console.error("Error creating room:", e);
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
          <h1 className="text-xl font-semibold tracking-wide">Create Room</h1>
          <p className="text-xs text-[var(--app-foreground-muted)]">
            Configure parameters then deploy your room.
          </p>
        </div>
      </div>

      <Card title="Room Details" className="p-5">
        <div className="flex flex-col gap-6">
          <Input
            label="Title"
            placeholder="My awesome room"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Min Participants"
              type="number"
              placeholder="10"
              min={1}
              value={form.minParticipants}
              onChange={(e) => update("minParticipants", e.target.value)}
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
            label="Total Winners"
            type="number"
            placeholder="1"
            min={1}
            value={form.totalWinners}
            onChange={(e) => update("totalWinners", e.target.value)}
            helperText="Number of winners for this room."
          />
          <Input
            label="Initial Deposit (ETH)"
            type="number"
            placeholder="0.01"
            min={0}
            value={form.initialDepositEth}
            onChange={(e) => update("initialDepositEth", e.target.value)}
            helperText="This will be sent as the initial prize pool."
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--app-foreground)]">
              Access Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accessMode"
                  value="private"
                  checked={form.accessMode === "private"}
                  onChange={(e) => update("accessMode", e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">Private</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accessMode"
                  value="public"
                  checked={form.accessMode === "public"}
                  onChange={(e) => update("accessMode", e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">Public</span>
              </label>
            </div>
          </div>
          {form.accessMode === "private" && (
            <div className="relative">
              <Input
                label="Room Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                helperText="Password required to join this private room."
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-700 hover:text-gray-800"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye /> : <EyeClosed />}
              </button>
            </div>
          )}
          <div className="flex justify-end pt-1">
            <Button
              size="md"
              variant="primary"
              disabled={!isValid() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Deploying..." : "Create Room"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
