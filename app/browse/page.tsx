"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CirclePause, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { WordForm } from "@/components/WordForm";
import { CustomSelect } from "@/components/CustomSelect";
import { useWords } from "@/hooks/useWords";
import { useAuth } from "@/hooks/useAuth";
import { JLPT_LEVELS, type Word } from "@/types";
function BrowseContent() {
  const params = useSearchParams();
  const { words, saveWord, deleteWord, patchWord } = useWords();
  const { isAdmin } = useAuth();
  const [level, setLevel] = useState(params.get("level") || "all");
  const [day, setDay] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Word | null | undefined>(undefined);
  const days = [
    ...new Set(
      words
        .filter((w) => level === "all" || w.level === level)
        .map((w) => w.day),
    ),
  ].sort((a, b) => a - b);
  const filtered = useMemo(
    () =>
      words
        .filter(
          (w) =>
            (level === "all" || w.level === level) &&
            (day === "all" || w.day === Number(day)) &&
            (status === "all" ||
              (status === "difficult"
                ? w.difficult
                : w.learningStatus === status)) &&
            `${w.kanji} ${w.reading} ${w.english}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) => a.level.localeCompare(b.level) || a.day - b.day),
    [words, level, day, status, query],
  );
  async function remove(word: Word) {
    if (confirm(`Delete ${word.kanji}? This cannot be undone.`))
      await deleteWord(word.id);
  }
  return (
    <>
      <PageHeader
        eyebrow="Your library"
        title="Browse vocabulary"
        description="Search and study the official lesson catalog."
        action={
          isAdmin ? (
            <button className="btn" onClick={() => setEditing(null)}>
              <Plus size={18} /> Add word
            </button>
          ) : undefined
        }
      />
      {isAdmin && editing !== undefined && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>
            {editing ? "Edit word" : "Add a word"}
          </h2>
          <WordForm
            key={editing?.id ?? "new"}
            word={editing}
            onSave={saveWord}
            onCancel={() => setEditing(undefined)}
          />
        </div>
      )}
      <div className="filters">
        <input
          className="search-input"
          placeholder="Search kanji, reading, English…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <CustomSelect
          ariaLabel="Filter by JLPT level"
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
          ariaLabel="Filter by day"
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
        <CustomSelect
          ariaLabel="Filter by learning status"
          value={status}
          options={[
            { value: "all", label: "Any status" },
            { value: "new", label: "New" },
            { value: "review", label: "Review" },
            { value: "difficult", label: "Difficult" },
          ]}
          onChange={setStatus}
        />
      </div>
      {level !== "all" && day === "all" && (
        <div className="grid days" style={{ marginBottom: 22 }}>
          {days.map((d) => (
            <button
              className="day-card"
              key={d}
              onClick={() => setDay(String(d))}
            >
              <b>Day {d}</b>
              <span>
                {words.filter((w) => w.level === level && w.day === d).length}{" "}
                words
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="section-title">
        <h2>
          {filtered.length} {filtered.length === 1 ? "word" : "words"}
        </h2>
        {level !== "all" && day !== "all" && (
          <Link
            className="btn secondary"
            href={`/study?level=${level}&day=${day}`}
          >
            Study day
          </Link>
        )}
      </div>
      <div className="word-list">
        {filtered.map((word) => (
          <article
            className="word-row"
            key={word.id}
            style={{ opacity: word.suspended ? 0.65 : 1 }}
          >
            <div className="word-main">
              <b>{word.kanji}</b>
              <span>{word.reading}</span>
            </div>
            <div className="word-main">
              <b style={{ font: "inherit", fontWeight: 800 }}>
                {word.level} · Day {word.day}
              </b>
              <span>
                {word.partOfSpeech || "—"}
                {word.suspended ? " · Suspended" : ""}
              </span>
            </div>
            <span>{word.english}</span>
            <div className="row-actions">
              <button
                aria-label="Toggle difficult"
                className={`icon-btn ${word.difficult ? "starred" : ""}`}
                onClick={() =>
                  patchWord(word.id, { difficult: !word.difficult })
                }
              >
                <Star
                  size={17}
                  fill={word.difficult ? "currentColor" : "none"}
                />
              </button>
              {isAdmin && (
                <button
                  aria-label="Edit word"
                  className="icon-btn"
                  onClick={() => setEditing(word)}
                >
                  <Pencil size={17} />
                </button>
              )}
              <button
                aria-label={word.suspended ? "Unsuspend word" : "Suspend word"}
                className="icon-btn"
                onClick={() =>
                  patchWord(word.id, { suspended: !word.suspended })
                }
              >
                <CirclePause size={17} />
              </button>
              {isAdmin && (
                <button
                  aria-label="Delete word"
                  className="icon-btn"
                  onClick={() => remove(word)}
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <div className="empty-icon">本</div>
          <h3>No vocabulary found</h3>
          <p>Try changing the search or filters.</p>
        </div>
      )}
    </>
  );
}
export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}
