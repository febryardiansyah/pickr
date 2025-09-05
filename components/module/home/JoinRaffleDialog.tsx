"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/global/DialogComponent";
import { Input } from "@/components/global/InputComponent";
import { Button } from "@/components/global/ButtonComponent";

type JoinRaffleDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
};

export function JoinRaffleDialog({
  open,
  onClose,
  onSubmit,
}: JoinRaffleDialogProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!code.trim()) {
      setError("Code is required");
      return;
    }
    try {
      setLoading(true);
      // Placeholder for join raffle logic (API call, navigation, etc.)
      await new Promise((res) => setTimeout(res, 650));
      console.log("Joining raffle with code:", code);
      onClose();
    } catch {
      setError("Failed to join. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Join Raffle"
      description="Enter a valid raffle code to participate."
      footer={
        <>
          <Button
            variant="ghost"
            shadow={false}
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={loading}
            className="min-w-[90px]"
            onClick={() => onSubmit(code)}
          >
            {loading ? "Joining..." : "Join"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Raffle Code"
          placeholder="e.g. MOON-42XY"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={32}
          autoFocus
          error={error}
        />
      </form>
    </Dialog>
  );
}
