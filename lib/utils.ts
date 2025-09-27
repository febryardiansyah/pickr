import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { TUserRoomItem } from "@/type/contract";

function generateCode(length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateUniqueCode(length = 6): Promise<string> {
  let unique = false;
  let code = "";

  while (!unique) {
    code = generateCode(length);

    const snapshot = await getDocByCode(code);

    if (!snapshot) {
      unique = true;
      // await addDoc(collection(db, "rooms"), { code });
    }
  }

  return code;
}

export async function getDocByCode(
  code: string,
): Promise<null | TUserRoomItem & { docId: string }> {
  const q = query(collection(db, "rooms"), where("code", "==", code));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return {
    accessMode: snapshot.docs[0].data().accessMode || "private",
    code: snapshot.docs[0].data().code || snapshot.docs[0].id,
    createdAt:
      snapshot.docs[0].data().createdAt?.toDate?.() ||
      snapshot.docs[0].data().createdAt ||
      new Date(),
    creator: snapshot.docs[0].data().creator || "",
    initialDepositEth: snapshot.docs[0].data().initialDepositEth || "0",
    maxParticipants: snapshot.docs[0].data().maxParticipants || 0,
    minParticipants: snapshot.docs[0].data().minParticipants || 0,
    participants: snapshot.docs[0].data().participants || [],
    password: snapshot.docs[0].data().password || "",
    status: snapshot.docs[0].data().status || "open",
    title: snapshot.docs[0].data().title || "",
    totalWinners: snapshot.docs[0].data().totalWinners || 0,
    docId: snapshot.docs[0].id,
  };
}

export function shortAddress(address?: string): string {
  if (!address) return "Anonymous";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;
