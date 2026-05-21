import { useEffect, useState } from "react";
import {
  Timestamp,
  collectionGroup,
  documentId,
  getDocs,
  onSnapshot,
  query,
  where,
  collection,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import type { UserProfile } from "./auth-context";

export type WeeklyRow = UserProfile & { rank: number; weeklyPoints: number };

/**
 * Aggregates xpEvents from the past 7 days across all users via collectionGroup.
 * Returns top users sorted by weekly XP, with profile data hydrated.
 */
export function useWeeklyLeaderboard(top = 50) {
  const [rows, setRows] = useState<WeeklyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }
    const since = Timestamp.fromMillis(Date.now() - 7 * 86_400_000);
    const q = query(collectionGroup(db, "xpEvents"), where("createdAt", ">=", since));

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const totals = new Map<string, number>();
        for (const d of snap.docs) {
          const uid = d.ref.parent.parent?.id;
          if (!uid) continue;
          const pts = (d.data().points as number | undefined) ?? 0;
          totals.set(uid, (totals.get(uid) ?? 0) + pts);
        }
        const sorted = [...totals.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, top);

        if (sorted.length === 0) {
          setRows([]);
          setLoading(false);
          return;
        }

        // Hydrate user profiles in chunks of 10 (Firestore `in` limit).
        const uids = sorted.map(([uid]) => uid);
        const profiles = new Map<string, UserProfile>();
        for (let i = 0; i < uids.length; i += 10) {
          const chunk = uids.slice(i, i + 10);
          const snap = await getDocs(
            query(collection(db, "users"), where(documentId(), "in", chunk)),
          );
          snap.docs.forEach((d) => profiles.set(d.id, d.data() as UserProfile));
        }

        const next: WeeklyRow[] = sorted.map(([uid, weeklyPoints], i) => ({
          ...(profiles.get(uid) ?? ({ uid, name: "Explorer", username: "explorer", email: "", points: 0, streak: 0, badges: [] } as UserProfile)),
          rank: i + 1,
          weeklyPoints,
        }));
        setRows(next);
        setLoading(false);
      },
      (err) => {
        console.warn("weekly leaderboard subscription failed", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [top]);

  return { rows, loading };
}