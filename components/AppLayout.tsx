import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Trophy, Calendar, Award, User, Menu, X, LogOut, Loader2, Sparkles, History, Shield, Gem, Wallet, Send, Rocket, ChevronUp, Settings, FileText, HelpCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { lazy, memo, Suspense, useEffect, useMemo, useState } from "react";
import { ArcLogo } from "./ArcLogo";
import { useAuth } from "@/lib/auth-context";
import { useBadgeSync } from "@/lib/use-badge-sync";
import { useIsAdmin } from "@/lib/admin";
import type { WalletOption } from "@/lib/wallet-providers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Non-critical UI — defer to keep the initial bundle lean.
const OnboardingTour = lazy(() =>
  import("./OnboardingTour").then((m) => ({ default: m.OnboardingTour })),
);
const FeedbackWidget = lazy(() =>
  import("./FeedbackWidget").then((m) => ({ default: m.FeedbackWidget })),
);
const WalletSelectModal = lazy(() =>
  import("./WalletSelectModal").then((m) => ({ default: m.WalletSelectModal })),
);
const WalletPromptModal = lazy(() =>
  import("./WalletPromptModal").then((m) => ({ default: m.WalletPromptModal })),
);

const baseNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/activity", label: "Activity", icon: History },
  { to: "/earn-xp", label: "Earn XP", icon: Sparkles },
  { to: "/quests", label: "Quests", icon: Rocket },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/badges", label: "Badges", icon: Award },
  { to: "/mint", label: "Mint NFT", icon: Gem },
  { to: "/transfer", label: "Transfer", icon: Send },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const adminItem = { to: "/admin", label: "Admin", icon: Shield } as const;

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function AppLayout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { user, profile, loading, signInGoogle, signInWallet, logout } = useAuth();
  useBadgeSync();
  const { isAdmin } = useIsAdmin();
  const nav = useMemo(
    () => (isAdmin ? [...baseNav, adminItem] : baseNav),
    [isAdmin],
  );

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!user) {
    if (loading) {
      return (
        <BrandLoading />
      );
    }
    return <LoginScreen onSignIn={signInGoogle} onWallet={signInWallet} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Ambient gradient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-purple/30 blur-[120px] animate-orb" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-brand-blue/25 blur-[140px] animate-orb" style={{ animationDelay: "-5s" }} />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-brand-cyan/15 blur-[120px] animate-orb" style={{ animationDelay: "-10s" }} />
      </div>

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 p-4">
        <div className="glass rounded-2xl flex flex-col h-full p-5">
          <Brand />
          <nav className="mt-8 flex flex-col gap-1">
            {nav.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "gradient-bg text-primary-foreground glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/10 hover:translate-x-0.5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto glass-strong rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan" />
              </span>
              <span className="text-[10px] font-semibold gradient-text tracking-wider uppercase">ARC XP Mainnet</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="group w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 transition-all duration-200 active:scale-[0.98] outline-none focus-visible:ring-1 focus-visible:ring-brand-cyan/60">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-8 w-8 rounded-full ring-1 ring-white/20 shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold shrink-0">
                    {(profile?.username ?? "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-semibold truncate">{profile?.username}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{profile?.email}</div>
                </div>
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                sideOffset={8}
                className="w-56 glass border-white/10"
              >
                <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Account
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/activity" className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5" /> Activity
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/badges" className="flex items-center gap-2">
                    <Award className="h-3.5 w-3.5" /> Badges
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/admin" className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5" /> Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onSelect={() => logout()}
                  className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Topbar - mobile */}
      <header className="lg:hidden sticky top-3 z-40 glass mx-3 mt-3 rounded-2xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
        <Brand />
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="p-2.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all duration-200 -mr-1"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="lg:hidden fixed left-3 right-3 top-[72px] z-40 glass rounded-2xl p-3 flex flex-col gap-1 animate-scale-in max-h-[calc(100vh-88px)] overflow-y-auto">
            {nav.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                    active ? "gradient-bg text-primary-foreground glow-sm" : "hover:bg-white/10 hover:translate-x-0.5"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <div className="h-px bg-white/10 my-1.5" />
            <a
              href="/about"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-all duration-200 active:scale-[0.98] text-left text-muted-foreground"
            >
              <FileText className="h-4 w-4 shrink-0" /> About
            </a>
            <a
              href="/faq"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-all duration-200 active:scale-[0.98] text-left text-muted-foreground"
            >
              <HelpCircle className="h-4 w-4 shrink-0" /> FAQ
            </a>
            <a
              href="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-all duration-200 active:scale-[0.98] text-left text-muted-foreground"
            >
              <Mail className="h-4 w-4 shrink-0" /> Contact
            </a>
            <div className="h-px bg-white/10 my-1.5" />
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-all duration-200 active:scale-[0.98] text-left"
            >
              <LogOut className="h-4 w-4 shrink-0" /> Logout
            </button>
          </div>
        </>
      )}

      <main className="flex-1 lg:ml-64 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-10 relative">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="lg:ml-64 px-4 sm:px-6 lg:px-10 py-6 border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {footerLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <p className="text-[10px] text-muted-foreground/40 tracking-wider">
            &copy; {new Date().getFullYear()} ARC XP Protocol
          </p>
        </div>
      </footer>

      <Suspense fallback={null}>
        <OnboardingTour />
        <FeedbackWidget />
        <WalletPromptModal />
      </Suspense>
    </div>
  );
}

const Brand = memo(function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 group" aria-label="ARC XP">
      <div className="relative shrink-0">
        <ArcLogo size={34} className="relative z-10 transition-transform duration-500 group-hover:rotate-180" />
        <div className="absolute inset-0 bg-brand-purple/50 blur-xl rounded-full group-hover:bg-brand-cyan/40 transition-colors" />
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-lg tracking-[0.18em] gradient-text drop-shadow-[0_0_12px_rgba(167,139,250,0.45)]">
            ARC
          </span>
          <span className="h-3 w-px bg-gradient-to-b from-transparent via-brand-cyan to-transparent opacity-70" />
          <span className="font-light text-lg tracking-[0.32em] text-foreground/90">
            XP
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="h-px w-3 bg-gradient-to-r from-brand-purple to-brand-cyan" />
          <span className="text-[9px] text-muted-foreground tracking-[0.35em] uppercase font-medium">
            Protocol
          </span>
        </div>
      </div>
    </Link>
  );
});

function BrandLoading() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-purple/30 blur-[120px] animate-orb" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-brand-blue/25 blur-[140px] animate-orb" style={{ animationDelay: "-5s" }} />
      </div>
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <ArcLogo size={56} className="relative z-10 animate-pulse" />
          <div className="absolute inset-0 bg-brand-purple/60 blur-2xl rounded-full animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground tracking-[0.3em] uppercase">
          <Loader2 className="h-3 w-3 animate-spin text-brand-cyan" />
          Connecting to ARC
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onSignIn, onWallet }: { onSignIn: () => Promise<void>; onWallet: (w: WalletOption) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handle = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSignIn();
      toast.success("Welcome back!", { description: "You're signed in to ARC XP." });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };
  const handleWallet = async (w: WalletOption) => {
    await onWallet(w);
    toast.success("Wallet connected", { description: `Signed in with ${w.name} on ARC Testnet.` });
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-purple/30 blur-[120px] animate-orb" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-brand-blue/25 blur-[140px] animate-orb" style={{ animationDelay: "-5s" }} />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-brand-cyan/15 blur-[120px] animate-orb" style={{ animationDelay: "-10s" }} />
      </div>
      <div className="glass rounded-3xl p-6 sm:p-10 w-full max-w-md text-center relative">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <ArcLogo size={56} className="relative z-10" />
            <div className="absolute inset-0 bg-brand-purple/50 blur-2xl rounded-full" />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" /> ARC XP Protocol
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          <span className="gradient-text">Enter the Network</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Sign in to track your XP, badges, streaks, and ascend the ARC leaderboard.
        </p>
        <button
          onClick={handle}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl gradient-bg text-primary-foreground font-semibold glow hover:opacity-90 transition disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.5 5.6l6.2 5.2C40.9 35.6 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z"/>
            </svg>
          )}
          {busy ? "Connecting…" : "Continue with Google"}
        </button>
        <div className="flex items-center gap-3 my-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <button
          onClick={() => setWalletOpen(true)}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl glass-strong border border-white/10 hover:bg-white/[0.06] font-semibold transition disabled:opacity-60"
        >
          <Wallet className="h-4 w-4 text-brand-cyan" />
          Connect Wallet
        </button>
        <p className="text-[10px] text-muted-foreground mt-3">
          MetaMask · Rabby · Coinbase · OKX · WalletConnect — ARC Testnet (5042002)
        </p>
        {error && <p className="text-xs text-red-400 mt-4">{error}</p>}
        <p className="text-[10px] text-muted-foreground mt-6 uppercase tracking-[0.3em]">
          Secured by Firebase · Web3 Identity
        </p>
      </div>
      {walletOpen && (
        <Suspense fallback={null}>
          <WalletSelectModal open={walletOpen} onClose={() => setWalletOpen(false)} onSelect={handleWallet} />
        </Suspense>
      )}
    </div>
  );
}