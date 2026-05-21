import { useEffect, useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import {
  Sparkles, Sun, Wallet, Users, Trophy,
  ChevronRight, ChevronLeft, X, CheckCircle2, Circle, Rocket, Gem,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getFirebase } from "@/lib/firebase";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";

const LS_KEY = "arc:onboarding:done";

type Step = {
  icon: typeof Sparkles;
  title: string;
  body: string;
  accent: string;
};

const STEPS: Step[] = [
  {
    icon: Rocket,
    title: "Welcome to ARC XP",
    body: "ARC XP is your on-chain reputation layer. Complete actions, climb the leaderboard, unlock badges, and prove your presence in the ARC ecosystem.",
    accent: "from-brand-purple to-brand-blue",
  },
  {
    icon: Wallet,
    title: "Connect your wallet",
    body: "Link your wallet to unlock the Onchain badge, tag your activity on-chain, and access token-gated rewards. Supports MetaMask, Rabby, Coinbase, OKX, and WalletConnect.",
    accent: "from-brand-cyan to-emerald-400",
  },
  {
    icon: Sun,
    title: "Do your daily GM",
    body: "Drop a GM every 24 hours to earn XP and build your streak. Hit 7 days in a row to unlock the Consistent badge and boost your rank.",
    accent: "from-amber-500 to-brand-purple",
  },
  {
    icon: Gem,
    title: "Mint your NFT",
    body: "Head to the Mint page to create your on-chain ARC XP identity NFT. This proves your membership and unlocks exclusive perks.",
    accent: "from-brand-purple to-pink-500",
  },
  {
    icon: Sparkles,
    title: "Earn XP",
    body: "Visit the Earn XP page to complete daily and one-time quests. Every quest rewards verifiable XP that compounds toward badges and leaderboard rank.",
    accent: "from-brand-blue to-brand-cyan",
  },
  {
    icon: Users,
    title: "Invite friends",
    body: "Share your referral link from the dashboard. You and every new explorer who signs up both receive +10 XP — one reward per user, no abuse.",
    accent: "from-pink-500 to-brand-cyan",
  },
];

function hasMintedPreview(walletAddress: string | null | undefined): boolean {
  if (!walletAddress || typeof window === "undefined") return false;
  const key = `arcxp:minted:${(walletAddress as string).toLowerCase()}`;
  return Number(localStorage.getItem(key) ?? "0") > 0;
}

export function OnboardingTour() {
  const { user, profile, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const completed = useMemo(() => {
    if (!profile) return false;
    if ((profile as { onboardingCompleted?: boolean }).onboardingCompleted) return true;
    if (typeof window !== "undefined" && user) {
      return localStorage.getItem(`${LS_KEY}:${user.uid}`) === "1";
    }
    return false;
  }, [profile, user]);

  useEffect(() => {
    if (loading || !user || !profile) return;
    if (!completed) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [loading, user, profile, completed]);

  const persistDone = async () => {
    if (!user) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(`${LS_KEY}:${user.uid}`, "1");
    }
    try {
      const { db } = getFirebase();
      if (db) {
        await updateDoc(doc(db, "users", user.uid), { onboardingCompleted: true });
      }
    } catch {
      // localStorage fallback already set
    }
  };

  const finish = async () => {
    setOpen(false);
    await persistDone();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else void finish();
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  if (!user) return null;

  const S = STEPS[step];
  const Icon = S.icon;
  const pct = ((step + 1) / STEPS.length) * 100;

  const checks = [
    { label: "Connect your wallet", done: !!profile?.walletAddress },
    { label: "Do your daily GM", done: !!profile?.lastGMClaim },
    { label: "Mint an NFT", done: hasMintedPreview(profile?.walletAddress) },
    { label: "Earn XP", done: (profile?.points ?? 0) > 0 },
    { label: "Invite friends", done: false },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) void finish(); else setOpen(true); }}>
      <DialogContent className="glass border-white/10 max-w-lg p-0 overflow-hidden gap-0 [&>button]:hidden">
        <div className="relative p-6 sm:p-8">
          <button
            onClick={() => void finish()}
            className="absolute right-4 top-4 z-10 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
            aria-label="Skip onboarding"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Step {step + 1} / {STEPS.length}
            </span>
            <div className="flex-1">
              <Progress value={pct} className="h-1 bg-white/5" />
            </div>
          </div>

          <div className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br ${S.accent} glow mb-4`}>
            <Icon className="h-7 w-7 text-white" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-2">
            <span className="gradient-text">{S.title}</span>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{S.body}</p>

          {step === STEPS.length - 1 && (
            <div className="glass-strong rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-3.5 w-3.5 text-brand-cyan" />
                <span className="text-xs font-semibold uppercase tracking-wider">Your starter checklist</span>
              </div>
              <ul className="space-y-2">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-center gap-2.5 text-sm">
                    {c.done ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-cyan shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    )}
                    <span className={c.done ? "text-foreground" : "text-muted-foreground"}>
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => void finish()}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Skip
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 transition"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold gradient-bg text-primary-foreground glow hover:opacity-90 transition"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  to="/earn-xp"
                  onClick={() => void finish()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold gradient-bg text-primary-foreground glow hover:opacity-90 transition"
                >
                  Start earning <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OnboardingChecklistCard() {
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const done = useMemo(() => {
    if (!profile) return true;
    if ((profile as { onboardingCompleted?: boolean }).onboardingCompleted) return true;
    if (typeof window !== "undefined" && user) {
      return localStorage.getItem(`${LS_KEY}:${user.uid}`) === "1";
    }
    return false;
  }, [profile, user]);

  if (!user || !profile) return null;

  const checks = [
    { label: "Connect your wallet", done: !!profile.walletAddress, to: "/profile" as const },
    { label: "Do your daily GM", done: !!profile.lastGMClaim, to: "/" as const },
    { label: "Mint an NFT", done: hasMintedPreview(profile.walletAddress), to: "/mint" as const },
    { label: "Earn XP", done: (profile.points ?? 0) > 0, to: "/earn-xp" as const },
    { label: "Invite friends", done: false, to: "/" as const },
  ];
  const completedCount = checks.filter((c) => c.done).length;
  const allDone = completedCount === checks.length;

  if (dismissed || (done && allDone)) return null;

  return (
    <div className="glass rounded-2xl p-5 sm:p-6 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-brand-cyan" />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Getting started
        </span>
      </div>
      <h3 className="text-lg font-bold mb-3">
        <span className="gradient-text">Your first steps in ARC XP</span>
      </h3>
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{completedCount} of {checks.length} complete</span>
          <span>{Math.round((completedCount / checks.length) * 100)}%</span>
        </div>
        <Progress value={(completedCount / checks.length) * 100} className="h-1.5 bg-white/5" />
      </div>
      <ul className="grid sm:grid-cols-2 gap-2">
        {checks.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
          >
            {c.done ? (
              <CheckCircle2 className="h-4 w-4 text-brand-cyan shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/60 shrink-0" />
            )}
            <span className={c.done ? "text-foreground" : "text-muted-foreground"}>
              {c.label}
            </span>
          </Link>
        ))}
      </ul>
    </div>
  );
}
