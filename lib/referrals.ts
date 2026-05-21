import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  increment,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebase } from "./firebase";
import { assertNotBlocked, logAbuse } from "./anti-cheat";

const PENDING_KEY = "arc_pending_referral";
export const REFERRAL_XP = 10;
/** Referrer's reward — paid only after the invited user activates. */
export const REFERRER_BONUS_XP = 25;
/**
 * Activation gate: the invited user must have earned at least this much XP
 * (excluding the signup referral bonus) before the referrer is rewarded.
 * A linked wallet OR streak >= 2 also satisfies activation.
 */
export const REFERRAL_ACTIVATION_XP = 25;
/** Max activations a single referrer can earn rewards for per 24h. */
export const REFERRAL_DAILY_CAP = 10;

/** Deterministic, shareable referral code derived from uid. */
export function codeForUid(uid: string): string {
  // base32-ish, 8 chars uppercase
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) | 0;
  const tail = Math.abs(h).toString(36).toUpperCase().padStart(4, "0").slice(-4);
  const head = uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase().padStart(4, "X");
  return `${head}${tail}`;
}

export function referralLinkFor(code: string): string {
  if (typeof window === "undefined") return `?ref=${code}`;
  const url = new URL(window.location.origin);
  url.searchParams.set("ref", code);
  return url.toString();
}

/** Capture ?ref=CODE from URL on first paint so it survives the OAuth round-trip. */
export function capturePendingReferral() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (ref && ref.length >= 4 && ref.length <= 32) {
      window.localStorage.setItem(PENDING_KEY, ref.toUpperCase());
    }
  } catch {
    /* noop */
  }
}

export function consumePendingReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(PENDING_KEY);
    if (v) window.localStorage.removeItem(PENDING_KEY);
    return v;
  } catch {
    return null;
  }
}

/** Ensures the user doc has its referralCode field set (idempotent). */
export async function ensureReferralCode(uid: string): Promise<string> {
  const code = codeForUid(uid);
  const { db } = getFirebase();
  if (!db) return code;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const existing = snap.data()?.referralCode as string | undefined;
  if (existing) return existing;
  await setDoc(
    userRef,
    {
      referralCode: code,
      referralCount: snap.data()?.referralCount ?? 0,
    },
    { merge: true },
  );
  return code;
}

/**
 * Apply a referral code for a newly signed-up user.
 * Rules enforced:
 *  - code must resolve to a different uid
 *  - target user can only be referred once (referredBy set => abort)
 *  - invited user earns +REFERRAL_XP exactly once (signup bonus)
 *  - referral is created in `status: "pending"`; the referrer's reward is
 *    granted later by `maybeActivateReferral` once the invited user has
 *    demonstrated real activity (XP threshold, wallet link, or streak).
 */
export async function applyReferralCode(
  invitedUid: string,
  rawCode: string,
): Promise<{ ok: boolean; reason?: string }> {
  const { db } = getFirebase();
  if (!db) return { ok: false, reason: "offline" };
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: "empty" };
  await assertNotBlocked(invitedUid, "applyReferralCode").catch(() => undefined);

  // Find referrer by code
  const qs = await getDocs(
    query(collection(db, "users"), where("referralCode", "==", code), limit(1)),
  );
  if (qs.empty) {
    await logAbuse(invitedUid, "referral_invalid", { code });
    return { ok: false, reason: "invalid_code" };
  }
  const referrerSnap = qs.docs[0];
  const referrerUid = referrerSnap.id;
  if (referrerUid === invitedUid) {
    await logAbuse(invitedUid, "referral_self", { code });
    return { ok: false, reason: "self" };
  }

  const invitedRef = doc(db, "users", invitedUid);
  const referralRef = doc(db, "referrals", invitedUid); // 1 doc per invited user
  const invitedXpRef = doc(db, "users", invitedUid, "xpEvents", `signup_referral__self`);

  try {
    await runTransaction(db, async (tx) => {
      const [invitedSnap, refSnap] = await Promise.all([
        tx.get(invitedRef),
        tx.get(referralRef),
      ]);
      if (!invitedSnap.exists()) throw new Error("invited_missing");
      if (invitedSnap.data()?.referredBy) throw new Error("already_referred");
      if (refSnap.exists()) throw new Error("duplicate");

      // Write referral record (pending — referrer reward gated on activation)
      tx.set(referralRef, {
        invitedUid,
        referrerUid,
        code,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Mark invited user + award the invited-side signup bonus (small, capped).
      tx.update(invitedRef, {
        referredBy: referrerUid,
        referredByCode: code,
        referredAt: serverTimestamp(),
        points: increment(REFERRAL_XP),
      });
      tx.set(invitedXpRef, {
        action: "signup_referral",
        points: REFERRAL_XP,
        createdAt: serverTimestamp(),
        meta: { referrerUid },
      });
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    if (msg === "already_referred" || msg === "duplicate") {
      await logAbuse(invitedUid, "referral_duplicate", { code, referrerUid });
    }
    return { ok: false, reason: msg };
  }
}

/**
 * Has the invited user demonstrated enough real activity to "activate" their
 * referral? Excludes the signup bonus itself.
 */
function isActivated(profile: Record<string, unknown>): boolean {
  const points = (profile.points as number | undefined) ?? 0;
  const streak = (profile.streak as number | undefined) ?? 0;
  const gmStreak = (profile.gmStreak as number | undefined) ?? 0;
  const wallet = profile.walletAddress as string | null | undefined;
  const earned = Math.max(0, points - REFERRAL_XP); // strip signup bonus
  return earned >= REFERRAL_ACTIVATION_XP || Boolean(wallet) || streak >= 2 || gmStreak >= 2;
}

/**
 * Idempotently activates the referral for `invitedUid` and rewards the referrer
 * if (and only if) the invited user passes the activation gate AND the referrer
 * is under the daily activation cap. Safe to call from any hot path — it short-
 * circuits quickly when there is nothing to do.
 */
export async function maybeActivateReferral(invitedUid: string): Promise<"activated" | "pending" | "noop" | "capped"> {
  const { db } = getFirebase();
  if (!db || !invitedUid) return "noop";
  const referralRef = doc(db, "referrals", invitedUid);

  // Cheap pre-check before opening a transaction.
  const refSnap = await getDoc(referralRef).catch(() => null);
  if (!refSnap || !refSnap.exists()) return "noop";
  const refData = refSnap.data() as { status?: string; referrerUid?: string };
  if (refData.status === "activated") return "noop";
  const referrerUid = refData.referrerUid;
  if (!referrerUid) return "noop";

  const invitedRef = doc(db, "users", invitedUid);
  const invitedSnap = await getDoc(invitedRef).catch(() => null);
  if (!invitedSnap?.exists()) return "noop";
  if (!isActivated(invitedSnap.data())) return "pending";

  // Daily-cap check on the referrer — anti-farming.
  try {
    const since = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const capCheck = await getCountFromServer(
      query(
        collection(db, "referrals"),
        where("referrerUid", "==", referrerUid),
        where("activatedAt", ">=", since),
      ),
    );
    if (capCheck.data().count >= REFERRAL_DAILY_CAP) {
      await logAbuse(referrerUid, "referral_duplicate", {
        invitedUid,
        reason: "daily_cap",
      });
      return "capped";
    }
  } catch {
    /* count failures are non-fatal — fall through */
  }

  const referrerRef = doc(db, "users", referrerUid);
  const referrerXpRef = doc(db, "users", referrerUid, "xpEvents", `referral__${invitedUid}`);

  try {
    await runTransaction(db, async (tx) => {
      const [r, xp] = await Promise.all([tx.get(referralRef), tx.get(referrerXpRef)]);
      if (!r.exists()) throw new Error("missing");
      if ((r.data() as { status?: string }).status === "activated") return;
      if (xp.exists()) {
        // Already rewarded but doc out of sync — just flip the status.
        tx.update(referralRef, { status: "activated", activatedAt: serverTimestamp() });
        return;
      }
      tx.update(referralRef, { status: "activated", activatedAt: serverTimestamp() });
      tx.update(referrerRef, {
        points: increment(REFERRER_BONUS_XP),
        referralCount: increment(1),
      });
      tx.set(referrerXpRef, {
        action: "referral",
        points: REFERRER_BONUS_XP,
        createdAt: serverTimestamp(),
        meta: { invitedUid },
      });
    });
    return "activated";
  } catch {
    return "noop";
  }
}

/**
 * Records the invited user's wallet address on the referral doc. Blocks the
 * cross-account farming pattern where one wallet is recycled to claim multiple
 * referrals. If the same wallet is already attached to a *different* invited
 * user's referral, the referral is voided.
 */
export async function attachWalletToReferral(
  invitedUid: string,
  walletAddress: string,
): Promise<"ok" | "voided" | "noop"> {
  const { db } = getFirebase();
  if (!db || !invitedUid || !walletAddress) return "noop";
  const wallet = walletAddress.toLowerCase();
  const referralRef = doc(db, "referrals", invitedUid);
  const snap = await getDoc(referralRef).catch(() => null);
  if (!snap?.exists()) return "noop";

  // Look for prior referrals using the same wallet but a different invited user.
  try {
    const dupQ = await getDocs(
      query(collection(db, "referrals"), where("invitedWallet", "==", wallet), limit(2)),
    );
    const conflict = dupQ.docs.find((d) => d.id !== invitedUid);
    if (conflict) {
      await setDoc(
        referralRef,
        { invitedWallet: wallet, status: "voided", voidedReason: "wallet_reuse", voidedAt: serverTimestamp() },
        { merge: true },
      );
      await logAbuse(invitedUid, "referral_duplicate", {
        wallet,
        conflictUid: conflict.id,
        reason: "wallet_reuse",
      });
      return "voided";
    }
  } catch {
    /* best-effort */
  }

  await setDoc(referralRef, { invitedWallet: wallet }, { merge: true });
  return "ok";
}

export type LeaderboardRow = {
  uid: string;
  count: number;
  username?: string;
  name?: string;
  email?: string;
  photoURL?: string;
};

/** Subscribes to top referrers (by `referralCount` on user docs). */
export function useReferralLeaderboard(top = 10) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "users"),
      where("referralCount", ">", 0),
      // Firestore requires the inequality field to be first in orderBy.
      // We'll sort client-side after fetching a generous page.
      limit(Math.max(top * 5, 50)),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: LeaderboardRow[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            count: (data.referralCount as number | undefined) ?? 0,
            username: data.username as string | undefined,
            name: data.name as string | undefined,
            email: data.email as string | undefined,
            photoURL: data.photoURL as string | undefined,
          };
        });
        list.sort((a, b) => b.count - a.count);
        setRows(list.slice(0, top));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [top]);

  return { rows, loading };
}

export type ReferralStats = {
  code: string;
  count: number;
  pending: number;
  activated: number;
  voided: number;
  invited: Array<{
    uid: string;
    status?: "pending" | "activated" | "voided";
    createdAt?: { toDate?: () => Date };
    activatedAt?: { toDate?: () => Date };
  }>;
};

/** Real-time stats for the current user's referrals. */
export function useReferralStats(uid: string | undefined): ReferralStats & { loading: boolean } {
  const [code, setCode] = useState<string>(uid ? codeForUid(uid) : "");
  const [count, setCount] = useState(0);
  const [pending, setPending] = useState(0);
  const [activated, setActivated] = useState(0);
  const [voided, setVoided] = useState(0);
  const [invited, setInvited] = useState<ReferralStats["invited"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }
    setCode(codeForUid(uid));
    void ensureReferralCode(uid).then((c) => setCode(c));

    const unsubUser = onSnapshot(doc(db, "users", uid), (snap) => {
      const data = snap.data();
      if (data?.referralCode) setCode(data.referralCode as string);
      setCount((data?.referralCount as number | undefined) ?? 0);
    });
    const unsubList = onSnapshot(
      query(collection(db, "referrals"), where("referrerUid", "==", uid)),
      (qs) => {
        let p = 0, a = 0, v = 0;
        const rows = qs.docs.map((d) => {
          const data = d.data() as {
            invitedUid?: string;
            status?: "pending" | "activated" | "voided";
            createdAt?: { toDate?: () => Date };
            activatedAt?: { toDate?: () => Date };
          };
          const status = data.status ?? "pending";
          if (status === "activated") a += 1;
          else if (status === "voided") v += 1;
          else p += 1;
          return {
            uid: data.invitedUid ?? d.id,
            status,
            createdAt: data.createdAt,
            activatedAt: data.activatedAt,
          };
        });
        setInvited(rows);
        setPending(p);
        setActivated(a);
        setVoided(v);
        setLoading(false);
      },
    );
    return () => {
      unsubUser();
      unsubList();
    };
  }, [uid]);

  return { code, count, pending, activated, voided, invited, loading };
}
