import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCustomToken,
  signOut,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  type User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebase, googleProvider } from "./firebase";
import { awardDailyLogin } from "./xp";
import {
  applyReferralCode,
  attachWalletToReferral,
  capturePendingReferral,
  consumePendingReferral,
  ensureReferralCode,
  maybeActivateReferral,
} from "./referrals";
import { ensureArcNetwork } from "./arcxp-contract";
import { setSelectedProvider, type WalletOption } from "./wallet-providers";

export type UserProfile = {
  uid: string;
  name: string;
  username: string;
  email: string;
  photoURL?: string;
  points: number;
  streak: number;
  badges: string[];
  rank?: number;
  joinedAt?: unknown;
  lastLogin?: unknown;
  lastLoginDate?: string;
  walletAddress?: string | null;
  walletProvider?: string | null;
  walletConnectedAt?: unknown;
  lastGMClaim?: unknown;
  gmStreak?: number;
};

type AuthCtx = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signInWallet: (wallet: WalletOption) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  profile: null,
  loading: true,
  signInGoogle: async () => {},
  signInWallet: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Start `loading` false so SSR renders the LoginScreen (not a blank spinner).
  // On the client, the effect below flips it to true until onAuthStateChanged resolves.
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    capturePendingReferral();
    const { auth, db } = getFirebase();
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    // Best-effort persistence chain: localStorage → IndexedDB → in-memory.
    // Some mobile / privacy browsers block one or more of these.
    const persistenceReady = (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        try {
          await setPersistence(auth, indexedDBLocalPersistence);
        } catch {
          try { await setPersistence(auth, inMemoryPersistence); } catch { /* noop */ }
        }
      }
    })();

    // Resolve any pending Google redirect sign-in (mobile flow).
    void persistenceReady.then(() =>
      getRedirectResult(auth).catch((err) => {
        // Ignore "no redirect" / cancellation; log real failures.
        if (err && (err as { code?: string }).code && (err as { code?: string }).code !== "auth/no-auth-event") {
          console.warn("getRedirectResult failed", err);
        }
      })
    );

    let unsubProfile: (() => void) | null = null;
    let cancelled = false;

    const unsub = onAuthStateChanged(auth, async (u) => {
      unsubProfile?.();
      unsubProfile = null;
      if (cancelled) return;
      setUser(u);

      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", u.uid);
      const name = u.displayName ?? u.email?.split("@")[0] ?? "Explorer";

      // Subscribe to the profile FIRST so loading flips off as soon as data
      // arrives, independent of any slow write below.
      unsubProfile = onSnapshot(
        ref,
        (snap) => {
          if (cancelled) return;
          if (snap.exists()) setProfile(snap.data() as UserProfile);
          setLoading(false);
        },
        (err) => {
          console.warn("profile snapshot failed", err);
          if (!cancelled) setLoading(false);
        }
      );

      // Best-effort profile bootstrap. Wrap in try/catch so transient
      // Firestore errors don't strand the user on a spinner.
      let isNewUser = false;
      try {
        const existing = await getDoc(ref);
        isNewUser = !existing.exists();
        if (isNewUser) {
          await setDoc(ref, {
            uid: u.uid,
            name,
            username: name,
            email: u.email ?? "",
            photoURL: u.photoURL ?? "",
            points: 0,
            streak: 0,
            badges: [],
            rank: 0,
            joinedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
        } else {
          await updateDoc(ref, {
            name,
            email: u.email ?? "",
            photoURL: u.photoURL ?? "",
          });
        }
      } catch (err) {
        console.warn("profile bootstrap failed", err);
      }

      try { await ensureReferralCode(u.uid); } catch (err) { console.warn("ensureReferralCode failed", err); }

      const pending = consumePendingReferral();
      if (pending && isNewUser) {
        try { await applyReferralCode(u.uid, pending); } catch (err) { console.warn("applyReferralCode failed", err); }
      }

      try { await awardDailyLogin(u.uid); } catch (err) { console.warn("daily login award failed", err); }
    });

    return () => {
      cancelled = true;
      unsubProfile?.();
      unsub();
    };
  }, []);

  const signInGoogle = async () => {
    const { auth } = getFirebase();
    if (!auth) return;
    // Persistence may already be set by the bootstrap effect; re-asserting is cheap.
    try { await setPersistence(auth, browserLocalPersistence); } catch { /* fallback handled in effect */ }

    const isMobile = typeof navigator !== "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // Popups are unreliable on mobile (blockers, iOS Safari). Use redirect.
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      // User dismissed — surface nothing, don't fall back.
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }
      // Popup blocked or unsupported → fall back to redirect.
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  };

  const signInWallet = async (wallet: WalletOption) => {
    const { auth, db } = getFirebase();
    if (!auth || !db) throw new Error("Auth not ready");

    // Resolve the underlying EIP-1193 provider for the chosen wallet
    const provider = await wallet.getProvider();
    setSelectedProvider(provider, wallet.kind);

    // Ensure ARC Testnet
    await ensureArcNetwork();

    // Request accounts from this specific provider
    const accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[];
    const address = accounts?.[0]?.toLowerCase();
    if (!address) throw new Error("No account returned from wallet.");

    // --- SIWE: ask the wallet to sign a short message so the server can
    // prove ownership and mint a Firebase custom token bound to the wallet.
    const issuedAt = Date.now();
    const nonce = (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${issuedAt}-${Math.random().toString(36).slice(2)}`
    ).replace(/-/g, "");
    const message = [
      `arcxp wants you to sign in with your wallet.`,
      ``,
      `Address: ${address}`,
      `Issued At: ${new Date(issuedAt).toISOString()}`,
      `Nonce: ${nonce}`,
      ``,
      `Signing this message proves you own this wallet. No transaction is sent and no gas is spent.`,
    ].join("\n");

    const signature = (await provider.request({
      method: "personal_sign",
      params: [message, address],
    })) as string;

    const res = await fetch("/api/public/wallet-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, signature, issuedAt, nonce }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Wallet sign-in failed (${res.status}). ${detail}`);
    }
    const { token } = (await res.json()) as { token: string; uid: string };

    try { await setPersistence(auth, browserLocalPersistence); } catch { /* fallback handled in effect */ }
    const cred = await signInWithCustomToken(auth, token);
    const uid = cred.user.uid;

    // Ensure user doc exists (onAuthStateChanged also handles this; do it directly to avoid race)
    const ref = doc(db, "users", uid);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      const shortName = `arc_${address.slice(2, 8)}`;
      await setDoc(ref, {
        uid,
        name: shortName,
        username: shortName,
        email: "",
        photoURL: "",
        points: 0,
        streak: 0,
        badges: [],
        rank: 0,
        joinedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    }

    // Link / refresh wallet on the profile (idempotent for returning users).
    await updateDoc(ref, {
      walletAddress: address,
      walletProvider: wallet.kind,
      walletConnectedAt: serverTimestamp(),
    });

    // Anti-farming: bind the wallet to the referral and void duplicates.
    // Then attempt activation (wallet link alone satisfies the gate).
    try {
      await attachWalletToReferral(uid, address);
      await maybeActivateReferral(uid);
    } catch (err) {
      console.warn("referral activation on wallet link failed", err);
    }
  };

  const logout = async () => {
    const { auth } = getFirebase();
    if (!auth) return;
    // Optimistically clear local state so UI returns to the login screen
    // immediately, even if signOut() has any network latency.
    setProfile(null);
    setUser(null);
    await signOut(auth);
  };

  return (
    <Ctx.Provider value={{ user, profile, loading, signInGoogle, signInWallet, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
