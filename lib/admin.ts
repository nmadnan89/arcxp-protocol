import { useEffect, useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebase } from "./firebase";
import { useAuth } from "./auth-context";

export const ADMIN_EMAILS = ["nmadnan22@gmail.com"];

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const admin = isAdminEmail(user?.email);

  useEffect(() => {
    if (!user || !admin) {
      setReady(!loading);
      return;
    }
    const { db } = getFirebase();
    if (!db) return;
    // Persist admin role in Firestore (idempotent).
    void setDoc(
      doc(db, "admins", user.uid),
      { uid: user.uid, email: user.email, grantedAt: serverTimestamp() },
      { merge: true },
    ).finally(() => setReady(true));
  }, [user, admin, loading]);

  return { isAdmin: admin, ready: ready || !loading, loading };
}
