import { SignJWT, importPKCS8 } from "jose";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let cached: ServiceAccount | null = null;

function getServiceAccount(): ServiceAccount {
  if (cached) return cached;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  let parsed: ServiceAccount;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
    throw new Error("Service account is missing required fields");
  }
  // Handle escaped newlines from env storage
  parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  cached = parsed;
  return parsed;
}

export function getFirebaseProjectId(): string {
  return getServiceAccount().project_id;
}

/**
 * Mint a Firebase Auth custom token (RS256 JWT) for the given uid.
 * Client can exchange it via signInWithCustomToken().
 */
export async function mintFirebaseCustomToken(uid: string): Promise<string> {
  if (!uid || uid.length > 128) throw new Error("Invalid uid");
  const sa = getServiceAccount();
  const key = await importPKCS8(sa.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({
    uid,
    claims: {},
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(
      "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    )
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
}

/**
 * Look up an existing Firebase uid that already has this wallet address
 * linked, via Firestore REST. Returns null if no match.
 *
 * Firestore rules: `users/{uid}` has `allow read: if true`, so no auth needed.
 */
export async function findUidByWallet(address: string): Promise<string | null> {
  const projectId = getFirebaseProjectId();
  // Public API key (same one used in the client SDK); also exposed in firebase.ts
  const apiKey = "AIzaSyAQbRx0hI44xax7FhUWN1_8NmO96s3Y2t0";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: "users" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "walletAddress" },
          op: "EQUAL",
          value: { stringValue: address.toLowerCase() },
        },
      },
      limit: 1,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.warn("findUidByWallet: Firestore query failed", res.status, await res.text());
    return null;
  }
  const rows = (await res.json()) as Array<{ document?: { name: string } }>;
  for (const row of rows) {
    const name = row.document?.name;
    if (!name) continue;
    // name = "projects/.../databases/(default)/documents/users/<uid>"
    const m = name.match(/\/users\/([^/]+)$/);
    if (m) return m[1];
  }
  return null;
}