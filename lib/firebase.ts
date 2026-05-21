import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyAQbRx0hI44xax7FhUWN1_8NmO96s3Y2t0",

  authDomain: "arc-xp-dashboard.firebaseapp.com",

  projectId: "arc-xp-dashboard",

  storageBucket: "arc-xp-dashboard.firebasestorage.app",

  messagingSenderId: "343052704144",

  appId: "1:343052704144:web:5cdd67d670d7b2de3f3b15",

  measurementId: "G-YV0YR53462"

};

const firebaseAppName = "arc-xp-dashboard-web";

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function getFirebase(): { app: FirebaseApp | null; auth: Auth | null; db: Firestore | null } {
  if (typeof window === "undefined") {
    return { app: null, auth: null, db: null };
  }

  if (!cachedApp) {
    cachedApp = getApps().some((app) => app.name === firebaseAppName)
      ? getApp(firebaseAppName)
      : initializeApp(firebaseConfig, firebaseAppName);
  }

  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
  }

  if (!cachedDb) {
    cachedDb = getFirestore(cachedApp);
  }

  return { app: cachedApp, auth: cachedAuth, db: cachedDb };
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
