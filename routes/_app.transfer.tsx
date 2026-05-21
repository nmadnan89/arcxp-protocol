import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Coins,
  Network,
  Hash,
  ArrowDownUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { shortAddress } from "@/lib/wallet";
import { ARC_TESTNET } from "@/lib/arcxp-contract";
import {
  USDC_ADDRESS,
  hasUsdc,
  readUsdc,
  getWriteUsdc,
  isAddress,
  getAddress,
  formatUnits,
  parseUnits,
  loadTransfers,
  saveTransfer,
  type TransferRecord,
} from "@/lib/arc-token";

export const Route = createFileRoute("/_app/transfer")({
  head: () => ({
    meta: [
      { title: "Transfer USDC — ARC XP" },
      {
        name: "description",
        content:
          "Send testnet USDC on ARC Network. Validate recipient, set amount, confirm in your wallet.",
      },
    ],
  }),
  component: TransferPage,
});

type TxStatus = "idle" | "preparing" | "pending" | "success" | "failed";

function TransferPage() {
  const { profile } = useAuth();
  const from = profile?.walletAddress as string | undefined;

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [decimals, setDecimals] = useState<number>(6);
  const [symbol, setSymbol] = useState<string>("USDC");
  const [balance, setBalance] = useState<bigint>(0n);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [status, setStatus] = useState<TxStatus>("idle");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [history, setHistory] = useState<TransferRecord[]>([]);

  const configured = hasUsdc();

  const refreshHistory = useCallback(() => {
    if (from) setHistory(loadTransfers(from));
  }, [from]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Load token metadata + balance
  useEffect(() => {
    if (!configured || !from) return;
    let cancel = false;
    (async () => {
      try {
        const c = readUsdc();
        const [d, s, b] = await Promise.all([
          c.decimals() as Promise<bigint>,
          c.symbol() as Promise<string>,
          c.balanceOf(from) as Promise<bigint>,
        ]);
        if (cancel) return;
        setDecimals(Number(d));
        setSymbol(s);
        setBalance(b);
      } catch (e) {
        console.error("USDC read failed", e);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [configured, from, txHash]);

  const recipientValid = useMemo(() => to.trim().length > 0 && isAddress(to.trim()), [to]);
  const selfSend = useMemo(
    () => from && recipientValid && to.trim().toLowerCase() === from.toLowerCase(),
    [to, from, recipientValid],
  );

  const amountWei = useMemo(() => {
    try {
      if (!amount || Number(amount) <= 0) return 0n;
      return parseUnits(amount, decimals);
    } catch {
      return 0n;
    }
  }, [amount, decimals]);

  const amountValid = amountWei > 0n && amountWei <= balance;
  const overBalance = amountWei > balance;

  const canSend =
    configured &&
    !!from &&
    recipientValid &&
    !selfSend &&
    amountValid &&
    status !== "preparing" &&
    status !== "pending";

  // Estimate gas as the user types a valid form
  useEffect(() => {
    if (!canSend) {
      setGasEstimate(null);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const { contract, provider } = await getWriteUsdc();
        const gas: bigint = await contract.transfer.estimateGas(getAddress(to.trim()), amountWei);
        const fee = await provider.getFeeData();
        const price = fee.gasPrice ?? fee.maxFeePerGas ?? 0n;
        const cost = gas * price;
        if (!cancel) setGasEstimate(`${Number(formatUnits(cost, 18)).toFixed(6)} ARC`);
      } catch {
        if (!cancel) setGasEstimate(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [canSend, to, amountWei]);

  const handleMax = () => {
    if (balance === 0n) return;
    setAmount(formatUnits(balance, decimals));
  };

  const reset = () => {
    setStatus("idle");
    setStatusMsg("");
    setTxHash(null);
    setAmount("");
    setTo("");
  };

  const handleSend = async () => {
    if (!from || !canSend) return;
    setStatus("preparing");
    setStatusMsg("Confirm the transaction in your wallet…");
    setTxHash(null);
    try {
      const { contract } = await getWriteUsdc();
      const tx = await contract.transfer(getAddress(to.trim()), amountWei);
      const hash = tx.hash as string;
      setTxHash(hash);
      setStatus("pending");
      setStatusMsg("Transaction submitted. Waiting for confirmation…");
      const rec: TransferRecord = {
        hash,
        from,
        to: to.trim(),
        amount,
        symbol,
        status: "pending",
        ts: Date.now(),
      };
      saveTransfer(from, rec);
      refreshHistory();

      const receipt = await tx.wait();
      const ok = receipt && receipt.status === 1;
      const finalRec: TransferRecord = { ...rec, status: ok ? "success" : "failed" };
      saveTransfer(from, finalRec);
      refreshHistory();
      if (ok) {
        setStatus("success");
        setStatusMsg(`Sent ${amount} ${symbol} to ${shortAddress(to.trim())}.`);
        toast.success("Transfer confirmed", {
          description: `${amount} ${symbol} → ${shortAddress(to.trim())}`,
        });
      } else {
        setStatus("failed");
        setStatusMsg("Transaction reverted on chain.");
        toast.error("Transfer failed");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transfer failed";
      setStatus("failed");
      setStatusMsg(msg);
      toast.error("Transfer failed", { description: msg });
    }
  };

  const copy = (text: string, label = "Copied") => {
    navigator.clipboard.writeText(text).then(() => toast.success(label));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center glow shrink-0">
          <Send className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Transfer</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Send testnet USDC on ARC Network. Direct wallet-to-wallet. Testnet only.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Send card */}
        <section className="glass rounded-2xl p-5 sm:p-6 lg:col-span-3 space-y-5">
          {!from && (
            <Banner
              icon={<Wallet className="h-4 w-4" />}
              tone="warn"
              title="Connect a wallet"
              desc="Link MetaMask, Rabby, or WalletConnect from your Profile to start transferring."
            />
          )}
          {from && !configured && (
            <Banner
              icon={<AlertTriangle className="h-4 w-4" />}
              tone="warn"
              title="USDC contract not configured"
              desc="Set VITE_ARC_USDC_CONTRACT to the ARC Testnet USDC address to enable transfers."
            />
          )}

          {/* Balance */}
          <div className="glass-strong rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full gradient-bg flex items-center justify-center shrink-0">
                <Coins className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Available balance
                </div>
                <div className="font-bold text-lg truncate">
                  {configured && from ? `${formatUnits(balance, decimals)} ${symbol}` : "—"}
                </div>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-brand-cyan inline-flex items-center gap-1.5">
              <Network className="h-3 w-3" /> ARC Testnet
            </span>
          </div>

          {/* Recipient */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Recipient address</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl glass-strong border border-white/10 bg-transparent text-sm font-mono outline-none focus:border-brand-cyan/60 transition"
            />
            <div className="mt-1.5 min-h-[1rem] text-[11px]">
              {to && !recipientValid && (
                <span className="text-red-400">Invalid wallet address.</span>
              )}
              {recipientValid && selfSend && (
                <span className="text-amber-400">You can&apos;t send to your own wallet.</span>
              )}
              {recipientValid && !selfSend && (
                <span className="text-emerald-400">Address looks valid.</span>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount</label>
            <div className="mt-1.5 flex items-stretch gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                inputMode="decimal"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl glass-strong border border-white/10 bg-transparent text-sm font-mono outline-none focus:border-brand-cyan/60 transition"
              />
              <button
                type="button"
                onClick={handleMax}
                disabled={balance === 0n}
                className="px-3 rounded-xl glass-strong border border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-white/[0.06] disabled:opacity-50"
              >
                Max
              </button>
              <div className="px-3 rounded-xl glass-strong border border-white/10 text-xs font-bold flex items-center">
                {symbol}
              </div>
            </div>
            <div className="mt-1.5 min-h-[1rem] text-[11px]">
              {amount && Number(amount) <= 0 && (
                <span className="text-red-400">Amount must be greater than zero.</span>
              )}
              {overBalance && <span className="text-red-400">Amount exceeds your balance.</span>}
            </div>
          </div>

          {/* Gas */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ArrowDownUp className="h-3.5 w-3.5" /> Estimated network fee
            </span>
            <span className="font-mono">{gasEstimate ?? "—"}</span>
          </div>

          {/* Status */}
          {status !== "idle" && (
            <StatusPanel
              status={status}
              message={statusMsg}
              txHash={txHash}
              onReset={reset}
            />
          )}

          {/* Send */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-bg text-primary-foreground font-semibold glow disabled:opacity-50 disabled:pointer-events-none transition"
          >
            {status === "preparing" || status === "pending" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {status === "preparing"
              ? "Awaiting wallet…"
              : status === "pending"
                ? "Confirming…"
                : "Send"}
          </button>

          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-[0.25em]">
            Testnet only · No real value
          </p>
        </section>

        {/* Dashboard */}
        <aside className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Your wallet
            </div>
            {from ? (
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono break-all flex-1">{from}</code>
                <button
                  onClick={() => copy(from, "Address copied")}
                  className="p-2 rounded-lg hover:bg-white/5"
                  aria-label="Copy address"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <a
                  href={`${ARC_TESTNET.explorer}/address/${from}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg hover:bg-white/5"
                  aria-label="Open in ArcScan"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No wallet linked.</p>
            )}
            {configured && (
              <div className="mt-3 pt-3 border-t border-white/5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Token{" "}
                <a
                  href={`${ARC_TESTNET.explorer}/address/${USDC_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-cyan normal-case tracking-normal inline-flex items-center gap-1"
                >
                  {shortAddress(USDC_ADDRESS)} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold inline-flex items-center gap-2">
                <Hash className="h-4 w-4 text-brand-cyan" /> Recent transfers
              </div>
              <span className="text-[10px] text-muted-foreground">{history.length}</span>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Your sent transactions will appear here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
                {history.map((h) => (
                  <li
                    key={h.hash}
                    className="glass-strong rounded-xl p-3 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">
                        {h.amount} {h.symbol}
                      </span>
                      <StatusPill status={h.status} />
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      → <span className="font-mono">{shortAddress(h.to)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(h.ts).toLocaleString()}
                      </span>
                      <a
                        href={`${ARC_TESTNET.explorer}/tx/${h.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-cyan inline-flex items-center gap-1 hover:underline"
                      >
                        ArcScan <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusPanel({
  status,
  message,
  txHash,
  onReset,
}: {
  status: TxStatus;
  message: string;
  txHash: string | null;
  onReset: () => void;
}) {
  const tone =
    status === "success"
      ? "border-emerald-400/30 bg-emerald-500/5"
      : status === "failed"
        ? "border-red-400/30 bg-red-500/5"
        : "border-brand-cyan/30 bg-brand-cyan/5";
  const Icon =
    status === "success"
      ? CheckCircle2
      : status === "failed"
        ? AlertTriangle
        : Loader2;
  return (
    <div className={`glass-strong rounded-xl p-3 border ${tone}`}>
      <div className="flex items-start gap-2.5">
        <Icon
          className={`h-4 w-4 mt-0.5 shrink-0 ${
            status === "success"
              ? "text-emerald-400"
              : status === "failed"
                ? "text-red-400"
                : "text-brand-cyan animate-spin"
          }`}
        />
        <div className="text-xs flex-1 min-w-0">
          <div className="font-semibold capitalize">{status}</div>
          {message && <div className="text-muted-foreground mt-0.5 break-words">{message}</div>}
          {txHash && (
            <a
              href={`${ARC_TESTNET.explorer}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-brand-cyan inline-flex items-center gap-1 mt-1 hover:underline"
            >
              View on ArcScan <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {(status === "success" || status === "failed") && (
            <button
              onClick={onReset}
              className="text-[11px] text-muted-foreground hover:text-foreground underline ml-3"
            >
              New transfer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: TransferRecord["status"] }) {
  const cls =
    status === "success"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "failed"
        ? "bg-red-500/15 text-red-300"
        : "bg-brand-cyan/15 text-brand-cyan";
  return (
    <span
      className={`text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full font-bold ${cls}`}
    >
      {status}
    </span>
  );
}

function Banner({
  icon,
  title,
  desc,
  tone = "warn",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone?: "warn" | "info";
}) {
  const cls =
    tone === "warn"
      ? "border-amber-400/30 bg-amber-500/5 text-amber-200"
      : "border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan";
  return (
    <div className={`glass-strong rounded-xl p-3 border ${cls} flex items-start gap-2.5`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="text-xs">
        <div className="font-semibold">{title}</div>
        <div className="text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  );
}