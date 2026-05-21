import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { getFirebase } from "./firebase";
import { XP_ACTIONS, type XpAction } from "./xp";

export type ActivityRow = {
  id: string;
  action: XpAction;
  points: number;
  createdAt?: { toDate?: () => Date } | null;
};

const LABELS: Record<XpAction, string> = {
  daily_login: "Daily login",
  gm: "GM check-in",
  watch_video: "Watched a video",
  read_content: "Read featured content",
  publish_post: "Published a forum post",
  accepted_answer: "Accepted answer",
  event_participation: "Joined an event",
  author_article: "Authored an article",
  video_speaker: "Spoke in a video session",
  quest_connect_wallet: "Quest: Connected wallet",
  quest_first_gm: "Quest: First GM",
  quest_first_mint: "Quest: First NFT mint",
  quest_first_transfer: "Quest: First USDC transfer",
  quest_first_referral: "Quest: First referral",
};

export function actionLabel(a: XpAction) {
  return LABELS[a] ?? a;
}

export function actionPoints(a: XpAction) {
  return XP_ACTIONS[a] ?? 0;
}

export function useActivity(uid: string | undefined, max = 8) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "users", uid, "xpEvents"),
      orderBy("createdAt", "desc"),
      limit(max),
    );
    const unsub = onSnapshot(q, (snap) => {
      setRows(
        snap.docs.map((d) => {
          const data = d.data() as Omit<ActivityRow, "id">;
          return { id: d.id, ...data };
        }),
      );
      setLoading(false);
    });
    return () => unsub();
  }, [uid, max]);

  return { rows, loading };
}

export function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
