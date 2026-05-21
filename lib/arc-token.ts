import { BrowserProvider, Contract, JsonRpcProvider, getAddress, isAddress, formatUnits, parseUnits } from "ethers";
import { ARC_TESTNET } from "./arcxp-contract";
import { ensureArcNetworkOn, getSelectedProvider } from "./wallet-providers";

// USDC on ARC Testnet — set VITE_ARC_USDC_CONTRACT in your env.
export const USDC_ADDRESS = (import.meta.env.VITE_ARC_USDC_CONTRACT as string | undefined) ?? "";

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export function hasUsdc() {
  return /^0x[0-9a-fA-F]{40}$/.test(USDC_ADDRESS);
}

export function readProvider() {
  return new JsonRpcProvider(ARC_TESTNET.rpcUrl, ARC_TESTNET.chainIdDec);
}

export function readUsdc() {
  return new Contract(USDC_ADDRESS, ERC20_ABI, readProvider());
}

export async function getWriteUsdc() {
  const eth = getSelectedProvider() as unknown as ConstructorParameters<typeof BrowserProvider>[0] | undefined;
  if (!eth) throw new Error("No wallet detected. Connect a wallet first.");
  await ensureArcNetworkOn(getSelectedProvider()!);
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  return { contract: new Contract(USDC_ADDRESS, ERC20_ABI, signer), provider, signer };
}

export { isAddress, getAddress, formatUnits, parseUnits };

// ---------- Transfer history (local, per wallet) ----------

export type TransferRecord = {
  hash: string;
  from: string;
  to: string;
  amount: string; // human-readable, e.g. "12.50"
  symbol: string;
  status: "pending" | "success" | "failed";
  ts: number;
};

function historyKey(address: string) {
  return `arcxp:transfers:${address.toLowerCase()}`;
}

export function loadTransfers(address: string): TransferRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(historyKey(address));
    return raw ? (JSON.parse(raw) as TransferRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveTransfer(address: string, rec: TransferRecord) {
  if (typeof window === "undefined") return;
  const list = loadTransfers(address);
  const idx = list.findIndex((r) => r.hash === rec.hash);
  if (idx >= 0) list[idx] = rec;
  else list.unshift(rec);
  localStorage.setItem(historyKey(address), JSON.stringify(list.slice(0, 50)));
}