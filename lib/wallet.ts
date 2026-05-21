import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import { assertNotBlocked, logAbuse } from "./anti-cheat";
import { ensureArcNetworkOn, setSelectedProvider, type WalletOption } from "./wallet-providers";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

const norm = (a: string) => a.toLowerCase();

async function ensureUnique(uid: string, address: string) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not ready");
  const q = query(collection(db, "users"), where("walletAddress", "==", norm(address)));
  const snap = await getDocs(q);
  const taken = snap.docs.find((d) => d.id !== uid);
  if (taken) {
    await logAbuse(uid, "wallet_taken", { address: norm(address), takenBy: taken.id });
    throw new Error("This wallet is already linked to another account.");
  }
}

async function saveWallet(uid: string, address: string) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not ready");
  await assertNotBlocked(uid, "linkWallet");
  await ensureUnique(uid, address);
  // Log re-link attempts (changing wallet after one is set).
  const current = (await (await import("firebase/firestore")).getDoc(doc(db, "users", uid))).data()?.walletAddress as string | undefined;
  if (current && current !== norm(address)) {
    await logAbuse(uid, "wallet_relink", { from: current, to: norm(address) });
  }
  await updateDoc(doc(db, "users", uid), {
    walletAddress: norm(address),
    walletConnectedAt: serverTimestamp(),
  });
}

export async function connectMetaMask(uid: string): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not detected. Install the MetaMask extension.");
  }
  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error("No account returned from MetaMask.");
  await saveWallet(uid, address);
  return norm(address);
}

export async function connectAnyWallet(uid: string, wallet: WalletOption): Promise<string> {
  const provider = await wallet.getProvider();
  setSelectedProvider(provider, wallet.kind);
  await ensureArcNetworkOn(provider);
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error("No account returned from wallet.");
  await saveWallet(uid, address);
  // Persist provider kind for display
  const { db } = getFirebase();
  if (db) {
    await updateDoc(doc(db, "users", uid), { walletProvider: wallet.kind });
  }
  return norm(address);
}

export async function disconnectWallet(uid: string) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not ready");
  await updateDoc(doc(db, "users", uid), {
    walletAddress: null,
    walletConnectedAt: null,
  });
}

export const shortAddress = (a?: string | null) =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
