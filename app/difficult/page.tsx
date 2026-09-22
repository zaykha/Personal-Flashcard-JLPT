"use client";
import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CustomSelect } from "@/components/CustomSelect";
import { useWords } from "@/hooks/useWords";
import { JLPT_LEVELS } from "@/types";
export default function DifficultPage() {
  const { words, patchWord } = useWords();
  const [level, setLevel] = useState("all");
  const [day, setDay] = useState("all");
  const all = words.filter((w) => w.difficult);
  const days = [
    ...new Set(
      all.filter((w) => level === "all" || w.level === level).map((w) => w.day),
    ),
  ].sort((a, b) => a - b);
  const filtered = all.filter(
    (w) =>
      (level === "all" || w.level === level) &&
      (day === "all" || w.day === Number(day)),
  );
  return (
    <>
      <PageHeader
        eyebrow="Focused review"
        title="Difficult words"
        description="Words you’ve marked for a little extra attention."
        action={
          all.length ? (
            <Link className="btn" href="/study?mode=difficult">
              <Star size={17} /> Study difficult
            </Link>
          ) : undefined
        }
      />
      <div className="filters" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <CustomSelect
          ariaLabel="Filter difficult words by JLPT level"
          value={level}
          options={[
            { value: "all", label: "All levels" },
            ...JLPT_LEVELS.map((value) => ({ value, label: value })),
          ]}
          onChange={(value) => {
            setLevel(value);
            setDay("all");
          }}
        />
        <CustomSelect
          ariaLabel="Filter difficult words by day"
          value={day}
          options={[
            { value: "all", label: "All days" },
            ...days.map((value) => ({
              value: String(value),
              label: `Day ${value}`,
            })),
          ]}
          onChange={setDay}
        />
      </div>
      <div className="word-list">
        {filtered.map((w) => (
          <article className="word-row" key={w.id}>
            <div className="word-main">
              <b>{w.kanji}</b>
              <span>{w.reading}</span>
            </div>
            <div className="word-main">
              <b style={{ font: "inherit", fontWeight: 800 }}>
                {w.level} · Day {w.day}
              </b>
              <span>{w.partOfSpeech || "—"}</span>
            </div>
            <span>{w.english}</span>
            <button
              className="icon-btn starred"
              aria-label="Remove difficult mark"
              onClick={() => patchWord(w.id, { difficult: false })}
            >
              <Star size={17} fill="currentColor" />
            </button>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <div className="empty-icon">☆</div>
          <h3>No difficult words yet</h3>
          <p>Use the star on any card or vocabulary row to keep it here.</p>
        </div>
      )}
    </>
  );
}
