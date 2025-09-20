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
import { shortAddress, ZERO_ADDRESS } from "@/lib/utils";
import { ArrowLeft, Copy, LinkIcon, RefreshCcw } from "lucide-react";
import type { Participant, RoomDoc } from "@/type/contract";
import { toast } from "react-toastify";

export default function DetailRoomComponent() {
  const router = useRouter();
  const params = useParams();
  const roomCode = useMemo(() => (params?.code as string) || "", [params]);
  const CONTRACT_ADDRESS = useMemo(
    () => process.env.NEXT_PUBLIC_ROOM_CONTRACT as `0x${string}` | undefined,
    [],
  );
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalReward, setTotalReward] = useState<number>(0);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [revealOpen, setRevealOpen] = useState(false); // loading/rolling dialog
  const [resultOpen, setResultOpen] = useState(false); // winner result dialog
  const [rolling, setRolling] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [rollingIndex, setRollingIndex] = useState<number | null>(null);
  const [finalWinner, setFinalWinner] = useState<string | null>(null);
  const [winnerError, setWinnerError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: onchainRoom,
    isPending: onchainLoading,
    refetch: refetchOnchain,
  } = useReadContract({
    chainId: 84532,
    abi,
    address: CONTRACT_ADDRESS,
    functionName: "rooms",
    args: [roomCode],
    query: { enabled: Boolean(CONTRACT_ADDRESS && roomCode) },
  });

  const { data: onchainParticipants, refetch: refetchParticipants } =
    useReadContract({
      chainId: 84532,
      abi,
      address: CONTRACT_ADDRESS,
      functionName: "roomParticipants",
      args: [roomCode],
      query: { enabled: Boolean(CONTRACT_ADDRESS && roomCode) },
    });

  const { data: onchainWinner, refetch: refetchWinner } = useReadContract({
    chainId: 84532,
    abi,
    address: CONTRACT_ADDRESS,
    functionName: "winners",
    args: [roomCode],
    query: { enabled: Boolean(CONTRACT_ADDRESS && roomCode) },
  });

  const onchain = useMemo(() => {
    if (!onchainRoom)
      return null as null | {
        creator: `0x${string}`;
        balanceEth: string;
        statusIndex: number;
        max: number;
        min: number;
        total: number;
      };
    try {
      const tuple = onchainRoom as readonly [
        `0x${string}`,
        bigint,
        number | bigint,
        bigint,
        bigint,
        bigint,
      ];
      const statusIndex = Number(tuple[2] ?? 0);
      return {
        creator: tuple[0],
        balanceEth: formatEther(
          typeof tuple[1] === "bigint" ? (tuple[1] as bigint) : BigInt(0),
        ),
        statusIndex,
        max: typeof tuple[3] === "bigint" ? Number(tuple[3]) : 0,
        min: typeof tuple[4] === "bigint" ? Number(tuple[4]) : 0,
        total: typeof tuple[5] === "bigint" ? Number(tuple[5]) : 0,
      };
    } catch {
      console.log("Failed to parse on-chain room data:", onchainRoom);
      return null;
    }
  }, [onchainRoom]);

  const statusText = useMemo(() => {
    const map = ["ACTIVE", "INACTIVE", "STARTED"] as const;
    return onchain ? (map[onchain.statusIndex] ?? "UNKNOWN") : undefined;
  }, [onchain]);

  const isCreator = useMemo(
    () =>
      address && onchain?.creator
        ? address.toLowerCase() === onchain.creator.toLowerCase()
        : false,
    [address, onchain?.creator],
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
      })),
    );
  }, [onchainParticipants]);

  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleJoin = async () => {
    if (
      !CONTRACT_ADDRESS ||
      !roomCode ||
      joining ||
      alreadyJoined ||
      isCreator
    )
      return;
    try {
      setJoining(true);
      await toast.promise(
        (async () => {
          await writeContractAsync({
            abi,
            address: CONTRACT_ADDRESS,
            functionName: "joinRoom",
            args: [roomCode],
          });
          await refetchParticipants?.();
        })(),
        {
          pending: "Joining room…",
          success: "Joined room",
          error: {
            render({ data }) {
              const err = data as unknown as { shortMessage?: string; message?: string };
              return err?.shortMessage || err?.message || "Failed to join room";
            },
          },
        },
      );
    } catch (e) {
      console.error("joinRoom failed", e);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (
      !CONTRACT_ADDRESS ||
      !roomCode ||
      leaving ||
      !alreadyJoined ||
      isCreator
    )
      return;
    try {
      setLeaving(true);
      await toast.promise(
        (async () => {
          await writeContractAsync({
            abi,
            address: CONTRACT_ADDRESS,
            functionName: "leaveRoom",
            args: [roomCode],
          });
          await refetchParticipants?.();
        })(),
        {
          pending: "Leaving room…",
          success: "Left room",
          error: {
            render({ data }) {
              const err = data as unknown as { shortMessage?: string; message?: string };
              return err?.shortMessage || err?.message || "Failed to leave room";
            },
          },
        },
      );
    } catch (e) {
      console.error("leaveRoom failed", e);
    } finally {
      setLeaving(false);
    }
  };

  const handleCloseRoom = async () => {
    if (!CONTRACT_ADDRESS || !roomCode || !isCreator || closing) return;
    if (!onchain || onchain.statusIndex !== 0) return; // only when ACTIVE
    try {
      setClosing(true);
      await toast.promise(
        (async () => {
          await writeContractAsync({
            abi,
            address: CONTRACT_ADDRESS,
            functionName: "closeRoom",
            args: [roomCode],
          });
          await Promise.allSettled([refetchOnchain?.(), refetchParticipants?.()]);
        })(),
        {
          pending: "Closing room…",
          success: "Room closed",
          error: {
            render({ data }) {
              const err = data as unknown as { shortMessage?: string; message?: string };
              return err?.shortMessage || err?.message || "Failed to close room";
            },
          },
        },
      );
    } catch (e) {
      console.error("closeRoom failed", e);
    } finally {
      setClosing(false);
    }
  };

  useEffect(() => {
    if (!roomCode) return;
    setLoading(true);
    const ref = doc(db, "rooms", roomCode);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setRoom(null);
        setParticipants([]);
        setTotalReward(0);
        setLoading(false);
        return;
      }
      const data = snap.data() as Partial<RoomDoc>;
      setRoom({
        title: data.title || `Room #${roomCode}`,
        totalReward: data.totalReward || 0,
        participants: (data.participants as Participant[]) || [],
        host: data.host || undefined,
      });
      setTotalReward(data.totalReward || 0);
      setLoading(false);
    });
    return () => unsub();
  }, [roomCode]);

  const handleDeposit = async () => {
    const v = Number(depositAmount);
    if (!isNaN(v) && v > 0 && roomCode) {
      const ref = doc(db, "rooms", roomCode);
      await updateDoc(ref, { totalReward: (totalReward || 0) + v });
      setDepositAmount("");
      setDepositOpen(false);
    }
  };

  const handleStartRoom = async () => {
    if (!CONTRACT_ADDRESS || !roomCode || !isCreator || starting) return;
    try {
      setStarting(true);
      await toast.promise(
        (async () => {
          await writeContractAsync({
            abi,
            address: CONTRACT_ADDRESS,
            functionName: "startRoom",
            args: [roomCode],
          });
          await Promise.allSettled([refetchOnchain?.(), refetchParticipants?.()]);
        })(),
        {
          pending: "Starting room…",
          success: "Room started",
          error: {
            render({ data }) {
              const err = data as unknown as { shortMessage?: string; message?: string };
              return err?.shortMessage || err?.message || "Failed to start room";
            },
          },
        },
      );
      console.log("Room started for:", roomCode);
      if (participants.length > 0) {
        beginWinnerReveal();
      }
    } catch (e) {
      console.error("startRoom failed", e);
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
          args: [roomCode, winnerAddr],
        });
        await Promise.allSettled([
          refetchOnchain?.(),
          refetchParticipants?.(),
          refetchWinner?.(),
        ]);
      } catch (e) {
        console.error("winnerSelected failed", e);
        const err = e as unknown as { shortMessage?: string; message?: string };
        const msg =
          err?.shortMessage || err?.message || "Failed to select winner";
        setWinnerError(msg);
      }
      setRevealOpen(false);
      setResultOpen(true);
    }, 5000);
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomCode);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = roomCode;
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

  const handleCopyLink = async () => {
    try {
      const link = window?.location?.href;
      if (!link) return;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy link failed", e);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.allSettled([
        refetchOnchain?.(),
        refetchParticipants?.(),
        refetchWinner?.(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 pb-24 animate-fade-in">
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              shadow={false}
              onClick={() => router.push("/")}
              aria-label="Go back"
              icon={
                <ArrowLeft className="w-4 h-4" />
              }
              className="px-2"
            >
              Back
            </Button>
            <h1 className="text-xl font-semibold tracking-wide text-[var(--app-foreground)]">
              {loading
                ? "Loading room..."
                : room?.title || `Room #${roomCode}`}
            </h1>
            <span
              className={
                `px-2 py-0.5 rounded-full border text-[10px] ` +
                (onchainLoading
                  ? "opacity-60"
                  : statusText === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : statusText === "STARTED"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/30")
              }
            >
              {onchainLoading ? "…" : statusText || "-"}
            </span>
          </div>

          <Card title="Room Info" className="p-4">
            <div className="flex flex-col gap-3">
              {/* Code + Actions */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--app-foreground-muted)]">
                <span>Code:</span>
                <span className="font-mono px-2 py-0.5 rounded border border-[var(--app-card-border)] bg-[var(--app-card)] text-[var(--app-foreground)]">
                  {roomCode}
                </span>
                <div className="ml-1 inline-flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    shadow={false}
                    className="px-2"
                    onClick={handleCopyCode}
                    aria-label="Copy room code"
                    icon={<Copy className="w-4 h-4" />}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    shadow={false}
                    className="px-2"
                    onClick={handleCopyLink}
                    aria-label="Copy page link"
                    icon={<LinkIcon className="w-4 h-4" />}
                  >
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    shadow={false}
                    className="px-2"
                    onClick={handleRefresh}
                    aria-label="Refresh on-chain data"
                    disabled={refreshing}
                    icon={
                      <RefreshCcw
                        className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                      />
                    }
                  >
                    Refresh
                  </Button>
                </div>
                <span className="sr-only" aria-live="polite">
                  {copied ? "Copied to clipboard" : ""}
                </span>
              </div>

              <div className="flex flex-col gap-2 text-[11px] text-[var(--app-foreground-muted)]">
                {CONTRACT_ADDRESS ? (
                  <>
                    <div className="flex flex-col items-start gap-2">
                      <span className="inline-flex items-center gap-1">
                        Creator:{" "}
                        <a
                          href={`https://sepolia.basescan.org/address/${onchain?.creator}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono underline-offset-2 hover:underline text-[var(--app-foreground)]"
                        >
                          {onchainLoading
                            ? "…"
                            : shortAddress(onchain?.creator)}
                        </a>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Participants:{" "}
                        {onchainLoading
                          ? "…"
                          : onchain
                            ? `${onchain.total}/${onchain.max} (min ${onchain.min})`
                            : "-"}
                      </span>
                    </div>
                  </>
                ) : (
                  <span>Contract not configured</span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 col-span-2 sm:col-span-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">
                Total Rewards (ETH)
              </span>
              <span className="text-2xl font-semibold text-[var(--app-foreground)]">
                {onchainLoading ? "-" : (onchain?.balanceEth ?? "0")}
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
                          : "Join Room"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLeave}
                      disabled={
                        !isConnected || leaving || !alreadyJoined || isCreator
                      }
                    >
                      {leaving ? "Leaving..." : "Leave Room"}
                    </Button>
                  </>
                )}
                {isCreator && (
                  <div className="flex flex-col gap-2 flex-grow">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={
                        starting ||
                        !onchain ||
                        onchain.statusIndex !== 0 ||
                        onchain.total < onchain.min
                      }
                      onClick={handleStartRoom}
                    >
                      {starting ? "Starting..." : "Start Room"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        !onchain || onchain.statusIndex !== 0 || closing
                      }
                      onClick={handleCloseRoom}
                    >
                      {closing ? "Closing..." : "Close Room"}
                    </Button>
                  </div>
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
                {loading
                  ? "-"
                  : `${onchain?.total ?? participants.length} / ${onchain?.max ?? 1}`}
              </span>
              <span className="text-[11px] text-[var(--app-foreground-muted)] mt-auto">
                {loading ? "Loading..." : "Waiting for more entrants..."}
              </span>
            </div>
          </Card>
        </div>

        {/* Winner Card */}
        <Card className="px-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">
              Winner
            </span>
            <div className="flex flex-col items-start gap-2">
              <span className="font-mono text-sm text-[var(--app-foreground)]">
                {(() => {
                  const chainWinner = onchainWinner as
                    | `0x${string}`
                    | undefined;
                  const hasChainWinner =
                    chainWinner && chainWinner !== ZERO_ADDRESS;
                  const winner = hasChainWinner ? chainWinner : finalWinner;
                  return winner || "Not selected";
                })()}
              </span>
              {(() => {
                const chainWinner = onchainWinner as `0x${string}` | undefined;
                const hasChainWinner =
                  chainWinner && chainWinner !== ZERO_ADDRESS;
                const winner = hasChainWinner ? chainWinner : finalWinner;
                return winner ? (
                  <Button
                    size="sm"
                    variant="outline"
                    shadow={false}
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
          </div>
        </Card>

        {/* Participants List */}
        <Card title="Participants" className="">
          <ul className="divide-y divide-[var(--app-card-border)] -mx-5 mt-[-1rem] mb-[-1rem]">
            {participants.map((p) => (
              <li
                key={p.id}
                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
              >
                <span className="text-[11px] font-mono text-[var(--app-foreground-muted)]">
                  {p.address}
                </span>
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
                ? shortAddress(participants[rollingIndex]?.address)
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
        description={
          winnerError ? winnerError : "Congratulations to the winner!"
        }
      >
        <div className="flex flex-col gap-4">
          {finalWinner && !winnerError ? (
            <>
              <div className="text-sm text-[var(--app-foreground-muted)]">
                Winner Address
              </div>
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
            <Button
              size="sm"
              variant="primary"
              onClick={() => setResultOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
