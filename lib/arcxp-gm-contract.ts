import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { ARC_TESTNET, ensureArcNetwork } from "./arcxp-contract";
import { getSelectedProvider } from "./wallet-providers";

export const ARCXP_GM_ADDRESS =
  (import.meta.env.VITE_ARCXP_GM_CONTRACT as string | undefined) ?? "";

export const ARCXP_GM_ABI = [
  "function sayGM() external",
  "function canGM(address) view returns (bool)",
  "function timeUntilNextGM(address) view returns (uint256)",
  "function lastGM(address) view returns (uint64)",
  "function streakOf(address) view returns (uint32)",
  "function totalGMsOf(address) view returns (uint32)",
  "function todayCount() view returns (uint256)",
  "function totalGMs() view returns (uint256)",
  "function uniqueWallets() view returns (uint256)",
  "event GM(address indexed wallet, uint64 timestamp, uint32 streak, uint32 totalForWallet, uint256 utcDay)",
];

export function hasGMContract() {
  return /^0x[0-9a-fA-F]{40}$/.test(ARCXP_GM_ADDRESS);
}

export function readGMContract() {
  const provider = new JsonRpcProvider(ARC_TESTNET.rpcUrl, ARC_TESTNET.chainIdDec);
  return new Contract(ARCXP_GM_ADDRESS, ARCXP_GM_ABI, provider);
}

export async function getWriteGMContract() {
  const eth = getSelectedProvider() as unknown as ConstructorParameters<typeof BrowserProvider>[0] | undefined;
  if (!eth) throw new Error("No wallet detected. Connect a wallet first.");
  await ensureArcNetwork();
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  return new Contract(ARCXP_GM_ADDRESS, ARCXP_GM_ABI, signer);
}