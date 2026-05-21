import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import { awardXp, XP_ACTIONS } from "./xp";
import { assertNotBlocked, logAbuse } from "./anti-cheat";

/**
 * RSVP to an event. Idempotent — re-RSVPing is a no-op.
 * Increments the event's `going` count exactly once per user.
 */
export async function rsvpEvent(eventId: string, uid: string) {
  const { db } = getFirebase();
  if (!db) return { already: false };
  await assertNotBlocked(uid, "rsvpEvent");
  const eventRef = doc(db, "events", eventId);
  const rsvpRef = doc(db, "events", eventId, "rsvps", uid);

  const res = await runTransaction(db, async (tx) => {
    const rsvpSnap = await tx.get(rsvpRef);
    if (rsvpSnap.exists()) return { already: true };
    tx.set(rsvpRef, { uid, createdAt: serverTimestamp() });
    tx.update(eventRef, { going: increment(1) });
    return { already: false };
  });
  if (res.already) await logAbuse(uid, "event_duplicate_rsvp", { eventId });
  return res;
}

export async function cancelRsvp(eventId: string, uid: string) {
  const { db } = getFirebase();
  if (!db) return;
  const eventRef = doc(db, "events", eventId);
  const rsvpRef = doc(db, "events", eventId, "rsvps", uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(rsvpRef);
    if (!snap.exists()) return;
    tx.delete(rsvpRef);
    tx.update(eventRef, { going: increment(-1) });
  });
}

/**
 * Mark attendance and award XP. Duplicate-safe:
 *  - the attendee doc is the per-user attendance record
 *  - XP is awarded through awardXp with a deterministic dedupe key, so the
 *    same user cannot earn the event's XP twice.
 */
export async function markAttendance(eventId: string, uid: string) {
  const { db } = getFirebase();
  if (!db) return null;
  await assertNotBlocked(uid, "markAttendance");
  const eventRef = doc(db, "events", eventId);
  const attendeeRef = doc(db, "events", eventId, "attendees", uid);

  const firstTime = await runTransaction(db, async (tx) => {
    const snap = await tx.get(attendeeRef);
    if (snap.exists()) return false;
    tx.set(attendeeRef, { uid, createdAt: serverTimestamp() });
    tx.update(eventRef, { attendees: increment(1) });
    return true;
  });

  if (!firstTime) await logAbuse(uid, "event_duplicate_attendance", { eventId });
  // awardXp is internally idempotent on (action, dedupeKey) — safe regardless.
  const award = await awardXp(uid, "event_participation", `event:${eventId}`);
  return {
    firstTime,
    awarded: award?.awarded ?? 0,
    total: award?.total ?? 0,
    points: XP_ACTIONS.event_participation,
  };
}