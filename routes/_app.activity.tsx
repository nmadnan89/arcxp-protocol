import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useActivity, actionLabel, timeAgo } from "@/lib/use-activity";
import { XP_ACTIONS, type XpAction } from "@/lib/xp";
import {
  Sun,
  LogIn,
  BookOpen,
  Play,
  MessageSquare,
  CheckCircle2,
  CalendarCheck,
  FileText,
  Mic,
  History,
  Loader2,
  Zap,
  Rocket,
  Wallet,
  Gem,
  Send,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({ meta: [{ title: "Activity History — ARC XP" }] }),
  component: ActivityPage,
});

const ACTION_META: Record<
  XpAction,
  { icon: React.ElementType; color: string; bg: string }
> = {
  gm: { icon: Sun, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  daily_login: { icon: LogIn, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  read_content: { icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  watch_video: { icon: Play, color: "text-rose-400", bg: "bg-rose-400/10" },
  publish_post: { icon: MessageSquare, color: "text-brand-purple", bg: "bg-brand-purple/10" },
  accepted_answer: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
  event_participation: { icon: CalendarCheck, color: "text-orange-400", bg: "bg-orange-400/10" },
  author_article: { icon: FileText, color: "text-sky-400", bg: "bg-sky-400/10" },
  video_speaker: { icon: Mic, color: "text-pink-400", bg: "bg-pink-400/10" },
  quest_connect_wallet: { icon: Wallet, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  quest_first_gm: { icon: Rocket, color: "text-amber-400", bg: "bg-amber-400/10" },
  quest_first_mint: { icon: Gem, color: "text-brand-purple", bg: "bg-brand-purple/10" },
  quest_first_transfer: { icon: Send, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  quest_first_referral: { icon: Users, color: "text-pink-400", bg: "bg-pink-400/10" },
};

function formatDateHeader(date: Date): string {
  const now = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, now)) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function ActivityPage() {
  const { user } = useAuth();
  const { rows, loading } = useActivity(user?.uid, 100);

  // Group rows by date
  const groups: { header: string; items: typeof rows }[] = [];
  rows.forEach((row) => {
    const dt = row.createdAt && typeof row.createdAt.toDate === "function" ? row.createdAt.toDate() : null;
    const header = dt ? formatDateHeader(dt) : "Earlier";
    const last = groups[groups.length - 1];
    if (last && last.header === header) {
      last.items.push(row);
    } else {
      groups.push({ header, items: [row] });
    }
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden glass rounded-2xl sm:rounded-3xl p-6 sm:p-10">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-purple/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-brand-blue/25 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl gradient-bg flex items-center justify-center glow">
            <History className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              <span className="gradient-text">Activity History</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time log of every XP action you have completed.
            </p>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="glass rounded-2xl p-5 sm:p-7">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No activity yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Complete tasks on the dashboard to start earning XP.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.header}>
                <div className="sticky top-0 z-10 mb-3">
                  <span className="inline-block text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground glass-strong px-3 py-1 rounded-full">
                    {group.header}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map((row) => {
                    const meta = ACTION_META[row.action] ?? ACTION_META.daily_login;
                    const Icon = meta.icon;
                    const dt = row.createdAt && typeof row.createdAt.toDate === "function" ? row.createdAt.toDate() : null;
                    return (
                      <div
                        key={row.id}
                        className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
                      >
                        <div className={`shrink-0 h-10 w-10 rounded-lg ${meta.bg} flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${meta.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{actionLabel(row.action)}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {dt ? timeAgo(dt) : ""}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-bold gradient-text">+{row.points}</div>
                          <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">XP</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
