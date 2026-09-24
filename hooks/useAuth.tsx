"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

type AuthValue = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  error: string;
};
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    getRedirectResult(auth).catch(() => {
      setError("Google sign-in could not be completed. Please try again.");
    });
    return onAuthStateChanged(auth, (next) => {
      setRoleLoading(Boolean(next));
      setUser(next);
      setAuthLoading(false);
    });
  }, []);
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(true);
    return onSnapshot(
      doc(db, "admins", user.uid),
      (snapshot) => {
        setIsAdmin(snapshot.exists());
        setRoleLoading(false);
      },
      () => {
        setIsAdmin(false);
        setRoleLoading(false);
      },
    );
  }, [user]);
  async function login() {
    if (!isFirebaseConfigured) {
      setError("Add your Firebase environment variables to .env.local first.");
      return;
    }
    try {
      setError("");
      await setPersistence(auth, browserLocalPersistence);
      const mobileBrowser =
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (mobileBrowser) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch {
      setError("Google sign-in did not complete. Please try again.");
    }
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading: authLoading || roleLoading,
        login,
        logout: () => signOut(auth),
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth requires AuthProvider");
  return value;
}
