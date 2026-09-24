"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import type { Word, WordInput } from "@/types";
import { stableWordId } from "@/utils/word-id";

type CatalogWord = WordInput & {
  id: string;
  createdAt?: Word["createdAt"];
  updatedAt?: Word["updatedAt"];
};

type Progress = Pick<
  Word,
  | "difficult"
  | "suspended"
  | "learningStatus"
  | "nextReviewAt"
  | "lastReviewedAt"
  | "reviewIntervalDays"
  | "reviewCount"
  | "failedReviewCount"
> & { updatedAt?: Word["updatedAt"] };

type WordsValue = {
  words: Word[];
  loading: boolean;
  error: string;
  saveWord: (input: WordInput, id?: string) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  patchWord: (id: string, patch: Partial<Word>) => Promise<void>;
  importWords: (
    inputs: WordInput[],
    progress?: (count: number) => void,
  ) => Promise<void>;
  deleteAll: () => Promise<void>;
  migrateLegacyWords: () => Promise<number>;
};

const defaultProgress: Progress = {
  difficult: false,
  suspended: false,
  learningStatus: "new",
  nextReviewAt: null,
  lastReviewedAt: null,
  reviewIntervalDays: 0,
  reviewCount: 0,
  failedReviewCount: 0,
};

const progressKeys = new Set<keyof Word>([
  "difficult",
  "suspended",
  "learningStatus",
  "nextReviewAt",
  "lastReviewedAt",
  "reviewIntervalDays",
  "reviewCount",
  "failedReviewCount",
]);

const WordsContext = createContext<WordsValue | null>(null);
const contentFromData = (id: string, data: DocumentData) =>
  ({ id, ...data }) as CatalogWord;

function sameWord(a: WordInput, b: WordInput) {
  return (
    a.level === b.level &&
    a.day === b.day &&
    a.kanji.trim() === b.kanji.trim() &&
    a.reading.trim() === b.reading.trim()
  );
}

export function WordsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [catalog, setCatalog] = useState<CatalogWord[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [catalogReady, setCatalogReady] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setCatalog([]);
      setProgress({});
      setCatalogReady(true);
      setProgressReady(true);
      return;
    }
    setCatalogReady(false);
    setProgressReady(false);
    setError("");
    const unsubscribeCatalog = onSnapshot(
      collection(db, "catalogWords"),
      (snapshot) => {
        setCatalog(
          snapshot.docs.map((item) =>
            contentFromData(item.id, item.data()),
          ),
        );
        setCatalogReady(true);
      },
      () => {
        setError("Could not load the lesson catalog. Check your connection.");
        setCatalogReady(true);
      },
    );
    const unsubscribeProgress = onSnapshot(
      collection(db, "users", user.uid, "progress"),
      (snapshot) => {
        setProgress(
          Object.fromEntries(
            snapshot.docs.map((item) => [item.id, item.data() as Progress]),
          ),
        );
        setProgressReady(true);
      },
      () => {
        setError("Could not load your study progress. Check your connection.");
        setProgressReady(true);
      },
    );
    return () => {
      unsubscribeCatalog();
      unsubscribeProgress();
    };
  }, [user]);

  const words = useMemo(
    () =>
      catalog.map(
        (word) =>
          ({
            ...word,
            ...defaultProgress,
            ...(progress[word.id] ?? {}),
          }) as Word,
      ),
    [catalog, progress],
  );

  const requireUser = () => {
    if (!user) throw new Error("Sign in required");
    return user;
  };
  const requireAdmin = () => {
    if (!isAdmin) throw new Error("Administrator access required");
    return requireUser();
  };

  async function saveWord(input: WordInput, id?: string) {
    requireAdmin();
    const matching = catalog.find((word) => sameWord(word, input));
    const wordId = id ?? matching?.id ?? stableWordId(input);
    const exists = catalog.some((word) => word.id === wordId);
    await setDoc(
      doc(db, "catalogWords", wordId),
      {
        ...input,
        ...(!exists ? { createdAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  async function importWords(
    inputs: WordInput[],
    reportProgress?: (count: number) => void,
  ) {
    requireAdmin();
    for (let start = 0; start < inputs.length; start += 450) {
      const batch = writeBatch(db);
      const chunk = inputs.slice(start, start + 450);
      chunk.forEach((input) => {
        const matching = catalog.find((word) => sameWord(word, input));
        const wordId = matching?.id ?? stableWordId(input);
        batch.set(
          doc(db, "catalogWords", wordId),
          {
            ...input,
            ...(!matching ? { createdAt: serverTimestamp() } : {}),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      });
      await batch.commit();
      reportProgress?.(Math.min(inputs.length, start + chunk.length));
    }
  }

  async function patchWord(id: string, patch: Partial<Word>) {
    const currentUser = requireUser();
    const progressPatch = Object.fromEntries(
      Object.entries(patch).filter(([key]) =>
        progressKeys.has(key as keyof Word),
      ),
    );
    await setDoc(
      doc(db, "users", currentUser.uid, "progress", id),
      { ...progressPatch, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  async function deleteWord(id: string) {
    const currentUser = requireAdmin();
    const batch = writeBatch(db);
    batch.delete(doc(db, "catalogWords", id));
    batch.delete(doc(db, "users", currentUser.uid, "progress", id));
    await batch.commit();
  }

  async function deleteAll() {
    requireAdmin();
    for (let start = 0; start < catalog.length; start += 450) {
      const batch = writeBatch(db);
      catalog
        .slice(start, start + 450)
        .forEach((word) => batch.delete(doc(db, "catalogWords", word.id)));
      await batch.commit();
    }
  }

  async function migrateLegacyWords() {
    const currentUser = requireAdmin();
    const legacySnapshot = await getDocs(
      collection(db, "users", currentUser.uid, "words"),
    );
    for (let start = 0; start < legacySnapshot.docs.length; start += 150) {
      const batch = writeBatch(db);
      legacySnapshot.docs.slice(start, start + 150).forEach((item) => {
        const data = item.data() as Word;
        const input: WordInput = {
          level: data.level,
          day: data.day,
          kanji: data.kanji,
          reading: data.reading,
          english: data.english,
          partOfSpeech: data.partOfSpeech ?? "",
          example: data.example ?? "",
          notes: data.notes ?? "",
        };
        batch.set(
          doc(db, "catalogWords", item.id),
          {
            ...input,
            createdAt: data.createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        batch.set(
          doc(db, "users", currentUser.uid, "progress", item.id),
          {
            difficult: data.difficult ?? false,
            suspended: data.suspended ?? false,
            learningStatus: data.learningStatus ?? "new",
            nextReviewAt: data.nextReviewAt ?? null,
            lastReviewedAt: data.lastReviewedAt ?? null,
            reviewIntervalDays: data.reviewIntervalDays ?? 0,
            reviewCount: data.reviewCount ?? 0,
            failedReviewCount: data.failedReviewCount ?? 0,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        batch.delete(item.ref);
      });
      await batch.commit();
    }
    return legacySnapshot.size;
  }

  const value: WordsValue = {
    words,
    loading: !catalogReady || !progressReady,
    error,
    saveWord,
    deleteWord,
    patchWord,
    importWords,
    deleteAll,
    migrateLegacyWords,
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
