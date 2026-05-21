import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { getFirebase } from "./firebase";
import type { UserProfile } from "./auth-context";

export type LeaderRow = UserProfile & { rank: number };

export function useLeaderboard(top = 50) {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(top));
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d, i) => {
        const data = d.data() as UserProfile;
        return { ...data, rank: i + 1 } as LeaderRow;
      });
      setRows(next);
      setLoading(false);
    });
    return () => unsub();
  }, [top]);

  return { rows, loading };
}
