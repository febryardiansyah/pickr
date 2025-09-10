"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/global/ButtonComponent";
import { Card } from "@/components/global/CardComponent";
import { Dialog } from "@/components/global/DialogComponent";
import { Input } from "@/components/global/InputComponent";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import abi from "@/contracts/abi.json";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatEther } from "viem";

type Participant = { id: string; name?: string; address: string };
type RaffleDoc = {
  title: string;
  totalReward: number;
  participants: Participant[];
  host?: { name?: string; address?: string };
};

export default function DetailRaffleComponent() {
  const router = useRouter();
  const params = useParams();
  const raffleCode = useMemo(() => (params?.code as string) || "", [params]);
  const CONTRACT_ADDRESS = useMemo(
    () => process.env.NEXT_PUBLIC_RAFFLE_CONTRACT as `0x${string}` | undefined,
    []
  );
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [loading, setLoading] = useState(true);
  const [raffle, setRaffle] = useState<RaffleDoc | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalReward, setTotalReward] = useState<number>(0);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Winner reveal dialogs state
  const [revealOpen, setRevealOpen] = useState(false); // loading/rolling dialog
  const [resultOpen, setResultOpen] = useState(false); // winner result dialog
  const [rolling, setRolling] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [rollingIndex, setRollingIndex] = useState<number | null>(null);
  const [finalWinner, setFinalWinner] = useState<string | null>(null);
  const [winnerError, setWinnerError] = useState<string | null>(null);
  // zero address to detect unset winner
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

  const {
    data: onchainRaffle,
    isPending: onchainLoading,
    refetch: refetchOnchain,
  } = useReadContract({
    chainId: 84532,
    abi,
    address: CONTRACT_ADDRESS,
    functionName: "raffles",
    args: [raffleCode],
    query: { enabled: Boolean(CONTRACT_ADDRESS && raffleCode) },
  });

  // Read on-chain participants to detect if current user already joined
  const { data: onchainParticipants, refetch: refetchParticipants } =
    useReadContract({
      chainId: 84532,
      abi,
      address: CONTRACT_ADDRESS,
      functionName: "raffleParticipants",
      args: [raffleCode],
      query: { enabled: Boolean(CONTRACT_ADDRESS && raffleCode) },
    });

  // Read on-chain winner via public mapping getter
  const { data: onchainWinner, refetch: refetchWinner } = useReadContract({
    chainId: 84532,
    abi,
    address: CONTRACT_ADDRESS,
    functionName: "winners",
    args: [raffleCode],
    query: { enabled: Boolean(CONTRACT_ADDRESS && raffleCode) },
  });

  const onchain = useMemo(() => {
    if (!onchainRaffle)
      return null as null | {
        creator: `0x${string}`;
        balanceEth: string;
        statusIndex: number;
        max: number;
        min: number;
        total: number;
      };
    try {
      const tuple = onchainRaffle as readonly [
        `0x${string}`,
        bigint,
        number | bigint,
        bigint,
        bigint,
        bigint
      ];
      const statusIndex = Number(tuple[2] ?? 0);
      return {
        creator: tuple[0],
        balanceEth: formatEther(
          typeof tuple[1] === "bigint" ? (tuple[1] as bigint) : BigInt(0)
        ),
        statusIndex,
        max: typeof tuple[3] === "bigint" ? Number(tuple[3]) : 0,
        min: typeof tuple[4] === "bigint" ? Number(tuple[4]) : 0,
        total: typeof tuple[5] === "bigint" ? Number(tuple[5]) : 0,
      };
    } catch {
      console.log("Failed to parse on-chain raffle data:", onchainRaffle);
      return null;
    }
  }, [onchainRaffle]);

  const statusText = useMemo(() => {
    const map = ["ACTIVE", "INACTIVE", "STARTED"] as const;
    return onchain ? (map[onchain.statusIndex] ?? "UNKNOWN") : undefined;
  }, [onchain]);

  const shortAddr = (addr?: string) =>
    addr && addr.startsWith("0x")
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr || "-";

  const isCreator = useMemo(
    () =>
      address && onchain?.creator
        ? address.toLowerCase() === onchain.creator.toLowerCase()
        : false,
    [address, onchain?.creator]
  );

  const alreadyJoined = useMemo(() => {
    if (!address) return false;
    const list =
      (onchainParticipants as readonly `0x${string}`[] | undefined) || [];
    return list.some((a) => a.toLowerCase() === address.toLowerCase());
  }, [address, onchainParticipants]);

  useEffect(() => {
    const list =
      (onchainParticipants as readonly `0x${string}`[] | undefined) || [];
    setParticipants(
      list.map((addr, idx) => ({
        id: String(idx + 1),
        address: addr as string,
      }))
    );
  }, [onchainParticipants]);

  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleJoin = async () => {
    if (
      !CONTRACT_ADDRESS ||
      !raffleCode ||
      joining ||
      alreadyJoined ||
      isCreator
    )
      return;
    try {
      setJoining(true);
      await writeContractAsync({
        abi,
        address: CONTRACT_ADDRESS,
        functionName: "joinRaffle",
        args: [raffleCode],
      });
      await refetchParticipants?.();
    } catch (e) {
      console.error("joinRaffle failed", e);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (
      !CONTRACT_ADDRESS ||
      !raffleCode ||
      leaving ||
      !alreadyJoined ||
      isCreator
    )
      return;
    try {
      setLeaving(true);
      await writeContractAsync({
        abi,
        address: CONTRACT_ADDRESS,
        functionName: "leaveRaffle",
        args: [raffleCode],
      });
      await refetchParticipants?.();
    } catch (e) {
      console.error("leaveRaffle failed", e);
    } finally {
      setLeaving(false);
    }
  };

  useEffect(() => {
    if (!raffleCode) return;
    setLoading(true);
    const ref = doc(db, "raffles", raffleCode);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setRaffle(null);
        setParticipants([]);
        setTotalReward(0);
        setLoading(false);
        return;
      }
      const data = snap.data() as Partial<RaffleDoc>;
      setRaffle({
        title: data.title || `Raffle #${raffleCode}`,
        totalReward: data.totalReward || 0,
        participants: (data.participants as Participant[]) || [],
        host: data.host || undefined,
      });
      setTotalReward(data.totalReward || 0);
      setLoading(false);
    });
    return () => unsub();
  }, [raffleCode]);

  const handleDeposit = async () => {
    const v = Number(depositAmount);
    if (!isNaN(v) && v > 0 && raffleCode) {
      const ref = doc(db, "raffles", raffleCode);
      await updateDoc(ref, { totalReward: (totalReward || 0) + v });
      setDepositAmount("");
      setDepositOpen(false);
    }
  };

  const handleStartRaffle = async () => {
    if (!CONTRACT_ADDRESS || !raffleCode || !isCreator || starting) return;
    try {
      setStarting(true);
      await writeContractAsync({
        abi,
        address: CONTRACT_ADDRESS,
        functionName: "startRaffle",
        args: [raffleCode],
      });
      await Promise.allSettled([
        refetchOnchain?.(),
        refetchParticipants?.(),
      ]);
      console.log("Raffle started for:", raffleCode);
      // After starting, open winner selection dialog and animate selection
      if (participants.length > 0) {
        beginWinnerReveal();
      }
    } catch (e) {
      console.error("startRaffle failed", e);
    } finally {
      setStarting(false);
    }
  };

  const beginWinnerReveal = () => {
    if (participants.length === 0) return;
    setWinnerError(null);
    setFinalWinner(null);
    setCountdown(5);
  setRevealOpen(true);
    setRolling(true);

    let secs = 5;
    let lastIdx = 0;

    const countdownTimer = window.setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        window.clearInterval(countdownTimer);
      }
    }, 1000);

    const rollTimer = window.setInterval(() => {
      const idx = Math.floor(Math.random() * participants.length);
      lastIdx = idx;
      setRollingIndex(idx);
    }, 100);

    window.setTimeout(async () => {
      window.clearInterval(rollTimer);
      setRolling(false);
      const safeIdx = Math.max(0, Math.min(lastIdx, participants.length - 1));
      const winnerAddr = participants[safeIdx].address as `0x${string}`;
      setFinalWinner(winnerAddr);
      try {
        await writeContractAsync({
          abi,
          address: CONTRACT_ADDRESS!,
          functionName: "winnerSelected",
          args: [raffleCode, winnerAddr],
        });
        await Promise.allSettled([
          refetchOnchain?.(),
          refetchParticipants?.(),
          refetchWinner?.(),
        ]);
      } catch (e) {
        console.error("winnerSelected failed", e);
        const err = e as unknown as { shortMessage?: string; message?: string };
        const msg = err?.shortMessage || err?.message || "Failed to select winner";
        setWinnerError(msg);
      }
      // Switch from loading dialog to result dialog
      setRevealOpen(false);
      setResultOpen(true);
    }, 5000);

    // Prevent closing while rolling; cleanup happens automatically on finalize
  };

  // No event scan needed since we have a public getter now

  const handleCopyCode = async () => {
    if (!raffleCode) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(raffleCode);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = raffleCode;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy code failed", e);
    }
  };

  return (
    <>
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
                {loading
                  ? "Loading raffle..."
                  : raffle?.title || `Raffle #${raffleCode}`}
              </h1>
              <p className="text-xs text-[var(--app-foreground-muted)]">
                {raffle?.host?.name || "Hosted raffle"}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--app-foreground-muted)]">
                <span>Code:</span>
                <span className="font-mono px-2 py-0.5 rounded border border-[var(--app-card-border)] bg-[var(--app-card)] text-[var(--app-foreground)]">
                  {raffleCode}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  shadow={false}
                  className="px-2"
                  onClick={handleCopyCode}
                  aria-label="Copy raffle code"
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
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  }
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              {/* On-chain meta */}
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[var(--app-foreground-muted)]">
                {CONTRACT_ADDRESS ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      Creator:{" "}
                      <span className="font-mono">
                        {onchainLoading ? "…" : shortAddr(onchain?.creator)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Status: {onchainLoading ? "…" : statusText || "-"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Participants:{" "}
                      {onchainLoading
                        ? "…"
                        : onchain
                        ? `${onchain.total}/${onchain.max} (min ${onchain.min})`
                        : "-"}
                    </span>
                  </>
                ) : (
                  <span>Contract not configured</span>
                )}
              </div>
            </div>
          </div>
        </div>

  {/* Summary Cards */}
  <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 col-span-2 sm:col-span-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">
                Total Rewards (ETH)
              </span>
              <span className="text-2xl font-semibold text-[var(--app-foreground)]">
                {onchainLoading ? "-" : onchain?.balanceEth ?? "0"}
              </span>
              <div className="flex gap-2 mt-3">
                {!isCreator && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleJoin}
                      disabled={
                        !isConnected || joining || alreadyJoined || isCreator
                      }
                    >
                      {alreadyJoined
                        ? "Joined"
                        : joining
                        ? "Joining..."
                        : "Join Raffle"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLeave}
                      disabled={
                        !isConnected || leaving || !alreadyJoined || isCreator
                      }
                    >
                      {leaving ? "Leaving..." : "Leave Raffle"}
                    </Button>
                  </>
                )}
                {isCreator && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={
                      starting ||
                      !onchain ||
                      onchain.statusIndex !== 0 /* ACTIVE */ ||
                      onchain.total < onchain.min
                    }
                    onClick={handleStartRaffle}
                  >
                    {starting ? "Starting..." : "Start Raffle"}
                  </Button>
                )}
              </div>
            </div>
          </Card>
          <Card className="p-4 col-span-2 sm:col-span-1">
            <div className="flex flex-col gap-1 h-full">
              <span className="text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">
                Participants
              </span>
              <span className="text-2xl font-semibold text-[var(--app-foreground)]">
                {loading ? "-" : onchain?.total ?? participants.length}
              </span>
              <span className="text-[11px] text-[var(--app-foreground-muted)] mt-auto">
                {loading ? "Loading..." : "Waiting for more entrants..."}
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
                    {p.name || shortAddr(p.address)}
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
            {participants.length === 0 && !loading && (
              <li className="px-5 py-6 text-center text-sm text-[var(--app-foreground-muted)]">
                No participants yet.
              </li>
            )}
          </ul>
        </Card>

        {/* Winner Card */}
        <Card className="p-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">
              Winner
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-[var(--app-foreground)]">
                {(() => {
                  const chainWinner = onchainWinner as `0x${string}` | undefined;
                  const hasChainWinner = chainWinner && chainWinner !== ZERO_ADDRESS;
                  const winner = hasChainWinner ? chainWinner : finalWinner;
                  return winner || "Not selected";
                })()}
              </span>
              {(() => {
                const chainWinner = onchainWinner as `0x${string}` | undefined;
                const hasChainWinner = chainWinner && chainWinner !== ZERO_ADDRESS;
                const winner = hasChainWinner ? chainWinner : finalWinner;
                return winner ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(winner as string);
                    } catch {}
                  }}
                >
                  Copy
                </Button>
                ) : null;
              })()}
            </div>
            <span className="text-[11px] text-[var(--app-foreground-muted)]">
              {onchain?.statusIndex === 1
                ? "Raffle ended"
                : onchain?.statusIndex === 2
                ? "Raffle started"
                : "Raffle active"}
            </span>
          </div>
        </Card>
      </div>

      {/* Deposit Dialog */}
      <Dialog
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        title="Deposit Rewards"
        description="Add more ETH to the total prize pool."
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Amount (ETH)"
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

      {/* Winner Loading (Reveal) Dialog */}
      <Dialog
        open={revealOpen}
        onClose={() => {
          if (!rolling) setRevealOpen(false);
        }}
        title="Selecting Winner"
        description="We are randomly picking a winner from participants."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm text-[var(--app-foreground-muted)]">
              Revealing in {countdown}s
            </div>
            <div className="h-10 px-3 inline-flex items-center rounded border border-[var(--app-card-border)] bg-[var(--app-card)] font-mono text-[var(--app-foreground)]">
              {rollingIndex !== null
                ? shortAddr(participants[rollingIndex]?.address)
                : "Shuffling..."}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="primary" disabled>
              Please wait…
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Winner Result Dialog */}
      <Dialog
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        title={winnerError ? "Selection Failed" : "Winner Selected"}
        description={winnerError ? winnerError : "Congratulations to the winner!"}
      >
        <div className="flex flex-col gap-4">
          {finalWinner && !winnerError ? (
            <>
              <div className="text-sm text-[var(--app-foreground-muted)]">Winner Address</div>
              <div className="h-10 px-3 inline-flex items-center rounded border border-[var(--app-card-border)] bg-[var(--app-card)] font-mono text-[var(--app-foreground)]">
                {finalWinner}
              </div>
            </>
          ) : (
            <div className="text-sm text-[var(--app-foreground-muted)]">
              {winnerError || "No winner selected"}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            {finalWinner && !winnerError && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(finalWinner);
                  } catch {}
                }}
              >
                Copy address
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={() => setResultOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
