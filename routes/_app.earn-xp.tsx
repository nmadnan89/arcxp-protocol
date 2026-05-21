import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useXpEvents } from "@/lib/use-xp-events";
import { TASKS, taskPoints, taskEventId, taskDedupeKey } from "@/lib/tasks";
import { claimGM, nextGMTime } from "@/lib/gm";
import { Link } from "@tanstack/react-router";
import {
  Sun,
  LogIn,
  BookOpen,
  Play,
  CalendarCheck,
  Wallet,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/_app/earn-xp")({
  head: () => ({
    meta: [
      { title: "How to Earn XP — ARC XP" },
      { name: "description", content: "Discover every way to earn XP in the ARC XP Protocol. Daily tasks, events, wallet bonuses, and more." },
    ],
  }),
  component: EarnXpPage,
});

const ACTION_META: Record<
  string,
  { icon: React.ElementType; label: string; description: string; color: string; gradient: string }
> = {
  gm: {
    icon: Sun,
    label: "Say GM",
    description: "Start your day with the community GM message.",
    color: "text-yellow-400",
    gradient: "from-yellow-500/20 to-orange-500/20",
  },
  daily_login: {
    icon: LogIn,
    label: "Daily Login",
    description: "Sign in to the ARC XP dashboard each day.",
    color: "text-brand-cyan",
    gradient: "from-brand-cyan/20 to-brand-blue/20",
  },
  read_content: {
    icon: BookOpen,
    label: "Read Featured Content",
    description: "Read an article or blog post from the ecosystem.",
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  watch_video: {
    icon: Play,
    label: "Watch a Video",
    description: "Watch an ARC XP video or tutorial.",
    color: "text-rose-400",
    gradient: "from-rose-500/20 to-pink-500/20",
  },
  event_participation: {
    icon: CalendarCheck,
    label: "Join a Community Event",
    description: "Attend AMAs, workshops, or community calls.",
    color: "text-brand-purple",
    gradient: "from-brand-purple/20 to-brand-blue/20",
  },
};

function EarnXpPage() {
  const { profile } = useAuth();
  const { ids: claimedIds } = useXpEvents(useAuth().user?.uid);

  const todayKey = new Date().toISOString().slice(0, 10);

  const isDone = (taskId: string) => {
    const t = TASKS.find((x) => x.id === taskId);
    if (!t) return false;
    if (t.action === "gm") return nextGMTime(profile?.lastGMClaim) !== null;
    if (t.action === "daily_login") return profile?.lastLoginDate === todayKey;
    return claimedIds.has(taskEventId(t));
  };

  const walletConnected = !!profile?.walletAddress;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden glass rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-purple/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-brand-blue/25 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-4">
            <Sparkles className="h-3.5 w-3.5" /> XP Guide
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="gradient-text">How to Earn XP</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-xl mx-auto">
            Complete daily tasks, join events, and connect your wallet to climb the ARC XP leaderboard.
          </p>
        </div>
      </div>

      {/* XP Action Cards */}
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TASKS.map((t, i) => {
          const meta = ACTION_META[t.action] ?? ACTION_META["daily_login"];
          const done = isDone(t.id);
          const Icon = meta.icon;
          return (
            <div
              key={t.id}
              className="group relative glass rounded-2xl p-5 sm:p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer rounded-2xl pointer-events-none" />
              <div
                className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-40 pointer-events-none`}
              />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center glow-sm ring-1 ring-white/10`}>
                    <Icon className={`h-5 w-5 ${meta.color}`} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {done ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                        <span className="text-brand-cyan">Done</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Open</span>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-semibold tracking-tight">{meta.label}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{meta.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground/70">{t.repeat === "daily" ? "Daily" : "One-time"}</span>
                  <span className="text-lg font-bold gradient-text">+{taskPoints(t)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Wallet Bonus Card */}
        <div
          className="group relative glass rounded-2xl p-5 sm:p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300 animate-scale-in sm:col-span-2 lg:col-span-1"
          style={{ animationDelay: `${TASKS.length * 80}ms` }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer rounded-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/15 to-brand-cyan/15 opacity-50 pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 flex items-center justify-center glow-sm ring-1 ring-white/10">
                <Wallet className="h-5 w-5 text-brand-cyan" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {walletConnected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                    <span className="text-brand-cyan">Connected</span>
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Open</span>
                  </>
                )}
              </div>
            </div>
            <h3 className="text-base font-semibold tracking-tight">Connect Wallet</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Link your MetaMask wallet to unlock onchain features and the Onchain badge.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground/70">One-time</span>
              <span className="text-lg font-bold gradient-text">+Badge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-brand-cyan shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight">How It Works</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>· Daily tasks reset at midnight UTC every day.</li>
              <li>· You must click Claim to receive XP for each task.</li>
              <li>· Some tasks are auto-completed when you perform the action.</li>
              <li>· Wallet connection is permanent and unlocks bonus features.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-primary-foreground font-semibold text-sm glow hover:opacity-90 transition"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
