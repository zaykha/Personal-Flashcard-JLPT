"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  BookOpenText,
  Brain,
  Check,
  Eye,
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
  }
  const grade = useCallback(
    async (kind: "know" | "review") => {
      if (!current || !revealed) return;
      const patch =
        kind === "know"
          ? applyKnowResult(current)
          : applyNeedReviewResult(current);
      await patchWord(current.id, patch);
      setStats((s) => ({ ...s, [kind]: s[kind] + 1 }));
      setIndex((i) => i + 1);
      setRevealed(false);
      setReading(false);
    },
    [current, revealed, patchWord],
  );
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
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [grade, toggleDifficult]);
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
          <button className="btn" onClick={() => setSession(null)}>
            <ArrowLeft size={17} /> Back to study
          </button>
        </div>
      );
    if (!current) return null;
    return (
      <div className="session">
        <div className="session-head">
          <span>
            {index + 1} / {session.length}
          </span>
          <button
            className="btn secondary session-exit"
            aria-label="Exit session"
            onClick={() => setSession(null)}
          >
            <X size={18} /> <span>Exit</span>
          </button>
        </div>
        <div
          className={`flashcard-scene ${revealed ? "is-flipped" : ""}`}
          aria-live="polite"
        >
          <div className="flashcard-flipper">
            <article
              className="flashcard flashcard-face flashcard-front"
              aria-hidden={revealed}
              inert={revealed ? true : undefined}
            >
              <span className="level">{current.level} · DAY {current.day}</span>
              <button className={`icon-btn star ${current.difficult ? "starred" : ""}`} aria-label={current.difficult ? "Remove difficult mark" : "Mark difficult"} onClick={toggleDifficult}><Star size={19} fill={current.difficult ? "currentColor" : "none"}/></button>
              <div className={`prompt ${cardDirection === "english" ? "english" : ""}`}>{cardDirection === "kanji" ? current.kanji : current.english}</div>
              {reading && <div className="reading">{current.reading}</div>}
              <div className="reveal-actions card-actions">
                <button className="btn secondary" aria-label={reading ? "Hide reading" : "Show reading"} aria-pressed={reading} onClick={() => setReading((shown) => !shown)}><BookOpenText size={18}/><span>{reading ? "Hide reading" : "Reading"}</span></button>
                <button className="btn" aria-label="Reveal answer" onClick={() => setRevealed(true)}><Eye size={18}/><span>Reveal</span></button>
              </div>
            </article>
            <article
              className="flashcard flashcard-face flashcard-back"
              aria-hidden={!revealed}
              inert={!revealed ? true : undefined}
            >
              <span className="level">ANSWER · {current.level}</span>
              <button className={`icon-btn star ${current.difficult ? "starred" : ""}`} aria-label={current.difficult ? "Remove difficult mark" : "Mark difficult"} onClick={toggleDifficult}><Star size={19} fill={current.difficult ? "currentColor" : "none"}/></button>
              <div className="prompt answer-kanji">{current.kanji}</div>
              <div className="reading">{current.reading}</div>
              <div className="meaning">{current.english}</div>
              {current.partOfSpeech && <span className="pos">{current.partOfSpeech}</span>}
              {current.example && <p className="example">{current.example}</p>}
              {current.notes && <p className="notes">{current.notes}</p>}
            </article>
          </div>
        </div>
        {revealed && (
          <div className="grade-controls">
            <button className="btn danger" aria-label="Need review" onClick={() => grade("review")}>
              <RotateCcw size={19} /> Review
            </button>
            <button className="btn green" onClick={() => grade("know")}>
              <Check size={19} /> Know
            </button>
          </div>
        )}
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
      <section className="panel study-setup" style={{ marginTop: 18 }}>
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
