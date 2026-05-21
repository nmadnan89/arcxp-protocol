import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Gem, Loader2, Sparkles, Wallet, CheckCircle2, AlertTriangle, Layers, Network, Hash, Coins } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { connectMetaMask, shortAddress } from "@/lib/wallet";
import nftArt from "@/assets/arcxp-nft.jpg";
import {
  ARC_TESTNET,
  ARCXP_ADDRESS,
  getWriteContract,
  hasContract,
  readContract,
} from "@/lib/arcxp-contract";

export const Route = createFileRoute("/_app/mint")({
  head: () => ({
    meta: [
      { title: "Mint ARCXP NFT — ARC XP" },
      { name: "description", content: "Mint the ARCXP (AXP) genesis NFT on ARC Testnet. Free mint, 3 per wallet, ERC-721." },
    ],
  }),
  component: MintPage,
});

const MAX_SUPPLY = 3000;
const MAX_PER_WALLET = 3;

type MintStatus = "idle" | "connecting" | "minting" | "success" | "error";

function MintPage() {
  const { user, profile } = useAuth();
  const address = profile?.walletAddress as string | undefined;

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<MintStatus>("idle");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [walletMinted, setWalletMinted] = useState(0);
  const [totalMinted, setTotalMinted] = useState(0);
  const onChain = hasContract();
  const [txHash, setTxHash] = useState<string | null>(null);

  // Counters. On-chain when VITE_ARCXP_CONTRACT is set, else local fallback.
  useEffect(() => {
    let cancel = false;
    async function load() {
      if (onChain) {
        try {
          const c = readContract();
          const total: bigint = await c.totalMinted();
          if (!cancel) setTotalMinted(Number(total));
          if (address) {
            const m: bigint = await c.mintedPerWallet(address);
            if (!cancel) setWalletMinted(Number(m));
          } else if (!cancel) setWalletMinted(0);
        } catch (e) {
          console.error("ARCXP read failed", e);
        }
        return;
      }
      if (!address) return;
      const localKey = `arcxp:minted:${address.toLowerCase()}`;
      const globalKey = "arcxp:minted:total";
      setWalletMinted(Number(localStorage.getItem(localKey) ?? "0"));
      setTotalMinted(Number(localStorage.getItem(globalKey) ?? "0"));
    }
    load();
    return () => { cancel = true; };
  }, [address, onChain]);

  const supplyPct = useMemo(
    () => Math.min(100, (totalMinted / MAX_SUPPLY) * 100),
    [totalMinted],
  );
  const walletPct = Math.min(100, (walletMinted / MAX_PER_WALLET) * 100);
  const limitReached = walletMinted >= MAX_PER_WALLET;
  const soldOut = totalMinted >= MAX_SUPPLY;

  const handleConnect = async () => {
    if (!user) return;
    setBusy(true);
    setStatus("connecting");
    setStatusMsg("Requesting MetaMask…");
    try {
      await connectMetaMask(user.uid);
      setStatus("idle");
      setStatusMsg("");
      toast.success("Wallet connected");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      setStatus("error");
      setStatusMsg(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleMint = async () => {
    if (!address || limitReached || soldOut) return;
    setBusy(true);
    setStatus("minting");
    setStatusMsg("Awaiting MetaMask confirmation…");
    try {
      if (onChain) {
        const c = await getWriteContract();
        const tx = await c.mint();
        setStatusMsg(`Submitted. Waiting for confirmation… ${tx.hash.slice(0, 10)}…`);
        setTxHash(tx.hash);
        await tx.wait();
        const r = readContract();
        const [total, walletM] = await Promise.all([
          r.totalMinted(),
          r.mintedPerWallet(address),
        ]);
        setTotalMinted(Number(total));
        setWalletMinted(Number(walletM));
        setStatus("success");
        setStatusMsg(`Mint confirmed on ARC Testnet.`);
        toast.success("Mint successful", { description: `Tx ${tx.hash.slice(0, 10)}…` });
      } else {
        // Fallback simulation until VITE_ARCXP_CONTRACT is set after deploy.
        await new Promise((r) => setTimeout(r, 1400));
        const next = walletMinted + 1;
        const nextTotal = totalMinted + 1;
        const localKey = `arcxp:minted:${address.toLowerCase()}`;
        localStorage.setItem(localKey, String(next));
        localStorage.setItem("arcxp:minted:total", String(nextTotal));
        setWalletMinted(next);
        setTotalMinted(nextTotal);
        setStatus("success");
        setStatusMsg(`Preview mint recorded (#${nextTotal}). Deploy the contract and set VITE_ARCXP_CONTRACT to enable real mints.`);
        toast.success("Preview mint", { description: `#${nextTotal}` });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Mint failed";
      setStatus("error");
      setStatusMsg(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong text-xs text-brand-cyan mb-3">
          <Sparkles className="h-3 w-3" /> Genesis Drop · ARC Testnet
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="gradient-text">ARCXP Genesis NFT</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Mint the ARCXP (AXP) genesis collectible — a permanent on-chain mark of
          the early ARC XP network. Free mint, gas paid by you, 3 per wallet.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Artwork */}
        <div className="glass rounded-3xl p-4 sm:p-5 relative overflow-hidden">
          <div aria-hidden className="absolute -inset-10 bg-gradient-to-br from-brand-purple/30 via-brand-blue/20 to-brand-cyan/30 blur-3xl -z-10" />
          <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10">
            <img
              src={nftArt}
              alt="ARCXP genesis NFT artwork"
              width={1024}
              height={1024}
              className="w-full h-auto object-cover"
            />
            <div className="absolute top-3 left-3 glass-strong rounded-full px-3 py-1 text-[10px] tracking-widest uppercase text-brand-cyan">
              AXP · #{String(totalMinted + 1).padStart(4, "0")}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
            <Meta icon={Layers} label="Standard" value="ERC-721" />
            <Meta icon={Network} label="Network" value="ARC Testnet" />
            <Meta icon={Hash} label="Symbol" value="AXP" />
            <Meta icon={Coins} label="Price" value="Free" />
          </div>
        </div>

        {/* Mint panel */}
        <div className="glass rounded-3xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Mint Details</h2>
            <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${
              soldOut ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300"
            }`}>
              {soldOut ? "Sold Out" : "Live"}
            </span>
          </div>

          {/* Supply progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Total minted</span>
              <span className="font-mono text-foreground">
                {totalMinted.toLocaleString()} / {MAX_SUPPLY.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full gradient-bg glow-sm transition-all"
                style={{ width: `${supplyPct}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {supplyPct.toFixed(2)}% of supply minted
            </div>
          </div>

          {/* Wallet status */}
          <div className="glass-strong rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="h-4 w-4" /> Wallet
              </div>
              <span className={`text-[10px] uppercase tracking-widest ${address ? "text-emerald-300" : "text-amber-300"}`}>
                {address ? "Connected" : "Not connected"}
              </span>
            </div>
            <div className="font-mono text-sm break-all">
              {address ? shortAddress(address) : "—"}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Per-wallet mint</span>
                <span className="font-mono text-foreground">
                  {walletMinted}/{MAX_PER_WALLET} minted
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-cyan to-brand-purple transition-all"
                  style={{ width: `${walletPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          {!address ? (
            <button
              onClick={handleConnect}
              disabled={busy || !user}
              className="w-full gradient-bg text-primary-foreground font-semibold px-5 py-3.5 rounded-xl glow hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              Connect MetaMask
            </button>
          ) : (
            <button
              onClick={handleMint}
              disabled={busy || limitReached || soldOut}
              className="w-full gradient-bg text-primary-foreground font-semibold px-5 py-3.5 rounded-xl glow hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Gem className="h-4 w-4" />
              )}
              {soldOut
                ? "Sold Out"
                : limitReached
                  ? "Limit reached (3/3)"
                  : `Mint 1 NFT (${walletMinted}/${MAX_PER_WALLET})`}
            </button>
          )}

          {/* Status */}
          {status !== "idle" && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
                status === "success"
                  ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20"
                  : status === "error"
                    ? "bg-red-500/10 text-red-200 border border-red-500/20"
                    : "bg-white/5 text-muted-foreground border border-white/10"
              }`}
            >
              {status === "success" ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : status === "error" ? (
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin" />
              )}
              <span className="break-words">
                {statusMsg}
                {txHash && (
                  <>
                    {" "}
                    <a
                      href={`${ARC_TESTNET.explorer}/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-brand-cyan"
                    >
                      View on ArcScan
                    </a>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Rules */}
          <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
            <Rule>Max supply: 3,000 AXP</Rule>
            <Rule>Max 3 per wallet · 1 NFT per transaction</Rule>
            <Rule>Free mint — you only pay ARC Testnet gas</Rule>
            <Rule>MetaMask only · ERC-721 standard</Rule>
            <Rule>
              {onChain ? (
                <>
                  Contract:{" "}
                  <a
                    className="underline text-brand-cyan"
                    href={`${ARC_TESTNET.explorer}/address/${ARCXP_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortAddress(ARCXP_ADDRESS)}
                  </a>{" "}
                  · Chain {ARC_TESTNET.chainIdDec}
                </>
              ) : (
                <>Contract not deployed yet — set <code>VITE_ARCXP_CONTRACT</code> after deploy.</>
              )}
            </Rule>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Layers; label: string; value: string }) {
  return (
    <div className="glass-strong rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-cyan shrink-0" />
      <span>{children}</span>
    </li>
  );
}