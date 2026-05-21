import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { getFirebase } from "./firebase";

export type EventDoc = {
  id: string;
  title: string;
  type: string;
  host: string;
  date: string;
  description?: string;
  startAt?: Timestamp;
  going?: number;
  attendees?: number;
  createdAt?: Timestamp;
};

export function useEvents() {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEvents(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventDoc, "id">) })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  return { events, loading };
}

export function useEvent(id: string | undefined) {
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "events", id), (snap) => {
      if (snap.exists()) {
        setEvent({ id: snap.id, ...(snap.data() as Omit<EventDoc, "id">) });
      } else {
        setEvent(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  return { event, loading };
}

/** Subscribe to user-keyed presence in a subcollection of an event. */
export function useEventMember(
  sub: "rsvps" | "attendees",
  eventId: string | undefined,
  uid: string | undefined,
) {
  const [present, setPresent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !uid) {
      setLoading(false);
      return;
    }
    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "events", eventId, sub, uid), (snap) => {
      setPresent(snap.exists());
      setLoading(false);
    });
    return () => unsub();
  }, [sub, eventId, uid]);

  return { present, loading };
}

export function isPast(e: EventDoc): boolean {
  const t = e.startAt?.toDate?.().getTime();
  if (!t) return false;
  return t < Date.now();
}

export function partitionEvents(events: EventDoc[]) {
  const upcoming: EventDoc[] = [];
  const past: EventDoc[] = [];
  for (const e of events) {
    if (isPast(e)) past.push(e);
    else upcoming.push(e);
  }
  // upcoming: soonest first
  upcoming.sort(
    (a, b) =>
      (a.startAt?.toDate?.().getTime() ?? Infinity) -
      (b.startAt?.toDate?.().getTime() ?? Infinity),
  );
  // past: most recent first
  past.sort(
    (a, b) =>
      (b.startAt?.toDate?.().getTime() ?? 0) - (a.startAt?.toDate?.().getTime() ?? 0),
  );
  return { upcoming, past };
}