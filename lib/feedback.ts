import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebase } from "./firebase";

export type FeedbackKind = "bug" | "suggestion" | "rating";

export type FeedbackInput = {
  kind: FeedbackKind;
  message: string;
  rating?: number; // 1-5
  url?: string;
};

export type FeedbackDoc = FeedbackInput & {
  id: string;
  uid: string | null;
  email: string | null;
  name: string | null;
  status: "new" | "reviewed" | "resolved";
  createdAt: any;
  userAgent: string;
};

export async function submitFeedback(
  input: FeedbackInput,
  user: { uid: string | null; email: string | null; name: string | null },
) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore unavailable");
  const message = (input.message ?? "").trim().slice(0, 2000);
  if (input.kind !== "rating" && message.length < 3) {
    throw new Error("Please write a longer message.");
  }
  if (input.kind === "rating" && (!input.rating || input.rating < 1 || input.rating > 5)) {
    throw new Error("Please choose a rating.");
  }
  await addDoc(collection(db, "feedback"), {
    kind: input.kind,
    message,
    rating: input.rating ?? null,
    url: input.url ?? (typeof window !== "undefined" ? window.location.pathname : ""),
    uid: user.uid,
    email: user.email,
    name: user.name,
    status: "new",
    createdAt: serverTimestamp(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : "",
  });
}