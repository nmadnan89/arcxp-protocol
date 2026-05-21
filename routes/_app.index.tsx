import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Trophy, Award, TrendingUp, CheckCircle2, Circle, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EcosystemPulse } from "@/components/EcosystemPulse";
import { useAuth } from "@/lib/auth-context";
import { useLeaderboard } from "@/lib/use-leaderboard";
import { TASKS, taskPoints, taskEventId, taskDedupeKey } from "@/lib/tasks";
import { useXpEvents } from "@/lib/use-xp-events";
import { awardXp } from "@/lib/xp";
import { GMButton } from "@/components/GMButton";
import { claimGM, nextGMTime } from "@/lib/gm";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useActivity, actionLabel, timeAgo } from "@/lib/use-activity";
import { ReferralCard } from "@/components/ReferralCard";
import { ReferralLeaderboard } from "@/components/ReferralLeaderboard";
import { OnboardingChecklistCard } from "@/components/OnboardingTour";
import { BeginnerQuests } from "@/components/BeginnerQuests";
import { useEvents, partitionEvents } from "@/lib/use-events";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Dashboard — ARC XP" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile } = useAuth();
  const username = profile?.name ?? profile?.username ?? "Explorer";
  const points = profile?.points ?? 0;
  const streak = profile?.streak ?? 0;
  const badgesEarned = profile?.badges?.length ?? 0;
  const { rows } = useLeaderboard(100);
  const myRank = useMemo(
    () => (user ? rows.findIndex((r) => r.uid === user.uid) + 1 : 0),
    [rows, user],
  );
  const rankLabel = myRank > 0 ? `#${myRank}` : "—";
  const { ids: claimedIds } = useXpEvents(user?.uid);
  const { rows: activity } = useActivity(user?.uid, 5);
  const { events: allEvents } = useEvents();
  const upcoming = useMemo(
    () => partitionEvents(allEvents).upcoming.slice(0, 3),
    [allEvents],
  );
  const [pending, setPending] = useState<string | null>(null);

  const todayKey = new Date().toISOString().slice(0, 10);
  const isDone = (taskId: string) => {
    const t = TASKS.find((x) => x.id === taskId);
    if (!t) return false;
    if (t.action === "gm") return nextGMTime(profile?.lastGMClaim) !== null;
    if (t.action === "daily_login") return profile?.lastLoginDate === todayKey;
    return claimedIds.has(taskEventId(t));
  };
  const completedCount = TASKS.filter((t) => isDone(t.id)).length;

  const handleClaim = async (taskId: string) => {
    if (!user) return;
    const t = TASKS.find((x) => x.id === taskId);
    if (!t || isDone(taskId)) return;
    setPending(taskId);
    try {
      if (t.action === "gm") {
        const res = await claimGM(user.uid);
        if (res.ok) {
          toast.success("GM claimed!", {
            description: `+${res.awarded} XP · Streak: ${res.streak} days`,
          });
        }
      } else if (t.action === "daily_login") {
        // Auto-awarded on sign-in; nothing to claim manually.
      } else {
        const res = await awardXp(user.uid, t.action, taskDedupeKey(t));
        if (res) {
          toast.success(`${t.title} completed`, {
            description: `+${res.awarded} XP · Total: ${res.total}`,
          });
        }
      }
    } catch (e) {
      console.warn("award xp failed", e);
    } finally {
      setPending(null);
    }
  };

  const stats = [
    { label: "Total Points", value: points.toLocaleString(), icon: TrendingUp, accent: "from-brand-purple to-brand-blue" },
    { label: "Daily Streak", value: `${streak} days`, icon: Flame, accent: "from-orange-500 to-pink-500" },
    { label: "Badges Earned", value: badgesEarned, icon: Award, accent: "from-brand-blue to-brand-cyan" },
    { label: "Global Rank", value: rankLabel, icon: Trophy, accent: "from-yellow-400 to-orange-500" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden glass rounded-2xl sm:rounded-3xl p-6 sm:p-10">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-purple/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-brand-blue/30 blur-3xl pointer-events-none" />
        {/* hex pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'><path d='M30 1 L58 17 V35 L30 51 L2 35 V17 Z' fill='none' stroke='white' stroke-width='1'/></svg>\")",
            backgroundSize: "60px 52px",
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" /> Live
            </div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter mt-1 break-words">
              <span className="gradient-text">{username}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-md">
              {streak > 0 ? (
                <>Keep your <span className="text-brand-cyan font-medium">{streak}-day streak</span> alive.</>
              ) : (
                <>Claim your first GM to start a streak.</>
              )}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0 w-full sm:w-auto">
            <WalletConnectButton />
            <div className="glass-strong rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-brand-cyan" /> Rank {rankLabel}
            </div>
          </div>
        </div>
      </div>

      {/* GM daily */}
      <GMButton />

      {/* First-run checklist */}
      <OnboardingChecklistCard />

      {/* Beginner quests */}
      <BeginnerQuests variant="card" />

      {/* Ecosystem pulse */}
      <EcosystemPulse />

      {/* Referrals */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        <ReferralCard />
        <ReferralLeaderboard />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="group relative glass rounded-2xl p-4 sm:p-6 overflow-hidden hover:-translate-y-1 hover:glow-sm transition-all duration-300 animate-scale-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer rounded-2xl pointer-events-none" />
            <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center mb-3 sm:mb-4 glow-sm`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{s.value}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 uppercase tracking-wider truncate">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Daily Tasks */}
        <div className="glass rounded-2xl p-6 sm:p-7 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold tracking-tight">Daily Tasks</h2>
            <span className="text-xs text-muted-foreground glass-strong px-3 py-1 rounded-full">
              {completedCount}/{TASKS.length} complete
            </span>
          </div>
          <div className="space-y-2.5">
            {TASKS.map((t) => {
              const done = isDone(t.id);
              const isPending = pending === t.id;
              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    done
                      ? "bg-brand-cyan/[0.06] border-brand-cyan/20"
                      : "border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-brand-cyan shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className={`text-sm truncate ${done ? "text-muted-foreground" : "font-medium"}`}>{t.title}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        {t.repeat === "daily" ? "Resets daily" : "One-time"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold gradient-text">+{taskPoints(t)}</span>
                    <button
                      onClick={() => handleClaim(t.id)}
                      disabled={done || isPending || !user}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                        done
                          ? "glass-strong text-brand-cyan ring-1 ring-brand-cyan/40 cursor-default"
                          : "gradient-bg text-primary-foreground glow hover:opacity-90 disabled:opacity-50"
                      }`}
                    >
                      {done ? "Claimed" : isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Claim"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
            <Link to="/activity" className="text-sm text-brand-cyan flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {activity.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity yet — claim a task to get started.</div>
          ) : (
            <div className="space-y-4">
              {activity.map((a) => {
                const dt = a.createdAt && typeof a.createdAt.toDate === "function" ? a.createdAt.toDate() : null;
                return (
                  <div key={a.id} className="flex items-start gap-3 group">
                    <div className="h-2 w-2 rounded-full gradient-bg mt-2 shrink-0 glow-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate group-hover:text-brand-cyan transition">
                        {actionLabel(a.action)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {dt ? timeAgo(dt) : ""} · <span className="text-brand-cyan">+{a.points}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="glass rounded-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold tracking-tight">Upcoming Events</h2>
          <Link to="/events" className="text-sm text-brand-cyan flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="text-sm text-muted-foreground">No upcoming events yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {upcoming.map((e) => (
              <div key={e.id} className="glass-strong rounded-xl p-5 hover:-translate-y-1 hover:glow-sm transition-all duration-300">
                <div className="flex items-center gap-2 text-xs text-brand-cyan mb-2 uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5" /> {e.type}
                </div>
                <div className="font-semibold mb-1.5">{e.title}</div>
                <div className="text-xs text-muted-foreground">{e.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}