import { doc, runTransaction, serverTimestamp, increment } from "firebase/firestore";
import { getFirebase } from "./firebase";
import { assertNotBlocked, logAbuse, withinXpRateLimit } from "./anti-cheat";
import { maybeActivateReferral } from "./referrals";

export const XP_ACTIONS = {
  daily_login: 5,
  gm: 2,
  watch_video: 4,
  read_content: 2,
  publish_post: 10,
  accepted_answer: 30,
  event_participation: 20,
  author_article: 200,
  video_speaker: 500,
  // Beginner quests (one-time, lifetime dedupe).
  quest_connect_wallet: 25,
  quest_first_gm: 25,
  quest_first_mint: 100,
  quest_first_transfer: 50,
  quest_first_referral: 50,
} as const;

export type XpAction = keyof typeof XP_ACTIONS;

const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Awards XP atomically. `dedupeKey` makes the action idempotent — if the same
 * (action, dedupeKey) was already awarded for this user, the call is a no-op.
 */
export async function awardXp(
  uid: string,
  action: XpAction,
  dedupeKey: string,
): Promise<{ awarded: number; total: number } | null> {
  const { db } = getFirebase();
  if (!db) return null;
  await assertNotBlocked(uid, `awardXp:${action}`);
  if (!(await withinXpRateLimit(uid))) {
    await logAbuse(uid, "xp_rate_limit", { action, dedupeKey });
    throw new Error("XP rate limit reached. Try again later.");
  }
  const userRef = doc(db, "users", uid);
  const eventRef = doc(db, "users", uid, "xpEvents", `${action}__${dedupeKey}`);
  const points = XP_ACTIONS[action];

  const result = await runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (eventSnap.exists()) return { dup: true } as const;
    const userSnap = await tx.get(userRef);
    const current = (userSnap.data()?.points as number | undefined) ?? 0;
    tx.set(eventRef, { action, points, createdAt: serverTimestamp() });
    tx.update(userRef, { points: increment(points) });
    return { awarded: points, total: current + points } as const;
  });
  if (result && "dup" in result) {
    await logAbuse(uid, "duplicate_xp", { action, dedupeKey });
    return null;
  }
  // Fire-and-forget: any real XP may push the invited user past the gate.
  void maybeActivateReferral(uid).catch(() => undefined);
  return result;
}

/** Daily login: +5 XP and streak bump, only once per calendar day (UTC). */
export async function awardDailyLogin(uid: string) {
  const { db } = getFirebase();
  if (!db) return;
  const userRef = doc(db, "users", uid);
  const today = todayKey();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const last = data.lastLoginDate as string | undefined;
    if (last === today) return;

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const nextStreak = last === yesterday ? (data.streak ?? 0) + 1 : 1;

    tx.update(userRef, {
      points: increment(XP_ACTIONS.daily_login),
      streak: nextStreak,
      lastLoginDate: today,
      lastLogin: serverTimestamp(),
    });
    const eventRef = doc(db, "users", uid, "xpEvents", `daily_login__${today}`);
    tx.set(eventRef, {
      action: "daily_login",
      points: XP_ACTIONS.daily_login,
      createdAt: serverTimestamp(),
    });
  });
  void maybeActivateReferral(uid).catch(() => undefined);
}
