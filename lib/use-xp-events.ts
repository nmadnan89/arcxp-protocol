import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebase } from "./firebase";

/**
 * Subscribes to the user's xpEvents subcollection and returns a Set of
 * existing event document IDs (formatted `${action}__${dedupeKey}`).
 * Used to render claimed/completed UI state for tasks.
 */
export function useXpEvents(uid: string | undefined) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setIds(new Set());
      setLoading(false);
      return;
    }
    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(collection(db, "users", uid, "xpEvents"), (snap) => {
      setIds(new Set(snap.docs.map((d) => d.id)));
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  return { ids, loading };
}