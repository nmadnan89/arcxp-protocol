import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { Activity, Zap, Users, Wallet, Share2, Calendar } from "lucide-react";
import { getFirebase } from "@/lib/firebase";

type UserDoc = {
  points?: number;
  walletAddress?: string;
  lastLogin?: Timestamp;
  referralCount?: number;
};

type EventDoc = { going?: number };

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

export function EcosystemPulse() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }
    const unsubU = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsers(snap.docs.map((d) => d.data() as UserDoc));
        setLoading(false);
      },
      () => setLoading(false),
    );
    const unsubE = onSnapshot(
      collection(db, "events"),
      (snap) => setEvents(snap.docs.map((d) => d.data() as EventDoc)),
      () => {},
    );
    return () => {
      unsubU();
      unsubE();
    };
  }, []);

  const m = useMemo(() => {
    const now = Date.now();
    const dayMs = 86_400_000;
    const tsMs = (v: unknown) => {
      const t = v as Timestamp | undefined;
      return typeof t?.toMillis === "function" ? t.toMillis() : 0;
    };
    const totalUsers = users.length;
    const wallets = users.filter((u) => Boolean(u.walletAddress)).length;
    const dau = users.filter((u) => now - tsMs(u.lastLogin) < dayMs).length;
    const totalXp = users.reduce((a, u) => a + (u.points ?? 0), 0);
    const totalReferrals = users.reduce((a, u) => a + (u.referralCount ?? 0), 0);
    const eventRsvps = events.reduce((a, e) => a + (e.going ?? 0), 0);
    return { totalUsers, wallets, dau, totalXp, totalReferrals, eventRsvps };
  }, [users, events]);

  const stats = [
    { label: "Total Users", value: fmt(m.totalUsers), icon: Users },
    { label: "Wallets Linked", value: fmt(m.wallets), icon: Wallet },
    { label: "Active 24h", value: fmt(m.dau), icon: Activity },
    { label: "XP Distributed", value: fmt(m.totalXp), icon: Zap },
    { label: "Referrals", value: fmt(m.totalReferrals), icon: Share2 },
    { label: "Event Joins", value: fmt(m.eventRsvps), icon: Calendar },
  ];

  return (
    <div className="glass rounded-2xl p-6 sm:p-7 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      <div className="relative flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-cyan uppercase tracking-[0.2em] mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" />
            Ecosystem Pulse
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">The network is alive</h2>
          <p className="text-sm text-muted-foreground mt-1">Realtime activity across ARC XP.</p>
        </div>

        <div className="hidden sm:block relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="absolute inset-0">
            <defs>
              <linearGradient id="nodeGrad" x1="0" y1="0" x2="100" y2="100">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <line x1="50" y1="50" x2="15" y2="20" stroke="url(#nodeGrad)" strokeWidth="0.8" opacity="0.5" />
            <line x1="50" y1="50" x2="85" y2="20" stroke="url(#nodeGrad)" strokeWidth="0.8" opacity="0.5" />
            <line x1="50" y1="50" x2="15" y2="80" stroke="url(#nodeGrad)" strokeWidth="0.8" opacity="0.5" />
            <line x1="50" y1="50" x2="85" y2="80" stroke="url(#nodeGrad)" strokeWidth="0.8" opacity="0.5" />
            <line x1="50" y1="50" x2="50" y2="10" stroke="url(#nodeGrad)" strokeWidth="0.8" opacity="0.5" />
            <line x1="50" y1="50" x2="50" y2="90" stroke="url(#nodeGrad)" strokeWidth="0.8" opacity="0.5" />
            <circle cx="50" cy="50" r="6" fill="url(#nodeGrad)" />
            <circle cx="50" cy="50" r="10" fill="url(#nodeGrad)" opacity="0.2">
              <animate attributeName="r" from="6" to="14" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
            {[
              { cx: 15, cy: 20 }, { cx: 85, cy: 20 }, { cx: 15, cy: 80 },
              { cx: 85, cy: 80 }, { cx: 50, cy: 10 }, { cx: 50, cy: 90 },
            ].map((p, i) => (
              <circle key={i} cx={p.cx} cy={p.cy} r="2.5" fill="#38bdf8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </svg>
        </div>
      </div>

      <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="group glass-strong rounded-xl p-4 hover:-translate-y-0.5 transition-all animate-scale-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <s.icon className="h-4 w-4 text-brand-cyan" />
            </div>
            <div className="text-lg font-bold tracking-tight">{loading ? "—" : s.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
