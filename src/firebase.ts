/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
// Safely check and load local config file using a glob to prevent compilation failure if missing when clonned from git
const configFiles = import.meta.glob("../firebase-applet-config.json", { eager: true });
const firebaseConfigFile = configFiles["../firebase-applet-config.json"]
  ? (configFiles["../firebase-applet-config.json"] as any).default
  : null;

const firebaseConfig = firebaseConfigFile || {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "MOCK_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-project.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "default"
};

import { VibeUser, RecommendationBatch } from "./types";

// Determine if Firebase config is uninitialized or a placeholder mock
export const isFirebaseMock = 
  !firebaseConfig || 
  firebaseConfig.apiKey === "MOCK_API_KEY" || 
  firebaseConfig.projectId === "mock-project" ||
  !firebaseConfig.apiKey;

let dbInstance: any = null;
let authInstance: any = null;

if (!isFirebaseMock) {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || "default");
    authInstance = getAuth(app);
    console.log("Firebase initialized successfully in production cloud mode.");
  } catch (error) {
    console.warn("Failed to initialize production Firebase. Falling back to simulated client state.", error);
    dbInstance = null;
    authInstance = null;
  }
}

export const db = dbInstance;
export const auth = authInstance;

// Helper to login dynamically: supports Google Authentication via Popup, or simulated Login for sandbox preview
export async function authenticateWithGoogle(): Promise<VibeUser> {
  if (isFirebaseMock || !auth) {
    // Generate a beautiful simulated user session
    const simulatedUser: VibeUser = {
      uid: "mock_user_123",
      email: "dishigpt15@gmail.com",
      displayName: "NextPick Explorer",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      isMock: true
    };
    localStorage.setItem("nextpick_mock_user", JSON.stringify(simulatedUser));
    return simulatedUser;
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return {
    uid: result.user.uid,
    email: result.user.email || "",
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
    isMock: false
  };
}

// Log out helper
export async function terminateUserSession(): Promise<void> {
  if (isFirebaseMock || !auth) {
    localStorage.removeItem("nextpick_mock_user");
    return;
  }
  await signOut(auth);
}

// Persist a result locally (or to Firestore if live)
export async function saveRecommendation(userId: string, batch: RecommendationBatch, idToken: string | null): Promise<boolean> {
  // Try calling backend (backend already handles saving in Firestore and back-up)
  try {
    const headers: any = { "Content-Type": "application/json" };
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }
    headers["x-user-id"] = userId;

    const response = await fetch("/api/recommendations/generate", {
      method: "POST",
      headers,
      body: JSON.stringify(batch.inputs)
    });

    if (response.ok) {
      return true;
    }
  } catch (e) {
    console.error("Backend saving sync skipped:", e);
  }
  return false;
}
