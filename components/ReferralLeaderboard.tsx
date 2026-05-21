import { Crown, Share2, Loader2 } from "lucide-react";
import { useReferralLeaderboard, REFERRER_BONUS_XP } from "@/lib/referrals";
import { useAuth } from "@/lib/auth-context";

export function ReferralLeaderboard({ top = 10 }: { top?: number }) {
  const { rows, loading } = useReferralLeaderboard(top);
  const { user } = useAuth();

  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-wider text-muted-foreground">
        <Crown className="h-3.5 w-3.5 text-brand-cyan" />
        Top referrers
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground/80">
          <Share2 className="h-3 w-3" /> +{REFERRER_BONUS_XP} XP per activation
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin inline text-brand-cyan" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          No activated referrals yet. Be the first.
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {rows.map((r, i) => {
            const isMe = user?.uid === r.uid;
            const label = r.username ?? r.name ?? r.email ?? r.uid.slice(0, 8);
            const initial = (label[0] ?? "U").toUpperCase();
            return (
              <div
                key={r.uid}
                className={`flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 ${
                  isMe ? "px-2 -mx-2 rounded-lg bg-brand-cyan/5 ring-1 ring-brand-cyan/20" : ""
                }`}
              >
                <div
                  className={`w-6 text-center font-mono text-xs shrink-0 ${
                    i === 0
                      ? "text-amber-400"
                      : i === 1
                        ? "text-slate-300"
                        : i === 2
                          ? "text-orange-400"
                          : "text-muted-foreground"
                  }`}
                >
                  #{i + 1}
                </div>
                {r.photoURL ? (
                  <img
                    src={r.photoURL}
                    alt=""
                    className="h-8 w-8 rounded-full ring-1 ring-white/10 shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold shrink-0">
                    {initial}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {label}
                    {isMe && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-brand-cyan">
                        you
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-mono text-brand-cyan shrink-0">
                  {r.count} invite{r.count === 1 ? "" : "s"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}