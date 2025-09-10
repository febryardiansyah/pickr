import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebase";

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

    const q = query(collection(db, "raffles"), where("code", "==", code));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      unique = true;
      await addDoc(collection(db, "raffles"), { code });
    }
  }

  return code;
}
