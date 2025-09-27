"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/global/DialogComponent";
import { Input } from "@/components/global/InputComponent";
import { Button } from "@/components/global/ButtonComponent";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

type JoinRoomDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
};

export function JoinRoomDialog({
  open,
  onClose,
  onSubmit,
}: JoinRoomDialogProps) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [roomNeedsPassword, setRoomNeedsPassword] = useState(false);

  const checkRoomExists = async (roomCode: string) => {
    try {
      const q = query(
        collection(db, "rooms"),
        where("code", "==", roomCode.trim().toUpperCase())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError("Room not found. Please check the code.");
        return null;
      }
      
      const roomDoc = querySnapshot.docs[0];
      const roomData = roomDoc.data();
      
      return roomData;
    } catch (error) {
      console.error("Error checking room:", error);
      setError("Failed to check room. Please try again.");
      return null;
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value.toUpperCase());
    setPassword("");
    setRoomNeedsPassword(false);
    setError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    
    if (!code.trim()) {
      setError("Room code is required");
      return;
    }

    try {
      setLoading(true);
      
      // Check if room exists and get room data
      const roomData = await checkRoomExists(code);
      if (!roomData) {
        return; // Error already set in checkRoomExists
      }
      
      // If room has password but no password entered yet, show password field and ask for it
      if (roomData.password && roomData.password.trim() !== "" && !roomNeedsPassword) {
        setRoomNeedsPassword(true);
        setError("This room requires a password. Please enter it below.");
        return;
      }
      
      // If room has password and password field is showing, validate the password
      if (roomData.password && roomData.password.trim() !== "" && roomNeedsPassword) {
        if (!password.trim()) {
          setError("Password is required for this room");
          return;
        }
        
        if (password.trim() !== roomData.password.trim()) {
          setError("Incorrect password");
          return;
        }
      }
      
      // Success - navigate to room
      onSubmit(code.trim());
      
      // Reset form
      setCode("");
      setPassword("");
      setRoomNeedsPassword(false);
      handleClose();
      
    } catch (error) {
      console.error("Error joining room:", error);
      setError("Failed to join room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog closes
  const handleClose = () => {
    setCode("");
    setPassword("");
    setError(undefined);
    setRoomNeedsPassword(false);
    setLoading(false);
    onClose();
  };

  const handleJoinClick = () => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Join Room"
      description="Enter a valid room code to participate."
      footer={
        <>
          <Button
            variant="ghost"
            shadow={false}
            size="sm"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={loading || !code.trim()}
            className="min-w-[90px]"
            onClick={handleJoinClick}
          >
            {loading ? "Joining..." : "Join"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Room Code"
          placeholder="e.g. MOON-42XY"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          maxLength={32}
          autoFocus
          error={error && !roomNeedsPassword ? error : undefined}
          disabled={loading}
        />
        
        {roomNeedsPassword && (
          <Input
            label="Password"
            type="password"
            placeholder="Enter room password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error && roomNeedsPassword ? error : undefined}
            disabled={loading}
          />
        )}
      </form>
    </Dialog>
  );
}
