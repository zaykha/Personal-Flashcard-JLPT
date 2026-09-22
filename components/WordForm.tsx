"use client";
import { useState } from "react";
import { JLPT_LEVELS, type Word, type WordInput } from "@/types";
import { CustomSelect } from "./CustomSelect";
const blank: WordInput = {
  level: "N5",
  day: 1,
  kanji: "",
  reading: "",
  english: "",
  partOfSpeech: "",
  example: "",
  notes: "",
};
export function WordForm({
  word,
  onSave,
  onCancel,
}: {
  word?: Word | null;
  onSave: (value: WordInput, id?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<WordInput>(() =>
    word
      ? {
          level: word.level,
          day: word.day,
          kanji: word.kanji,
          reading: word.reading,
          english: word.english,
          partOfSpeech: word.partOfSpeech,
          example: word.example,
          notes: word.notes,
        }
      : blank,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = (key: keyof WordInput, value: string | number) =>
    setForm((v) => ({ ...v, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.kanji.trim() ||
      !form.reading.trim() ||
      !form.english.trim() ||
      form.day < 1
    ) {
      setError("Level, day, kanji, reading, and English are required.");
      return;
    }
    try {
      setBusy(true);
      await onSave(form, word?.id);
      onCancel();
    } catch {
      setError("Could not save this word. Please check your connection.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="fields">
        <div className="field">
          <label>JLPT level *</label>
          <CustomSelect
            ariaLabel="JLPT level"
            value={form.level}
            options={JLPT_LEVELS.map((level) => ({
              value: level,
              label: level,
            }))}
            onChange={(value) => field("level", value)}
          />
        </div>
        <div className="field">
          <label>Day *</label>
          <input
            type="number"
            min="1"
            value={form.day}
            onChange={(e) => field("day", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Kanji *</label>
          <input
            value={form.kanji}
            onChange={(e) => field("kanji", e.target.value)}
            placeholder="意外"
          />
        </div>
        <div className="field">
          <label>Reading *</label>
          <input
            value={form.reading}
            onChange={(e) => field("reading", e.target.value)}
            placeholder="いがい"
          />
        </div>
        <div className="field full">
          <label>English *</label>
          <input
            value={form.english}
            onChange={(e) => field("english", e.target.value)}
            placeholder="unexpected; surprising"
          />
        </div>
        <div className="field">
          <label>Part of speech</label>
          <input
            value={form.partOfSpeech}
            onChange={(e) => field("partOfSpeech", e.target.value)}
            placeholder="na-adjective"
          />
        </div>
        <div className="field">
          <label>Notes</label>
          <input
            value={form.notes}
            onChange={(e) => field("notes", e.target.value)}
          />
        </div>
        <div className="field full">
          <label>Example sentence</label>
          <textarea
            value={form.example}
            onChange={(e) => field("example", e.target.value)}
            placeholder="意外に難しかった。"
          />
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn" disabled={busy}>
          {busy ? "Saving…" : word ? "Save changes" : "Add word"}
        </button>
      </div>
    </form>
  );
}
