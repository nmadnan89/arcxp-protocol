import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import { XP_ACTIONS } from "./xp";
import { assertNotBlocked, logAbuse } from "./anti-cheat";
import { maybeActivateReferral } from "./referrals";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type GMResult =
  | { ok: true; awarded: number; streak: number }
  | { ok: false; reason: "cooldown"; nextAt: number };

export async function claimGM(uid: string): Promise<GMResult> {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not ready");
  await assertNotBlocked(uid, "claimGM");
  const userRef = doc(db, "users", uid);
  const now = Date.now();

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error("User profile missing");
    const data = snap.data();
    const last = data.lastGMClaim as Timestamp | undefined;
    const lastMs = last?.toMillis?.() ?? 0;
    if (lastMs && now - lastMs < COOLDOWN_MS) {
      return { ok: false as const, reason: "cooldown" as const, nextAt: lastMs + COOLDOWN_MS };
    }
    const within48h = lastMs && now - lastMs < 2 * COOLDOWN_MS;
    const nextStreak = within48h ? (data.gmStreak ?? 0) + 1 : 1;

    tx.update(userRef, {
      points: increment(XP_ACTIONS.gm),
      gmStreak: nextStreak,
      lastGMClaim: serverTimestamp(),
    });
    const eventRef = doc(db, "users", uid, "xpEvents", `gm__${now}`);
    tx.set(eventRef, {
      action: "gm",
      points: XP_ACTIONS.gm,
      createdAt: serverTimestamp(),
    });
    return { ok: true as const, awarded: XP_ACTIONS.gm, streak: nextStreak };
  });
  if (!result.ok && result.reason === "cooldown") {
    await logAbuse(uid, "gm_cooldown", { nextAt: result.nextAt });
  }
  if (result.ok) {
    void maybeActivateReferral(uid).catch(() => undefined);
  }
  return result;
}

export function nextGMTime(lastGMClaim: unknown): number | null {
  const last = lastGMClaim as Timestamp | undefined;
  const ms = last?.toMillis?.();
  if (!ms) return null;
  const next = ms + COOLDOWN_MS;
  return next > Date.now() ? next : null;
}

export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
