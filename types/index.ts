import type { Timestamp } from "firebase/firestore";
export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export type JLPTLevel = (typeof JLPT_LEVELS)[number];
export type StudyDirection = "kanji" | "english" | "mixed";
export type StudyMode = "all" | "new" | "difficult" | "due";
export type LearningStatus = "new" | "review";
export interface Word {
  id: string; level: JLPTLevel; day: number; kanji: string; reading: string; english: string;
  partOfSpeech: string; example: string; notes: string; difficult: boolean; suspended: boolean;
  learningStatus: LearningStatus; nextReviewAt: Timestamp | null; lastReviewedAt: Timestamp | null;
  reviewIntervalDays: number; reviewCount: number; failedReviewCount: number;
  createdAt?: Timestamp; updatedAt?: Timestamp;
}
export type WordInput = Pick<Word, "level" | "day" | "kanji" | "reading" | "english" | "partOfSpeech" | "example" | "notes">;
export interface StudySettings { direction: StudyDirection; shuffle: boolean; }
