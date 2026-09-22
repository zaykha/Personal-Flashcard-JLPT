"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import type { Word, WordInput } from "@/types";
import { stableWordId } from "@/utils/word-id";

type WordsValue = {
  words: Word[];
  loading: boolean;
  error: string;
  saveWord: (input: WordInput, id?: string) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  patchWord: (id: string, patch: Partial<Word>) => Promise<void>;
  importWords: (
    inputs: WordInput[],
    progress?: (n: number) => void,
  ) => Promise<void>;
  deleteAll: () => Promise<void>;
};
const WordsContext = createContext<WordsValue | null>(null);
const fromDoc = (id: string, data: DocumentData) => ({ id, ...data }) as Word;

export function WordsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) {
      setWords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(
      collection(db, "users", user.uid, "words"),
      (snap) => {
        setWords(snap.docs.map((d) => fromDoc(d.id, d.data())));
        setLoading(false);
      },
      () => {
        setError(
          "Could not load vocabulary. Check your connection and Firestore rules.",
        );
        setLoading(false);
      },
    );
  }, [user]);
  const requireUser = () => {
    if (!user) throw new Error("Sign in required");
    return user;
  };
  async function saveWord(input: WordInput, id?: string) {
    const u = requireUser();
    const wordId = stableWordId(input);
    const ref = doc(db, "users", u.uid, "words", wordId);
    const existing = words.find((w) => w.id === wordId);
    const source = id ? words.find((w) => w.id === id) : undefined;
    if (id && id !== wordId && source) {
      const batch = writeBatch(db);
      const { id: sourceId, ...preserved } = existing ?? source;
      void sourceId;
      batch.set(
        ref,
        { ...preserved, ...input, updatedAt: serverTimestamp() },
        { merge: true },
      );
      batch.delete(doc(db, "users", u.uid, "words", id));
      await batch.commit();
      return;
    }
    await setDoc(
      ref,
      existing
        ? { ...input, updatedAt: serverTimestamp() }
        : {
            ...input,
            difficult: false,
            suspended: false,
            learningStatus: "new",
            nextReviewAt: null,
            lastReviewedAt: null,
            reviewIntervalDays: 0,
            reviewCount: 0,
            failedReviewCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
      { merge: true },
    );
  }
  async function importWords(
    inputs: WordInput[],
    progress?: (n: number) => void,
  ) {
    const u = requireUser();
    for (let start = 0; start < inputs.length; start += 450) {
      const batch = writeBatch(db);
      const chunk = inputs.slice(start, start + 450);
      chunk.forEach((input) => {
        const id = stableWordId(input);
        const exists = words.some((w) => w.id === id);
        const ref = doc(db, "users", u.uid, "words", id);
        batch.set(
          ref,
          exists
            ? { ...input, updatedAt: serverTimestamp() }
            : {
                ...input,
                difficult: false,
                suspended: false,
                learningStatus: "new",
                nextReviewAt: null,
                lastReviewedAt: null,
                reviewIntervalDays: 0,
                reviewCount: 0,
                failedReviewCount: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
          { merge: true },
        );
      });
      await batch.commit();
      progress?.(Math.min(inputs.length, start + chunk.length));
    }
  }
  async function deleteAll() {
    const u = requireUser();
    for (let start = 0; start < words.length; start += 450) {
      const batch = writeBatch(db);
      words
        .slice(start, start + 450)
        .forEach((w) => batch.delete(doc(db, "users", u.uid, "words", w.id)));
      await batch.commit();
    }
  }
  const value: WordsValue = {
    words,
    loading,
    error,
    saveWord,
    deleteWord: async (id) => {
      const u = requireUser();
      await deleteDoc(doc(db, "users", u.uid, "words", id));
    },
    patchWord: async (id, patch) => {
      const u = requireUser();
      await updateDoc(doc(db, "users", u.uid, "words", id), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    },
    importWords,
    deleteAll,
  };
  return (
    <WordsContext.Provider value={value}>{children}</WordsContext.Provider>
  );
}
export function useWords() {
  const value = useContext(WordsContext);
  if (!value) throw new Error("useWords requires WordsProvider");
  return value;
}
