import { useState } from "react";
import { toast } from "sonner";
import { Users, Copy, Check, Link2, Share2, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useReferralStats,
  referralLinkFor,
  REFERRAL_XP,
  REFERRER_BONUS_XP,
} from "@/lib/referrals";

export function ReferralCard({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { code, count, pending, activated } = useReferralStats(user?.uid);
  const link = code ? referralLinkFor(code) : "";
  // `count` is the user's authoritative on-profile activated tally; `activated`
  // is what we've observed in their referral list. Prefer the higher of the two
  // so the UI doesn't lag the profile doc.
  const activatedShown = Math.max(count, activated);
  const xpEarned = activatedShown * REFERRER_BONUS_XP;
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast.success("Referral code copied");
      setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };
  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };
  const share = async () => {
    if (!link) return;
    const payload = {
      title: "ARC XP",
      text: "Join ARC XP and earn +10 XP on signup with my referral code.",
      url: link,
    };
    try {
      if (navigator.share) await navigator.share(payload);
      else await copyLink();
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="relative overflow-hidden glass rounded-2xl p-6 sm:p-7">
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand-purple/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-brand-blue/25 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl gradient-bg flex items-center justify-center glow shrink-0">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">Invite & Earn</h2>
              <p className="text-xs text-muted-foreground">
                +{REFERRAL_XP} XP for your friend on signup · +{REFERRER_BONUS_XP} XP for you once they activate.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="glass-strong rounded-xl px-3 py-2 text-center" title="Friends who completed activation">
              <div className="text-lg font-bold leading-none inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                {activatedShown}
              </div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Activated</div>
            </div>
            <div className="glass-strong rounded-xl px-3 py-2 text-center" title="Signed up but not yet active">
              <div className="text-lg font-bold leading-none inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                {pending}
              </div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Pending</div>
            </div>
            <div className="glass-strong rounded-xl px-3 py-2 text-center">
              <div className="text-lg font-bold leading-none gradient-text inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
                {xpEarned}
              </div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">XP Earned</div>
            </div>
          </div>
        </div>

        <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
          <div className="glass-strong rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Your code</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-base sm:text-lg font-bold tracking-widest gradient-text truncate">
                {code || "—"}
              </code>
              <button
                onClick={copyCode}
                disabled={!code}
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
              <div className="flex-1 text-xs font-mono text-muted-foreground truncate" title={link}>
                {link || "—"}
              </div>
              <button
                onClick={copyLink}
                disabled={!link}
                className="text-xs font-semibold px-3 py-1.5 rounded-full glass-strong hover:bg-white/[0.08] transition inline-flex items-center gap-1.5 disabled:opacity-50"
                title="Copy link"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={share}
                disabled={!link}
                className="text-xs font-semibold px-3 py-1.5 rounded-full gradient-bg text-primary-foreground glow hover:opacity-90 transition inline-flex items-center gap-1.5 disabled:opacity-50"
                title="Share"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
          </div>
        </div>

        {!compact && (pending > 0 || activatedShown > 0) && (
          <div className="mt-4 text-xs text-muted-foreground">
            {pending > 0 ? (
              <>
                {pending} pending — rewards unlock once they earn {25} XP, link a wallet, or build a 2-day streak.
              </>
            ) : (
              <>All your referrals are activated. Nice work.</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}