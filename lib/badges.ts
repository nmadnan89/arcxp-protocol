import type { UserProfile } from "./auth-context";

export type BadgeDef = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  /** returns 0..1 (1 = unlocked) given profile + claimed event ids set */
  progress: (profile: UserProfile | null, events: Set<string>) => number;
};

const has = (events: Set<string>, action: string) =>
  Array.from(events).some((id) => id.startsWith(action + "__"));

export const BADGE_CATALOG: BadgeDef[] = [
  {
    id: "starter",
    name: "Starter",
    desc: "Sign in for the first time",
    icon: "🌱",
    progress: (p) => (p ? 1 : 0),
  },
  {
    id: "explorer",
    name: "Explorer",
    desc: "Earn 50 XP",
    icon: "🧗",
    progress: (p) => Math.min(1, (p?.points ?? 0) / 50),
  },
  {
    id: "contributor",
    name: "Contributor",
    desc: "Earn 100 XP",
    icon: "🛠️",
    progress: (p) => Math.min(1, (p?.points ?? 0) / 100),
  },
  {
    id: "onchain",
    name: "Onchain",
    desc: "Connect your wallet",
    icon: "⛓️",
    progress: (p) => (p?.walletAddress ? 1 : 0),
  },
  {
    id: "consistent",
    name: "Consistent",
    desc: "Reach a 7-day GM streak",
    icon: "📅",
    progress: (p) => Math.min(1, (p?.gmStreak ?? 0) / 7),
  },
  {
    id: "first_steps",
    name: "First Steps",
    desc: "Earn your first XP",
    icon: "🚀",
    progress: (p) => ((p?.points ?? 0) > 0 ? 1 : 0),
  },
  {
    id: "streak_7",
    name: "Streak Starter",
    desc: "Maintain a 7-day streak",
    icon: "🔥",
    progress: (p) => Math.min(1, (p?.streak ?? 0) / 7),
  },
  {
    id: "streak_30",
    name: "Daily Devotee",
    desc: "Maintain a 30-day streak",
    icon: "⚡",
    progress: (p) => Math.min(1, (p?.streak ?? 0) / 30),
  },
  {
    id: "cinephile",
    name: "Cinephile",
    desc: "Watch a video",
    icon: "🎬",
    progress: (_p, e) => (has(e, "watch_video") ? 1 : 0),
  },
  {
    id: "curious_mind",
    name: "Curious Mind",
    desc: "Read featured content",
    icon: "📖",
    progress: (_p, e) => (has(e, "read_content") ? 1 : 0),
  },
  {
    id: "voice",
    name: "Have a Voice",
    desc: "Publish a forum post",
    icon: "💬",
    progress: (_p, e) => (has(e, "publish_post") ? 1 : 0),
  },
  {
    id: "helper",
    name: "Helping Hand",
    desc: "Get an accepted answer",
    icon: "🤝",
    progress: (_p, e) => (has(e, "accepted_answer") ? 1 : 0),
  },
  {
    id: "event_goer",
    name: "Community",
    desc: "Join your first community event",
    icon: "🎟️",
    progress: (_p, e) => (has(e, "event_participation") ? 1 : 0),
  },
  {
    id: "wordsmith",
    name: "Wordsmith",
    desc: "Author an article",
    icon: "✍️",
    progress: (_p, e) => (has(e, "author_article") ? 1 : 0),
  },
  {
    id: "speaker",
    name: "Speaker",
    desc: "Speak in a video session",
    icon: "🎙️",
    progress: (_p, e) => (has(e, "video_speaker") ? 1 : 0),
  },
  {
    id: "wallet_linked",
    name: "On-Chain",
    desc: "Connect a wallet",
    icon: "🔗",
    progress: (p) => (p?.walletAddress ? 1 : 0),
  },
  {
    id: "voyager",
    name: "Voyager",
    desc: "Earn 500 XP",
    icon: "🧭",
    progress: (p) => Math.min(1, (p?.points ?? 0) / 500),
  },
  {
    id: "pioneer",
    name: "Pioneer",
    desc: "Earn 5,000 XP",
    icon: "💎",
    progress: (p) => Math.min(1, (p?.points ?? 0) / 5000),
  },
  {
    id: "legend",
    name: "Legend",
    desc: "Earn 25,000 XP",
    icon: "👑",
    progress: (p) => Math.min(1, (p?.points ?? 0) / 25000),
  },
];

export type ComputedBadge = BadgeDef & { unlocked: boolean; pct: number };

export function computeBadges(
  profile: UserProfile | null,
  events: Set<string>,
): ComputedBadge[] {
  return BADGE_CATALOG.map((b) => {
    const p = b.progress(profile, events);
    return { ...b, pct: Math.round(p * 100), unlocked: p >= 1 };
  });
}
