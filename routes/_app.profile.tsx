import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Trophy, Flame, Wallet, CheckCircle2, Copy, Check, Award, Users, Share2, Link2, Gem, Sun, Network, ExternalLink, Activity as ActivityIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useAuth } from "@/lib/auth-context";
import { shortAddress } from "@/lib/wallet";
import { useLeaderboard } from "@/lib/use-leaderboard";
import { useXpEvents } from "@/lib/use-xp-events";
import { useActivity, actionLabel, timeAgo } from "@/lib/use-activity";
import { computeBadges } from "@/lib/badges";
import { useReferralStats, referralLinkFor } from "@/lib/referrals";
import { ARC_TESTNET, hasContract, readContract } from "@/lib/arcxp-contract";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — ARC XP" }] }),
  component: Profile,
});

function avatarFor(name: string, photo?: string) {
  if (photo) return photo;
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name)}&backgroundColor=8b5cf6,3b82f6`;
}

function fmtJoined(joinedAt: unknown): string {
  const d =
    joinedAt && typeof (joinedAt as { toDate?: () => Date }).toDate === "function"
      ? (joinedAt as { toDate: () => Date }).toDate()
      : null;
  return d ? d.toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";
}

function Profile() {
  const { user, profile } = useAuth();
  const wallet = profile?.walletAddress ?? null;
  const username = profile?.name ?? profile?.username ?? user?.displayName ?? "Explorer";
  const handle = profile?.email ? `@${profile.email.split("@")[0]}` : "";
  const { rows } = useLeaderboard(100);
  const myRank = user ? rows.findIndex((r) => r.uid === user.uid) + 1 : 0;
  const { ids } = useXpEvents(user?.uid);
  const badges = computeBadges(profile ?? null, ids);
  const unlocked = badges.filter((b) => b.unlocked);
  // Pull a larger window for the 6-month histogram; feed shows only the latest few.
  const { rows: activity } = useActivity(user?.uid, 200);
  const feed = activity.slice(0, 6);
  const completedTasks = ids.size;
  const gmStreak = profile?.gmStreak ?? 0;
  const [copied, setCopied] = useState(false);
  const { code: referralCode, count: referralCount, invited: invitedList } = useReferralStats(user?.uid);
  const referralLink = referralCode ? referralLinkFor(referralCode) : "";
  const [copiedCode, setCopiedCode] = useState(false);

  // ---- On-chain stats ----
  const [nftMinted, setNftMinted] = useState<number | null>(null);
  useEffect(() => {
    let cancel = false;
    if (!wallet || !hasContract()) {
      setNftMinted(null);
      return;
    }
    (async () => {
      try {
        const c = readContract();
        const m: bigint = await c.mintedPerWallet(wallet);
        if (!cancel) setNftMinted(Number(m));
      } catch (e) {
        console.warn("nft mint count read failed", e);
        if (!cancel) setNftMinted(0);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [wallet]);

  // GM events derived from xpEvents (action === 'gm'). The doc id pattern is `gm__<ms>`.
  const gmEvents = useMemo(
    () =>
      activity
        .filter((a) => a.action === "gm")
        .map((a) => {
          const dt =
            a.createdAt && typeof a.createdAt.toDate === "function"
              ? a.createdAt.toDate()
              : null;
          return { id: a.id, date: dt };
        }),
    [activity],
  );
  const gmCount = gmEvents.length;

  // Last 14 days GM heatmap (oldest → newest)
  const gmDays = useMemo(() => {
    const set = new Set<string>();
    for (const g of gmEvents) {
      if (!g.date) continue;
      set.add(g.date.toISOString().slice(0, 10));
    }
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (13 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
        date: d,
        active: set.has(key),
      };
    });
  }, [gmEvents]);

  const onChain = hasContract();
  const walletProvider = (profile?.walletProvider as string | undefined) ?? null;

  const [copiedLink, setCopiedLink] = useState(false);

  const copyReferralCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success("Referral code copied");
      setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const shareReferral = async () => {
    if (!referralLink) return;
    const shareData = {
      title: "Join me on ARC XP",
      text: "Join ARC XP and earn +10 XP on signup with my referral code.",
      url: referralLink,
    };
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(shareData);
      } else {
        await copyReferralLink();
      }
    } catch {
      /* user dismissed */
    }
  };

  const copyWallet = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      toast.success("Wallet address copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  // Build last 6 months histogram from activity (best-effort with current data window)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString(undefined, { month: "short" }), points: 0 };
  });
  for (const a of activity) {
    const dt = a.createdAt && typeof a.createdAt.toDate === "function" ? a.createdAt.toDate() : null;
    if (!dt) continue;
    const k = `${dt.getFullYear()}-${dt.getMonth()}`;
    const m = months.find((x) => x.key === k);
    if (m) m.points += a.points ?? 0;
  }
  const max = Math.max(1, ...months.map((m) => m.points));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass rounded-2xl p-5 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
          <img
            src={avatarFor(username, profile?.photoURL ?? user?.photoURL ?? undefined)}
            alt={username}
            className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl ring-2 ring-white/20 glow"
          />
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold break-words">
              <span className="gradient-text">{username}</span>
            </h1>
            <p className="text-muted-foreground mt-1 break-all">{handle}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {profile?.joinedAt ? (
                <span className="inline-flex items-center gap-1.5 text-xs glass-strong px-3 py-1 rounded-full">
                  <Calendar className="h-3.5 w-3.5 text-brand-cyan" />
                  Joined {fmtJoined(profile.joinedAt)}
                </span>
              ) : null}
              {myRank > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs glass-strong px-3 py-1 rounded-full">
                  <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                  Rank #{myRank}
                </span>
              )}
              {wallet && (
                <span className="inline-flex items-center gap-1.5 text-xs glass-strong px-3 py-1 rounded-full">
                  <Wallet className="h-3.5 w-3.5 text-brand-cyan" />
                  <span className="capitalize">{walletProvider ?? "Wallet"}</span>
                  <span className="font-mono opacity-70">· {shortAddress(wallet)}</span>
                </span>
              )}
              {wallet && (
                <span className="inline-flex items-center gap-1.5 text-xs glass-strong px-3 py-1 rounded-full">
                  <Network className="h-3.5 w-3.5 text-emerald-300" />
                  {ARC_TESTNET.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <WalletConnectButton />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <div className="h-11 w-11 rounded-xl glass-strong flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 text-brand-cyan" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">Wallet</div>
            <div className="text-xs text-muted-foreground font-mono break-all sm:hidden">
              {wallet ? shortAddress(wallet) : "No wallet linked"}
            </div>
            <div className="text-xs text-muted-foreground font-mono break-all hidden sm:block">
              {wallet ? wallet : "No wallet linked"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {wallet && (
            <button
              onClick={copyWallet}
              className="text-xs font-semibold px-3 py-1.5 rounded-full glass-strong hover:bg-white/[0.08] transition inline-flex items-center gap-1.5"
              title="Copy address"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {shortAddress(wallet)}
            </button>
          )}
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              wallet
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                : "glass-strong text-muted-foreground"
            }`}
          >
            {wallet ? "Connected" : "Not Connected"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: "Total XP", value: (profile?.points ?? 0).toLocaleString(), icon: Trophy },
          { label: "Rank", value: myRank > 0 ? `#${myRank}` : "—", icon: Trophy },
          { label: "GM Streak", value: `${gmStreak}d`, icon: Flame },
          {
            label: "NFTs Minted",
            value: wallet ? (nftMinted === null ? "—" : String(nftMinted)) : "—",
            icon: Gem,
          },
          { label: "Badges", value: unlocked.length, icon: Award },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <s.icon className="h-5 w-5 text-brand-cyan mb-2" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* On-chain activity */}
      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-xl gradient-bg flex items-center justify-center glow shrink-0">
              <ActivityIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight">On-chain Activity</h2>
              <p className="text-xs text-muted-foreground">
                {wallet ? `Live data from ${ARC_TESTNET.name}` : "Connect a wallet to see on-chain stats"}
              </p>
            </div>
          </div>
          {wallet && (
            <a
              href={`${ARC_TESTNET.explorer}/address/${wallet}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-full glass-strong hover:bg-white/[0.08] transition inline-flex items-center gap-1.5"
            >
              ArcScan <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <OnChainTile
            icon={Gem}
            label="NFTs Minted"
            value={wallet && onChain ? (nftMinted === null ? "…" : String(nftMinted)) : "—"}
            sub={onChain ? "ARCXP · ERC-721" : "Contract not set"}
          />
          <OnChainTile
            icon={Sun}
            label="GM Check-ins"
            value={gmCount.toString()}
            sub={gmStreak > 0 ? `${gmStreak}-day streak` : "Start a streak"}
          />
          <OnChainTile
            icon={Wallet}
            label="Wallet"
            value={walletProvider ? walletProvider : wallet ? "Linked" : "—"}
            sub={wallet ? shortAddress(wallet) : "Not connected"}
            mono
          />
          <OnChainTile
            icon={Network}
            label="Network"
            value={ARC_TESTNET.name}
            sub={`Chain ${ARC_TESTNET.chainIdDec}`}
          />
        </div>

        {/* GM streak last 14 days */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" /> GM Streak History
            </h3>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Last 14 days</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {gmDays.map((d) => (
              <div
                key={d.key}
                title={`${d.date.toLocaleDateString()} ${d.active ? "· GM ✓" : ""}`}
                className={`aspect-square rounded-md border transition ${
                  d.active
                    ? "bg-gradient-to-br from-amber-400 to-rose-400 border-transparent glow-sm"
                    : "bg-white/[0.03] border-white/5"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-1">Contribution History</h2>
          <p className="text-xs text-muted-foreground mb-6">Points earned over the last 6 months</p>
          <div className="flex items-end justify-between gap-2 h-48">
            {months.map((c, i) => (
              <div key={c.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0">
                <div className="text-[10px] sm:text-xs text-muted-foreground">{c.points}</div>
                <div
                  className="w-full rounded-t-lg gradient-bg glow-sm animate-scale-in"
                  style={{ height: `calc(${(c.points / max) * 100}% - 36px)`, minHeight: "20px", animationDelay: `${i * 80}ms` }}
                />
                <div className="text-[10px] sm:text-xs text-muted-foreground">{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Activity Feed</h2>
          {feed.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity yet — claim a task to get started.</div>
          ) : (
            <div className="space-y-4">
              {feed.map((a) => {
                const dt = a.createdAt && typeof a.createdAt.toDate === "function" ? a.createdAt.toDate() : null;
                return (
                  <div key={a.id} className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0">
                    <div className="h-9 w-9 rounded-xl glass-strong flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-brand-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{actionLabel(a.action)}</div>
                      <div className="text-xs text-muted-foreground truncate">{dt ? timeAgo(dt) : ""}</div>
                    </div>
                    <div className="text-sm font-semibold gradient-text">+{a.points}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Badge Showcase</h2>
        {unlocked.length === 0 ? (
          <p className="text-sm text-muted-foreground">No badges unlocked yet.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {unlocked.slice(0, 6).map((b) => (
              <div key={b.id} className="text-center">
                <div className="h-14 w-14 mx-auto rounded-xl gradient-bg flex items-center justify-center text-2xl glow">{b.icon}</div>
                <div className="text-xs mt-2 truncate">{b.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-xl gradient-bg flex items-center justify-center glow shrink-0">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">Referrals</h2>
                <p className="text-xs text-muted-foreground">Your friend gets +10 XP on signup. You get +25 XP once they activate (earn 25 XP, link a wallet, or hit a 2-day streak).</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold gradient-text leading-none">{referralCount}</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">Invited</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="glass-strong rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Your code</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-lg font-bold tracking-widest gradient-text truncate">
                  {referralCode || "—"}
                </code>
                <button
                  onClick={copyReferralCode}
                  disabled={!referralCode}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full glass-strong hover:bg-white/[0.08] transition inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCode ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className="glass-strong rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Referral link</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-xs font-mono text-muted-foreground truncate" title={referralLink}>
                  {referralLink || "—"}
                </div>
                <button
                  onClick={copyReferralLink}
                  disabled={!referralLink}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full glass-strong hover:bg-white/[0.08] transition inline-flex items-center gap-1.5 disabled:opacity-50"
                  title="Copy link"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
                  {copiedLink ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={shareReferral}
                  disabled={!referralLink}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full gradient-bg text-primary-foreground glow hover:opacity-90 transition inline-flex items-center gap-1.5 disabled:opacity-50"
                  title="Share"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold text-muted-foreground mb-3">Recent invites</div>
            {invitedList.length === 0 ? (
              <div className="text-sm text-muted-foreground">No referrals yet — share your code to start earning.</div>
            ) : (
              <div className="space-y-2">
                {invitedList.slice(0, 5).map((inv) => {
                  const dt = inv.createdAt && typeof inv.createdAt.toDate === "function" ? inv.createdAt.toDate() : null;
                  return (
                    <div key={inv.uid} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg glass-strong">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-full gradient-bg flex items-center justify-center text-[10px] font-bold">
                          {inv.uid.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-xs font-mono truncate text-muted-foreground">
                          {inv.uid.slice(0, 6)}…{inv.uid.slice(-4)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {dt && <span className="text-[10px] text-muted-foreground">{dt.toLocaleDateString()}</span>}
                        <span className="text-xs font-semibold gradient-text">+10 XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OnChainTile({
  icon: Icon,
  label,
  value,
  sub,
  mono,
}: {
  icon: typeof Gem;
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="glass-strong rounded-xl p-3 sm:p-4 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <Icon className="h-3 w-3 text-brand-cyan" /> {label}
      </div>
      <div className={`mt-1.5 text-base sm:text-lg font-bold truncate capitalize ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>}
    </div>
  );
}
