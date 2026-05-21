import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useXpEvents } from "@/lib/use-xp-events";
import { computeBadges } from "@/lib/badges";

export const Route = createFileRoute("/_app/badges")({
  head: () => ({ meta: [{ title: "Badges — ARC XP" }] }),
  component: Badges,
});

function Badges() {
  const { user, profile } = useAuth();
  const { ids } = useXpEvents(user?.uid);
  const all = computeBadges(profile, ids);
  const unlocked = all.filter((b) => b.unlocked);
  const locked = all.filter((b) => !b.unlocked);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="gradient-text">Badges</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {unlocked.length} unlocked · {locked.length} to go
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">Unlocked</h2>
        {unlocked.length === 0 ? (
          <div className="glass rounded-2xl p-6 sm:p-8 text-center text-sm text-muted-foreground">
            No badges yet — start earning XP to unlock your first badge.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {unlocked.map((b, i) => (
              <div
                key={b.id}
                className="glass rounded-2xl p-5 text-center hover:scale-105 transition animate-scale-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="h-16 w-16 mx-auto rounded-2xl gradient-bg flex items-center justify-center text-3xl mb-3 glow animate-pulse-glow">
                  {b.icon}
                </div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{b.desc}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">In Progress</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locked.map((b) => (
            <div key={b.id} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl grayscale opacity-50 relative">
                  {b.icon}
                  <Lock className="absolute h-4 w-4 -bottom-1 -right-1 bg-background rounded-full p-0.5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.desc}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="gradient-text font-semibold">{b.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
