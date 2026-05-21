import { createFileRoute } from "@tanstack/react-router";
import { verifyMessage, isAddress } from "ethers";
import { findUidByWallet, mintFirebaseCustomToken } from "@/lib/firebase-admin.server";

const NONCE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export const SIGN_IN_DOMAIN = "arcxp";

/** Build the canonical message the wallet signs. Keep in sync with the client. */
function buildMessage(address: string, issuedAt: number, nonce: string): string {
  return [
    `${SIGN_IN_DOMAIN} wants you to sign in with your wallet.`,
    "",
    `Address: ${address}`,
    `Issued At: ${new Date(issuedAt).toISOString()}`,
    `Nonce: ${nonce}`,
    "",
    "Signing this message proves you own this wallet. No transaction is sent and no gas is spent.",
  ].join("\n");
}

/** Deterministic UID derived from wallet address. Used for brand-new wallets. */
function uidForWallet(address: string): string {
  return `wallet_${address.toLowerCase()}`;
}

export const Route = createFileRoute("/api/public/wallet-auth")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: {
          address?: string;
          signature?: string;
          issuedAt?: number;
          nonce?: string;
        };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "invalid_json" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const address = body.address?.toLowerCase() ?? "";
        const signature = body.signature ?? "";
        const issuedAt = Number(body.issuedAt);
        const nonce = String(body.nonce ?? "");

        if (
          !isAddress(address) ||
          typeof signature !== "string" ||
          signature.length < 10 ||
          !Number.isFinite(issuedAt) ||
          nonce.length < 8 ||
          nonce.length > 128
        ) {
          return new Response(JSON.stringify({ error: "invalid_input" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        // Replay protection: message must be recent.
        const skew = Math.abs(Date.now() - issuedAt);
        if (skew > NONCE_WINDOW_MS) {
          return new Response(JSON.stringify({ error: "expired" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        // Verify signature.
        let recovered: string;
        try {
          recovered = verifyMessage(buildMessage(address, issuedAt, nonce), signature);
        } catch {
          return new Response(JSON.stringify({ error: "bad_signature" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        if (recovered.toLowerCase() !== address) {
          return new Response(JSON.stringify({ error: "address_mismatch" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        // Look up existing linked uid; fall back to deterministic uid for brand-new wallets.
        let uid: string | null = null;
        try {
          uid = await findUidByWallet(address);
        } catch (err) {
          console.warn("findUidByWallet failed", err);
        }
        if (!uid) uid = uidForWallet(address);

        let token: string;
        try {
          token = await mintFirebaseCustomToken(uid);
        } catch (err) {
          console.error("mintFirebaseCustomToken failed", err);
          return new Response(JSON.stringify({ error: "token_mint_failed" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ token, uid, address }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});