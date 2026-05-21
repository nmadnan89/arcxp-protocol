import { ARC_TESTNET } from "./arcxp-contract";

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
  isOkxWallet?: boolean;
};

export type WalletKind = "metamask" | "rabby" | "coinbase" | "okx" | "walletconnect" | "injected";

export type WalletOption = {
  id: string;
  kind: WalletKind;
  name: string;
  icon?: string;
  rdns?: string;
  installed: boolean;
  installUrl?: string;
  getProvider: () => Promise<Eip1193Provider>;
};

type Eip6963ProviderDetail = {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: Eip1193Provider;
};

const detected = new Map<string, Eip6963ProviderDetail>();
let listenerSetup = false;

function setupEip6963() {
  if (typeof window === "undefined") return;
  if (!listenerSetup) {
    listenerSetup = true;
    window.addEventListener("eip6963:announceProvider", (event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
      if (detail?.info?.rdns) detected.set(detail.info.rdns, detail);
    });
  }
  // Always re-request so wallets injected after first call still announce.
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

function matchByRdns(rdnsSubstring: string): Eip6963ProviderDetail | undefined {
  for (const [rdns, d] of detected) {
    if (rdns.toLowerCase().includes(rdnsSubstring)) return d;
  }
  return undefined;
}

function getWindowEth(): Eip1193Provider | undefined {
  return (typeof window !== "undefined" ? (window as unknown as { ethereum?: Eip1193Provider }).ethereum : undefined);
}

// Some wallets (Coinbase, MetaMask + others coexisting) expose a `providers[]`
// array on window.ethereum. Pick the one that matches a predicate.
function findInMulti(pred: (p: Eip1193Provider) => boolean): Eip1193Provider | undefined {
  const eth = getWindowEth() as (Eip1193Provider & { providers?: Eip1193Provider[] }) | undefined;
  if (eth?.providers && Array.isArray(eth.providers)) {
    const hit = eth.providers.find(pred);
    if (hit) return hit;
  }
  return eth && pred(eth) ? eth : undefined;
}

let selected: Eip1193Provider | null = null;
let selectedKind: WalletKind | null = null;

export function setSelectedProvider(p: Eip1193Provider, kind: WalletKind) {
  selected = p;
  selectedKind = kind;
  if (typeof window !== "undefined") {
    (window as unknown as { __arcxpProvider?: Eip1193Provider }).__arcxpProvider = p;
  }
}

export function getSelectedProvider(): Eip1193Provider | undefined {
  return selected ?? getWindowEth();
}

export function getSelectedKind(): WalletKind | null {
  return selectedKind;
}

async function getWalletConnectProvider(): Promise<Eip1193Provider> {
  const projectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? "";
  if (!projectId) {
    throw new Error(
      "WalletConnect is not configured. Add VITE_WALLETCONNECT_PROJECT_ID (free at cloud.walletconnect.com) to enable it.",
    );
  }
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const provider = await EthereumProvider.init({
    projectId,
    chains: [ARC_TESTNET.chainIdDec],
    showQrModal: true,
    metadata: {
      name: "ARC XP",
      description: "ARC XP Protocol",
      url: typeof window !== "undefined" ? window.location.origin : "https://arcxp.xyz",
      icons: [],
    },
    rpcMap: { [ARC_TESTNET.chainIdDec]: ARC_TESTNET.rpcUrl },
  });
  await provider.connect();
  return provider as unknown as Eip1193Provider;
}

export function listWallets(): WalletOption[] {
  setupEip6963();
  const eth = getWindowEth();

  const mmDetail = matchByRdns("metamask");
  const rabbyDetail = matchByRdns("rabby");
  const cbDetail = matchByRdns("coinbase");
  const okxDetail = matchByRdns("okx") ?? matchByRdns("okex");

  const okxWin = typeof window !== "undefined" ? (window as unknown as { okxwallet?: Eip1193Provider }).okxwallet : undefined;
  const cbWin = typeof window !== "undefined"
    ? (window as unknown as { coinbaseWalletExtension?: Eip1193Provider }).coinbaseWalletExtension
    : undefined;

  const mmMulti = findInMulti((p) => !!p.isMetaMask && !p.isRabby);
  const rabbyMulti = findInMulti((p) => !!p.isRabby);
  const cbMulti = findInMulti((p) => !!p.isCoinbaseWallet);
  const okxMulti = findInMulti((p) => !!p.isOkxWallet);

  const mmInstalled = !!mmDetail || !!mmMulti;
  const rabbyInstalled = !!rabbyDetail || !!rabbyMulti;
  const cbInstalled = !!cbDetail || !!cbWin || !!cbMulti;
  const okxInstalled = !!okxDetail || !!okxWin || !!okxMulti;

  return [
    {
      id: "metamask",
      kind: "metamask",
      name: "MetaMask",
      icon: mmDetail?.info.icon,
      installed: mmInstalled,
      installUrl: "https://metamask.io/download",
      getProvider: async () => {
        const p = mmDetail?.provider ?? mmMulti ?? (eth?.isMetaMask && !eth?.isRabby ? eth : undefined);
        if (!p) throw new Error("MetaMask not detected.");
        return p;
      },
    },
    {
      id: "rabby",
      kind: "rabby",
      name: "Rabby Wallet",
      icon: rabbyDetail?.info.icon,
      installed: rabbyInstalled,
      installUrl: "https://rabby.io",
      getProvider: async () => {
        const p = rabbyDetail?.provider ?? rabbyMulti ?? (eth?.isRabby ? eth : undefined);
        if (!p) throw new Error("Rabby Wallet not detected.");
        return p;
      },
    },
    {
      id: "coinbase",
      kind: "coinbase",
      name: "Coinbase Wallet",
      icon: cbDetail?.info.icon,
      installed: cbInstalled,
      installUrl: "https://www.coinbase.com/wallet/downloads",
      getProvider: async () => {
        const p = cbDetail?.provider ?? cbWin ?? cbMulti ?? (eth?.isCoinbaseWallet ? eth : undefined);
        if (!p) throw new Error("Coinbase Wallet not detected.");
        return p;
      },
    },
    {
      id: "okx",
      kind: "okx",
      name: "OKX Wallet",
      icon: okxDetail?.info.icon,
      installed: okxInstalled,
      installUrl: "https://www.okx.com/web3",
      getProvider: async () => {
        const p = okxDetail?.provider ?? okxWin ?? okxMulti ?? (eth?.isOkxWallet ? eth : undefined);
        if (!p) throw new Error("OKX Wallet not detected.");
        return p;
      },
    },
    {
      id: "walletconnect",
      kind: "walletconnect",
      name: "WalletConnect",
      installed: true,
      getProvider: getWalletConnectProvider,
    },
  ];
}

export async function ensureArcNetworkOn(provider: Eip1193Provider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET.chainIdHex }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4902 || code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC_TESTNET.chainIdHex,
            chainName: ARC_TESTNET.name,
            nativeCurrency: ARC_TESTNET.nativeCurrency,
            rpcUrls: [ARC_TESTNET.rpcUrl],
            blockExplorerUrls: [ARC_TESTNET.explorer],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}