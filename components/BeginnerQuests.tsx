import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Rocket, CheckCircle2, Circle, Sparkles, Loader2, ChevronRight, Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useXpEvents } from "@/lib/use-xp-events";
import { Progress } from "@/components/ui/progress";
import {
  BEGINNER_QUESTS, claimQuest, questPoints, questStatus,
} from "@/lib/quests";

type Variant = "card" | "full";

export function BeginnerQuests({ variant = "card" }: { variant?: Variant }) {
  const { user, profile } = useAuth();
  const { ids: claimedIds } = useXpEvents(user?.uid);
  const [pending, setPending] = useState<string | null>(null);

  const rows = useMemo(
    () => BEGINNER_QUESTS.map((q) => ({ q, status: questStatus(q, profile, claimedIds) })),
    [profile, claimedIds],
  );

  const completed = rows.filter((r) => r.status.claimed).length;
  const total = rows.length;
  const totalXp = BEGINNER_QUESTS.reduce((s, q) => s + questPoints(q), 0);
  const allDone = completed === total;

  const handleClaim = async (questId: string) => {
    if (!user) return;
    const entry = rows.find((r) => r.q.id === questId);
    if (!entry || !entry.status.eligible || entry.status.claimed) return;
    setPending(questId);
    try {
      const res = await claimQuest(user.uid, entry.q);
      if (res) {
        toast.success(`Quest complete: ${entry.q.title}`, {
          description: `+${res.awarded} XP · Total: ${res.total}`,
        });
      }
    } catch (e) {
      toast.error("Could not claim quest", {
        description: e instanceof Error ? e.message : "Try again later.",
      });
    } finally {
      setPending(null);
    }
  };

  if (!user || !profile) return null;
  if (variant === "card" && allDone) return null;

  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="h-4 w-4 text-brand-cyan" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Beginner quests
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold">
            <span className="gradient-text">Get started on ARC XP</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            One-time quests · earn up to{" "}
            <span className="text-brand-cyan font-semibold">+{totalXp} XP</span>
          </p>
        </div>
        <div className="glass-strong rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs shrink-0">
          <Trophy className="h-3.5 w-3.5 text-brand-cyan" />
          {completed}/{total}
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span>{Math.round((completed / total) * 100)}%</span>
        </div>
        <Progress value={(completed / total) * 100} className="h-1.5 bg-white/5" />
      </div>

      <div className="space-y-2.5">
        {rows.map(({ q, status }) => {
          const isPending = pending === q.id;
          const pts = questPoints(q);
          return (
            <div
              key={q.id}
              className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                status.claimed
                  ? "bg-brand-cyan/[0.06] border-brand-cyan/20"
                  : status.eligible
                  ? "border-brand-cyan/30 bg-brand-cyan/[0.03]"
                  : "border-white/5 hover:bg-white/[0.04] hover:border-white/10"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {status.claimed ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-cyan shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${status.claimed ? "text-muted-foreground" : ""}`}>
                    {q.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {q.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold gradient-text">+{pts}</span>
                {status.claimed ? (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg glass-strong text-brand-cyan ring-1 ring-brand-cyan/40">
                    Claimed
                  </span>
                ) : status.eligible ? (
                  <button
                    onClick={() => handleClaim(q.id)}
                    disabled={isPending}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg gradient-bg text-primary-foreground glow hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Claim"}
                  </button>
                ) : (
                  <Link
                    to={q.to}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1 transition"
                  >
                    {q.cta} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allDone && variant === "full" && (
        <div className="mt-5 glass-strong rounded-xl p-4 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-brand-cyan" />
          <div className="text-sm">
            <span className="font-semibold">All quests complete.</span>{" "}
            <span className="text-muted-foreground">
              Keep your streak alive and climb the leaderboard.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}