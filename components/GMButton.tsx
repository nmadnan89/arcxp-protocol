import { useEffect, useState } from "react";
import { Sun, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { claimGM, formatCountdown, nextGMTime } from "@/lib/gm";
import {
  hasGMContract,
  getWriteGMContract,
  ARCXP_GM_ADDRESS,
} from "@/lib/arcxp-gm-contract";
import { ARC_TESTNET } from "@/lib/arcxp-contract";

export function GMButton() {
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const next = nextGMTime(profile?.lastGMClaim);
  const onCooldown = next !== null && next > now;
  const remaining = onCooldown ? next! - now : 0;
  const streak = (profile?.gmStreak as number | undefined) ?? 0;

  const onClaim = async () => {
    if (!user || onCooldown) return;
    setBusy(true);
    setErr(null);
    setTxHash(null);
    try {
      // Real on-chain GM when the contract is configured. Firestore stays as the
      // XP/streak ledger and runs only AFTER the tx succeeds.
      if (hasGMContract()) {
        if (!profile?.walletAddress) {
          throw new Error("Connect your MetaMask wallet first.");
        }
        const contract = await getWriteGMContract();
        const tx = await contract.sayGM();
        setTxHash(tx.hash);
        toast.loading("Confirming GM on ARC Testnet…", { id: "gm-tx" });
        const receipt = await tx.wait();
        toast.dismiss("gm-tx");
        if (!receipt || receipt.status !== 1) throw new Error("Transaction failed");
      }
      const res = await claimGM(user.uid);
      if (res.ok) {
        toast.success("GM claimed!", {
          description:
            `+${res.awarded} XP · Streak: ${res.streak} days` +
            (txHash ? ` · tx ${txHash.slice(0, 10)}…` : ""),
        });
      }
    } catch (e) {
      toast.dismiss("gm-tx");
      const msg = e instanceof Error ? e.message : "Claim failed";
      setErr(msg);
      toast.error("GM failed", { description: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 overflow-hidden relative">
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-yellow-400/90">
          <Sun className="h-3.5 w-3.5" /> Daily GM
        </div>
        <div className="font-semibold mt-1">Say GM, earn +2 XP</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Streak: <span className="text-foreground font-medium">{streak}</span>
          {onCooldown && (
            <> · Next in <span className="font-mono text-brand-cyan">{formatCountdown(remaining)}</span></>
          )}
        </div>
        {err && <div className="text-xs text-red-400 mt-1">{err}</div>}
        {txHash && (
          <div className="text-xs text-muted-foreground mt-1">
            tx:{" "}
            <a
              href={`${ARC_TESTNET.explorer}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-brand-cyan hover:underline font-mono"
            >
              {txHash.slice(0, 10)}…{txHash.slice(-6)}
            </a>
          </div>
        )}
      </div>
      <button
        onClick={onClaim}
        disabled={!user || onCooldown || busy}
        className={`shrink-0 font-semibold px-4 sm:px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 w-full sm:w-auto ${
          onCooldown
            ? "glass-strong text-muted-foreground cursor-not-allowed"
            : "gradient-bg text-primary-foreground glow hover:opacity-90"
        }`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sun className="h-4 w-4" />}
        {busy ? "Confirming…" : onCooldown ? "Claimed" : hasGMContract() ? "GM (on-chain)" : "GM"}
      </button>
    </div>
  );
}

// Contract address resolved at module load (helps debugging)
void ARCXP_GM_ADDRESS;
