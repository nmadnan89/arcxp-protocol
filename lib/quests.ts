import { XP_ACTIONS, awardXp, type XpAction } from "./xp";
import { loadTransfers } from "./arc-token";

export type BeginnerQuestId =
  | "connect_wallet"
  | "first_gm"
  | "first_mint"
  | "first_transfer"
  | "first_referral";

export type BeginnerQuest = {
  id: BeginnerQuestId;
  action: Extract<
    XpAction,
    | "quest_connect_wallet"
    | "quest_first_gm"
    | "quest_first_mint"
    | "quest_first_transfer"
    | "quest_first_referral"
  >;
  title: string;
  description: string;
  to: "/profile" | "/" | "/mint" | "/transfer";
  cta: string;
};

export const BEGINNER_QUESTS: BeginnerQuest[] = [
  {
    id: "connect_wallet",
    action: "quest_connect_wallet",
    title: "Connect your wallet",
    description: "Link MetaMask, Rabby, Coinbase, OKX, or WalletConnect to ARC XP.",
    to: "/profile",
    cta: "Open profile",
  },
  {
    id: "first_gm",
    action: "quest_first_gm",
    title: "Drop your first GM",
    description: "Claim a GM on the dashboard to start your daily streak.",
    to: "/",
    cta: "Say GM",
  },
  {
    id: "first_mint",
    action: "quest_first_mint",
    title: "Mint your first NFT",
    description: "Mint your ARC XP identity NFT to prove your on-chain presence.",
    to: "/mint",
    cta: "Open mint",
  },
  {
    id: "first_transfer",
    action: "quest_first_transfer",
    title: "Send your first transfer",
    description: "Send any amount of testnet USDC to another wallet on ARC.",
    to: "/transfer",
    cta: "Open transfer",
  },
  {
    id: "first_referral",
    action: "quest_first_referral",
    title: "Invite a friend",
    description: "Get one friend to sign up with your referral link and activate.",
    to: "/",
    cta: "Share link",
  },
];

export const questPoints = (q: BeginnerQuest) => XP_ACTIONS[q.action];

/** Lifetime dedupe key — beginner quests are one-time. */
export const questEventId = (q: BeginnerQuest) => `${q.action}__lifetime`;

function mintedCount(walletAddress: string | null | undefined): number {
  if (!walletAddress || typeof window === "undefined") return 0;
  const key = `arcxp:minted:${walletAddress.toLowerCase()}`;
  return Number(localStorage.getItem(key) ?? "0");
}

function transferCount(walletAddress: string | null | undefined): number {
  if (!walletAddress || typeof window === "undefined") return 0;
  try {
    return loadTransfers(walletAddress).filter((t) => t.status !== "failed").length;
  } catch {
    return 0;
  }
}

export type QuestStatus = {
  /** Quest criteria has been met (eligible to claim). */
  eligible: boolean;
  /** XP for this quest has already been awarded. */
  claimed: boolean;
};

export function questStatus(
  q: BeginnerQuest,
  profile: {
    walletAddress?: string | null;
    lastGMClaim?: unknown;
    referralCount?: number;
  } | null | undefined,
  claimedIds: Set<string>,
): QuestStatus {
  const claimed = claimedIds.has(questEventId(q));
  let eligible = false;
  switch (q.id) {
    case "connect_wallet":
      eligible = !!profile?.walletAddress;
      break;
    case "first_gm":
      eligible = !!profile?.lastGMClaim;
      break;
    case "first_mint":
      eligible = mintedCount(profile?.walletAddress) > 0;
      break;
    case "first_transfer":
      eligible = transferCount(profile?.walletAddress) > 0;
      break;
    case "first_referral":
      eligible = (profile?.referralCount ?? 0) >= 1;
      break;
  }
  return { eligible, claimed };
}

export async function claimQuest(uid: string, q: BeginnerQuest) {
  return awardXp(uid, q.action, "lifetime");
}