import { useEffect, useRef } from "react";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { getFirebase } from "./firebase";
import { useAuth } from "./auth-context";
import { useXpEvents } from "./use-xp-events";
import { BADGE_CATALOG, computeBadges } from "./badges";

/**
 * Watches profile + xpEvents and persists newly-unlocked badge ids to
 * users/{uid}.badges via arrayUnion. Idempotent: only writes ids missing
 * from the current profile.badges array.
 */
export function useBadgeSync() {
  const { user, profile } = useAuth();
  const { ids } = useXpEvents(user?.uid);
  const writingRef = useRef<Set<string>>(new Set());
  const toastShownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.uid || !profile) return;
    const { db } = getFirebase();
    if (!db) return;

    const owned = new Set(profile.badges ?? []);
    const unlockedNow = computeBadges(profile, ids)
      .filter((b) => b.unlocked)
      .map((b) => b.id);
    const missing = unlockedNow.filter(
      (id) => !owned.has(id) && !writingRef.current.has(id),
    );
    if (missing.length === 0) return;

    missing.forEach((id) => {
      writingRef.current.add(id);
      if (!toastShownRef.current.has(id)) {
        toastShownRef.current.add(id);
        const badge = BADGE_CATALOG.find((b) => b.id === id);
        if (badge) {
          toast.success("Badge unlocked!", {
            description: `${badge.icon} ${badge.name} — ${badge.desc}`,
          });
        }
      }
    });
    updateDoc(doc(db, "users", user.uid), {
      badges: arrayUnion(...missing),
    }).catch((err) => {
      console.warn("badge sync failed", err);
      missing.forEach((id) => writingRef.current.delete(id));
    });
  }, [user?.uid, profile, ids]);
}