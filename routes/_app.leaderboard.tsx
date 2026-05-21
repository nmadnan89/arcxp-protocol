import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Crown, Loader2, Medal, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLeaderboard } from "@/lib/use-leaderboard";
import { useWeeklyLeaderboard } from "@/lib/use-weekly-leaderboard";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — ARC XP" }] }),
  component: Leaderboard,
});

function avatarFor(row: { photoURL?: string; name?: string; username?: string; uid?: string }) {
  if (row.photoURL) return row.photoURL;
  const seed = row.username || row.name || row.uid || "ARC";
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=8b5cf6,3b82f6`;
}

function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "weekly">("all");
  const allTime = useLeaderboard(10);
  const weekly = useWeeklyLeaderboard(10);
  const isWeekly = tab === "weekly";
  const loading = isWeekly ? weekly.loading : allTime.loading;
  const rows = isWeekly
    ? weekly.rows.map((r) => ({ ...r, points: r.weeklyPoints }))
    : allTime.rows;

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumStyles = ["h-32", "h-44", "h-24"];
  const podiumIcons = [Medal, Crown, Trophy];
  const podiumColors = [
    "from-slate-300 to-slate-500",
    "from-yellow-300 to-orange-500",
    "from-orange-400 to-amber-700",
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Top contributors making ARC happen — live.
          </p>
        </div>
        <div className="glass inline-flex rounded-xl p-1 self-start">
          {(["all", "weekly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === t
                  ? "bg-gradient-to-r from-brand-purple to-brand-cyan text-white glow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? "All-time" : "This week"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-2xl p-6 sm:p-10 text-center text-muted-foreground">
          {isWeekly
            ? "No XP earned in the past 7 days yet. Claim a task to lead the week."
            : "No contributors yet. Earn XP to claim the top spot."}
        </div>
      ) : (
        <>
      <div className="glass rounded-2xl p-4 sm:p-8">
        <div className="flex items-end justify-center gap-2 sm:gap-6">
          {podiumOrder.map((u, i) => {
            const Icon = podiumIcons[i];
            return (
              <div
                key={u.uid ?? u.username}
                className="flex flex-col items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-[180px]"
              >
                <img
                  src={avatarFor(u)}
                  alt={u.name ?? u.username}
                  className="h-12 w-12 sm:h-20 sm:w-20 rounded-full ring-2 ring-white/20 animate-float"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
                <div className="text-center w-full">
                  <div className="font-semibold text-xs sm:text-base truncate">{u.name ?? u.username}</div>
                  <div className="text-[11px] sm:text-xs gradient-text font-bold">
                    {(u.points ?? 0).toLocaleString()}
                  </div>
                </div>
                <div
                  className={`w-full ${podiumStyles[i]} rounded-t-2xl bg-gradient-to-t ${podiumColors[i]} flex items-start justify-center pt-2 sm:pt-3 glow-sm`}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {rest.length > 0 && (
        <div className="glass rounded-2xl p-3 sm:p-6">
          <div className="space-y-2">
            {rest.map((u) => {
              const isMe = user?.uid === u.uid;
              return (
                <div
                  key={u.uid ?? `${u.rank}-${u.username}`}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition ${
                    isMe ? "glass-strong glow ring-1 ring-brand-purple/50" : "hover:bg-white/5"
                  }`}
                >
                  <div className="w-6 sm:w-8 text-center font-bold text-muted-foreground text-sm">
                    {u.rank}
                  </div>
                  <img
                    src={avatarFor(u)}
                    alt={u.name ?? u.username}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full ring-1 ring-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm sm:text-base">
                      {u.name ?? u.username}{" "}
                      {isMe && <span className="text-xs text-brand-cyan">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(u.streak ?? 0)}d streak · {(u.badges?.length ?? 0)} badges
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold gradient-text text-sm sm:text-base">
                      {(u.points ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
