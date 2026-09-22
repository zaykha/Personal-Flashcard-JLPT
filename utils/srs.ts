import { Timestamp } from "firebase/firestore";
import type { Word } from "@/types";
const INTERVALS = [1, 3, 7, 14, 30, 60, 120];
const TEN_MINUTES = 10 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
export function isWordDue(word: Word, now = new Date()): boolean {
  return !word.suspended && !!word.nextReviewAt && word.nextReviewAt.toMillis() <= now.getTime();
}
export function applyKnowResult(word: Word, now = new Date()): Partial<Word> {
  const normal = INTERVALS.find((interval) => interval > Math.max(0, word.reviewIntervalDays)) ?? 120;
  const reviewIntervalDays = word.difficult ? Math.max(1, Math.round(normal / 2)) : normal;
  return { learningStatus: "review", lastReviewedAt: Timestamp.fromDate(now), nextReviewAt: Timestamp.fromMillis(now.getTime() + reviewIntervalDays * DAY), reviewIntervalDays, reviewCount: word.reviewCount + 1 };
}
export function applyNeedReviewResult(word: Word, now = new Date()): Partial<Word> {
  const soon = word.learningStatus === "new" || word.reviewIntervalDays <= 1;
  return { learningStatus: "review", lastReviewedAt: Timestamp.fromDate(now), nextReviewAt: Timestamp.fromMillis(now.getTime() + (soon ? TEN_MINUTES : DAY)), reviewIntervalDays: soon ? 0 : 1, reviewCount: word.reviewCount + 1, failedReviewCount: word.failedReviewCount + 1 };
}
