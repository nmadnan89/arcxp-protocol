import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { ensureArcNetworkOn, getSelectedProvider } from "./wallet-providers";

export const ARC_TESTNET = {
  chainIdDec: 5042002,
  chainIdHex: "0x" + (5042002).toString(16),
  name: "ARC Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorer: "https://testnet.arcscan.app",
  nativeCurrency: { name: "ARC", symbol: "ARC", decimals: 18 },
};

export const ARCXP_ADDRESS = (import.meta.env.VITE_ARCXP_CONTRACT as string | undefined) ?? "";

export const ARCXP_ABI = [
  "function mint() external",
  "function totalMinted() view returns (uint256)",
  "function remainingSupply() view returns (uint256)",
  "function remainingForWallet(address) view returns (uint256)",
  "function mintedPerWallet(address) view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function MAX_PER_WALLET() view returns (uint256)",
  "function mintActive() view returns (bool)",
  "event Minted(address indexed to, uint256 indexed tokenId)",
];

export function hasContract() {
  return /^0x[0-9a-fA-F]{40}$/.test(ARCXP_ADDRESS);
}

export function readProvider() {
  return new JsonRpcProvider(ARC_TESTNET.rpcUrl, ARC_TESTNET.chainIdDec);
}

export function readContract() {
  return new Contract(ARCXP_ADDRESS, ARCXP_ABI, readProvider());
}

export async function ensureArcNetwork() {
  const eth = getSelectedProvider();
  if (!eth) throw new Error("No wallet detected. Connect a wallet first.");
  await ensureArcNetworkOn(eth);
}

export async function getWriteContract() {
  const eth = getSelectedProvider() as unknown as ConstructorParameters<typeof BrowserProvider>[0] | undefined;
  if (!eth) throw new Error("No wallet detected. Connect a wallet first.");
  await ensureArcNetwork();
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  return new Contract(ARCXP_ADDRESS, ARCXP_ABI, signer);
}
