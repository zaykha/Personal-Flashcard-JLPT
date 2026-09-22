import type { WordInput } from "@/types";
export function stableWordId(word: Pick<WordInput, "level" | "day" | "kanji" | "reading">): string {
  const source = `${word.level}|${word.day}|${word.kanji.trim()}|${word.reading.trim()}`;
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) { hash ^= source.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return `${word.level.toLowerCase()}-d${word.day}-${(hash >>> 0).toString(36)}`;
}
