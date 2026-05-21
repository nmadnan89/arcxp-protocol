import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { getFirebase } from "./firebase";

export type AbuseKind =
  | "duplicate_xp"
  | "gm_cooldown"
  | "referral_self"
  | "referral_duplicate"
  | "referral_invalid"
  | "event_duplicate_rsvp"
  | "event_duplicate_attendance"
  | "wallet_taken"
  | "wallet_relink"
  | "xp_rate_limit"
  | "blocked_user_attempt";

const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_MAX_EVENTS = 60; // max XP awards / hour
const STRIKE_BLOCK_THRESHOLD = 10; // abuse strikes within window => block

/** Persist an abuse signal. Best-effort; never throws to caller. */
export async function logAbuse(
  uid: string | null | undefined,
  kind: AbuseKind,
  meta: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { db } = getFirebase();
    if (!db || !uid) return;
    await addDoc(collection(db, "abuseLogs"), {
      uid,
      kind,
      meta,
      createdAt: serverTimestamp(),
    });
    // Auto-block if too many strikes in the recent window.
    const since = Timestamp.fromMillis(Date.now() - RATE_WINDOW_MS);
    const c = await getCountFromServer(
      query(
        collection(db, "abuseLogs"),
        where("uid", "==", uid),
        where("createdAt", ">=", since),
      ),
    );
    if (c.data().count >= STRIKE_BLOCK_THRESHOLD) {
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", uid), {
        blocked: true,
        blockedAt: serverTimestamp(),
        blockedReason: kind,
      }).catch(() => undefined);
    }
  } catch {
    /* swallow — telemetry must not break the user flow */
  }
}

/** Reads users/{uid}.blocked. True means user is blocked from earning XP. */
export async function isBlocked(uid: string): Promise<boolean> {
  try {
    const { db } = getFirebase();
    if (!db) return false;
    const snap = await getDoc(doc(db, "users", uid));
    return Boolean(snap.data()?.blocked);
  } catch {
    return false;
  }
}

/** Throws if the user is blocked. Logs the attempt. */
export async function assertNotBlocked(uid: string, context: string): Promise<void> {
  const blocked = await isBlocked(uid);
  if (blocked) {
    await logAbuse(uid, "blocked_user_attempt", { context });
    throw new Error("Account temporarily restricted due to suspicious activity.");
  }
}

/**
 * Hard rate-limit: caps the number of XP-earning events per user per hour.
 * Returns true if the user is within the allowed limit.
 */
export async function withinXpRateLimit(uid: string): Promise<boolean> {
  try {
    const { db } = getFirebase();
    if (!db) return true;
    const since = Timestamp.fromMillis(Date.now() - RATE_WINDOW_MS);
    const c = await getCountFromServer(
      query(
        collection(db, "users", uid, "xpEvents"),
        where("createdAt", ">=", since),
      ),
    );
    return c.data().count < RATE_MAX_EVENTS;
  } catch {
    return true;
  }
}