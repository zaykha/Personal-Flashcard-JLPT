"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  Check,
  RotateCcw,
  Shuffle,
  Star,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CustomSelect } from "@/components/CustomSelect";
import { useWords } from "@/hooks/useWords";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { applyKnowResult, applyNeedReviewResult, isWordDue } from "@/utils/srs";
import { JLPT_LEVELS, type StudyDirection, type Word } from "@/types";
const shuffled = <T,>(items: T[]) =>
  items
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.value);
function StudyContent() {
  const params = useSearchParams();
  const { isAdmin } = useAuth();
  const { words, patchWord } = useWords();
  const { study } = useSettings();
  const [level, setLevel] = useState(params.get("level") || "N5");
  const [day, setDay] = useState(params.get("day") || "");
  const [mode, setMode] = useState(params.get("mode") || "all");
  const [direction, setDirection] = useState<StudyDirection>(study.direction);
  const [shuffle, setShuffle] = useState(study.shuffle);
  const [session, setSession] = useState<Word[] | null>(null);
  const [sessionDirections, setSessionDirections] = useState<StudyDirection[]>(
    [],
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reading, setReading] = useState(false);
  const [stats, setStats] = useState({ know: 0, review: 0, marked: 0 });
  const [undo, setUndo] = useState<{
    word: Word;
    grade: "know" | "review";
  } | null>(null);
  useEffect(() => {
    setDirection(study.direction);
    setShuffle(study.shuffle);
  }, [study.direction, study.shuffle]);
  const days = useMemo(
    () =>
      [
        ...new Set(words.filter((w) => w.level === level).map((w) => w.day)),
      ].sort((a, b) => a - b),
    [words, level],
  );
  useEffect(() => {
    if (!day && days.length) setDay(String(days[0]));
  }, [day, days]);
  const candidates = useMemo(
    () =>
      words.filter(
        (w) =>
          !w.suspended &&
          (mode === "due"
            ? isWordDue(w)
            : mode === "difficult"
              ? w.difficult
              : w.level === level &&
                w.day === Number(day) &&
                (mode !== "new" || w.learningStatus === "new")),
      ),
    [words, mode, level, day],
  );
  const current = session?.[index];
  const cardDirection = sessionDirections[index] ?? direction;
  function start() {
    const nextSession = shuffle ? shuffled(candidates) : [...candidates];
    setSession(nextSession);
    setSessionDirections(
      nextSession.map(() =>
        direction === "mixed"
          ? Math.random() < 0.5
            ? "kanji"
            : "english"
          : direction,
      ),
    );
    setIndex(0);
    setStats({ know: 0, review: 0, marked: 0 });
    setRevealed(false);
    setReading(false);
    setUndo(null);
  }
  const grade = useCallback(
    async (kind: "know" | "review") => {
      if (!current || !revealed) return;
      const original = { ...current };
      const patch =
        kind === "know"
          ? applyKnowResult(current)
          : applyNeedReviewResult(current);
      await patchWord(current.id, patch);
      setUndo({ word: original, grade: kind });
      setStats((s) => ({ ...s, [kind]: s[kind] + 1 }));
      setIndex((i) => i + 1);
      setRevealed(false);
      setReading(false);
    },
    [current, revealed, patchWord],
  );
  const undoGrade = useCallback(async () => {
    if (!undo) return;
    const { id, ...restore } = undo.word;
    await patchWord(id, restore);
    setIndex((i) => Math.max(0, i - 1));
    setStats((s) => ({ ...s, [undo.grade]: Math.max(0, s[undo.grade] - 1) }));
    setUndo(null);
    setRevealed(true);
  }, [undo, patchWord]);
  const toggleDifficult = useCallback(async () => {
    if (!current) return;
    const next = !current.difficult;
    await patchWord(current.id, { difficult: next });
    setSession(
      (s) =>
        s?.map((w) => (w.id === current.id ? { ...w, difficult: next } : w)) ||
        null,
    );
    setStats((s) => ({
      ...s,
      marked: Math.max(0, s.marked + (next ? 1 : -1)),
    }));
  }, [current, patchWord]);
  const toggleSuspended = useCallback(async () => {
    if (!current) return;
    const next = !current.suspended;
    await patchWord(current.id, { suspended: next });
    setSession(
      (s) =>
        s?.map((w) => (w.id === current.id ? { ...w, suspended: next } : w)) ||
        null,
    );
  }, [current, patchWord]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        setRevealed(true);
      }
      if (e.key.toLowerCase() === "r") setReading(true);
      if (e.key === "1") grade("review");
      if (e.key === "2") grade("know");
      if (e.key.toLowerCase() === "d") toggleDifficult();
      if (e.key.toLowerCase() === "z") undoGrade();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [grade, toggleDifficult, undoGrade]);
  if (session) {
    if (index >= session.length)
      return (
        <div className="session panel complete">
          <div className="seal">花</div>
          <h1>Session complete</h1>
          <p className="hint">
            Nice work. Your next reviews are already scheduled.
          </p>
          <div className="grid complete-stats">
            <div>
              <strong>{session.length}</strong>
              <span>Studied</span>
            </div>
            <div>
              <strong>{stats.know}</strong>
              <span>Know</span>
            </div>
            <div>
              <strong>{stats.review}</strong>
              <span>Need review</span>
            </div>
            <div>
              <strong>{stats.marked}</strong>
              <span>Difficult marked</span>
            </div>
          </div>
          <div className="reveal-actions">
            <button
              className="btn secondary"
              disabled={!undo}
              onClick={undoGrade}
            >
              Undo last grade
            </button>
            <button className="btn" onClick={() => setSession(null)}>
              Back to study
            </button>
          </div>
        </div>
      );
    if (!current) return null;
    return (
      <div className="session">
        <div className="session-head">
          <span>
            {index + 1} / {session.length}
          </span>
          <button className="btn secondary" onClick={() => setSession(null)}>
            <X size={16} /> Exit
          </button>
        </div>
        <article className="flashcard">
          <span className="level">
            {current.level} · DAY {current.day}
          </span>
          <button
            className={`icon-btn star ${current.difficult ? "starred" : ""}`}
            aria-label="Toggle difficult"
            onClick={toggleDifficult}
          >
            <Star
              size={19}
              fill={current.difficult ? "currentColor" : "none"}
            />
          </button>
          {cardDirection === "kanji" ? (
            <>
              <div className="prompt">{current.kanji}</div>
              {(reading || revealed) && (
                <div className="reading">{current.reading}</div>
              )}
              {revealed && (
                <>
                  <div className="meaning">{current.english}</div>
                  {current.partOfSpeech && (
                    <span className="pos">{current.partOfSpeech}</span>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div className="prompt english">{current.english}</div>
              {revealed && (
                <>
                  <div
                    className="meaning"
                    style={{ fontFamily: "var(--font-jp)" }}
                  >
                    {current.kanji}
                  </div>
                  <div className="reading">{current.reading}</div>
                  {current.partOfSpeech && (
                    <span className="pos">{current.partOfSpeech}</span>
                  )}
                </>
              )}
            </>
          )}
          {revealed && current.example && (
            <p className="example">{current.example}</p>
          )}
          {revealed && current.notes && (
            <p className="notes">{current.notes}</p>
          )}
          {!revealed && (
            <div className="reveal-actions">
              {cardDirection === "kanji" && !reading && (
                <button
                  className="btn secondary"
                  onClick={() => setReading(true)}
                >
                  Show reading
                </button>
              )}
              <button className="btn" onClick={() => setRevealed(true)}>
                Reveal answer
              </button>
            </div>
          )}
        </article>
        {revealed && (
          <div className="grade-controls">
            <button className="btn danger" onClick={() => grade("review")}>
              <RotateCcw size={19} /> Need review
            </button>
            <button className="btn green" onClick={() => grade("know")}>
              <Check size={19} /> Know
            </button>
          </div>
        )}
        <div className="session-tools">
          <button
            className="btn secondary"
            disabled={!undo}
            onClick={undoGrade}
          >
            Undo last grade
          </button>
          <button className="btn secondary" onClick={toggleSuspended}>
            {current.suspended ? "Unsuspend" : "Suspend word"}
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="Study session"
        title="What shall we review?"
        description="Choose a set, take a breath, and begin."
      />
      <div
        className="grid study-options"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
      >
        <button
          className={`option-card ${mode === "all" ? "selected" : ""}`}
          onClick={() => setMode("all")}
        >
          <BookOpen />
          <b>Study all</b>
          <span>Every active word in this day</span>
        </button>
        <button className="option-card" onClick={() => setMode("new")}>
          <Brain />
          <b>New only</b>
          <span>Words you haven’t graded yet</span>
        </button>
        <button className="option-card" onClick={() => setMode("difficult")}>
          <Star />
          <b>Difficult only</b>
          <span>Your starred vocabulary</span>
        </button>
        <button className="option-card" onClick={() => setMode("due")}>
          <RotateCcw />
          <b>Due review</b>
          <span>Only words scheduled for now</span>
        </button>
      </div>
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="fields">
          <div className="field">
            <label>JLPT level</label>
            <CustomSelect
              ariaLabel="JLPT level"
              value={level}
              disabled={mode === "due" || mode === "difficult"}
              options={JLPT_LEVELS.map((value) => ({ value, label: value }))}
              onChange={(value) => {
                setLevel(value);
                setDay("");
              }}
            />
          </div>
          <div className="field">
            <label>Day</label>
            <CustomSelect
              ariaLabel="Study day"
              value={day}
              disabled={mode === "due" || mode === "difficult"}
              options={days.map((value) => ({
                value: String(value),
                label: `Day ${value}`,
              }))}
              onChange={setDay}
            />
          </div>
          <div className="field">
            <label>Direction</label>
            <CustomSelect
              ariaLabel="Study direction"
              value={direction}
              options={[
                { value: "kanji", label: "Kanji → English" },
                { value: "english", label: "English → Japanese" },
                { value: "mixed", label: "Mixed" },
              ]}
              onChange={(value) => setDirection(value as StudyDirection)}
            />
          </div>
          <div className="field">
            <label>Order</label>
            <button
              className="btn secondary"
              onClick={() => setShuffle(!shuffle)}
            >
              <Shuffle size={16} /> Shuffle {shuffle ? "ON" : "OFF"}
            </button>
          </div>
        </div>
        <div className="form-actions">
          <span className="hint" style={{ marginRight: "auto" }}>
            {candidates.length} available words
          </span>
          <button className="btn" disabled={!candidates.length} onClick={start}>
            Start session
          </button>
        </div>
      </section>
      {!candidates.length && (
        <div className="empty">
          <h3>
            {mode === "due" ? "You’re caught up" : "No words in this set"}
          </h3>
          <p>
            {mode === "due"
              ? "No words are due right now."
              : "Choose another level, day, or mode."}
          </p>
          {isAdmin && (
            <Link href="/settings" className="btn secondary">
              Manage lessons
            </Link>
          )}
        </div>
      )}
    </>
  );
}
export default function StudyPage() {
  return (
    <Suspense>
      <StudyContent />
    </Suspense>
  );
}
