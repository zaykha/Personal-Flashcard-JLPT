"use client";
import { useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { read, utils } from "xlsx";
import { useAuth } from "@/hooks/useAuth";
import { useWords } from "@/hooks/useWords";
import { JLPT_LEVELS, type JLPTLevel, type WordInput } from "@/types";

type ParsedRow = { row: number; data?: WordInput; errors: string[]; raw: Record<string, unknown> };
const normalize = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase().replace(/[ _-]/g, ""), value]));
function parseRows(rows: Record<string, unknown>[]): ParsedRow[] {
  return rows.map((raw, index) => {
    const row = normalize(raw); const errors: string[] = [];
    const level = String(row.level ?? "").trim().toUpperCase(); const day = Number(row.day);
    const kanji = String(row.kanji ?? "").trim(); const reading = String(row.reading ?? "").trim(); const english = String(row.english ?? "").trim();
    if (!JLPT_LEVELS.includes(level as JLPTLevel)) errors.push("Level must be N5–N1");
    if (!Number.isInteger(day) || day < 1) errors.push("Day must be a positive number");
    if (!kanji) errors.push("Kanji is required"); if (!reading) errors.push("Reading is required"); if (!english) errors.push("English is required");
    return { row: index + 2, raw, errors, data: errors.length ? undefined : { level: level as JLPTLevel, day, kanji, reading, english, partOfSpeech: String(row.partofspeech ?? "").trim(), example: String(row.example ?? "").trim(), notes: String(row.notes ?? "").trim() } };
  });
}

export function ImportPanel() {
  const { isAdmin } = useAuth(); const { importWords } = useWords(); const input = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]); const [fileName, setFileName] = useState(""); const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(0); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  if (!isAdmin) return null;
  async function load(file?: File) {
    if (!file) return; setError(""); setMessage("");
    if (!/\.(csv|xlsx)$/i.test(file.name)) { setError("Choose a .csv or .xlsx file."); return; }
    try { const workbook = read(await file.arrayBuffer(), { type: "array" }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }); if (!rows.length) throw new Error("Empty file"); setParsed(parseRows(rows)); setFileName(file.name); }
    catch { setError("This file could not be read. Check that it is a valid CSV or Excel workbook with a header row."); }
  }
  const valid = parsed.flatMap((row) => row.data ? [row.data] : []);
  async function confirmImport() {
    try { setBusy(true); setProgress(0); await importWords(valid, setProgress); setMessage(`${valid.length} official words published. Existing user progress was preserved.`); setParsed([]); setFileName(""); }
    catch { setError("The import could not be published. Check your connection and administrator permissions."); }
    finally { setBusy(false); }
  }
  return <section className="panel"><p className="eyebrow">Administrator only</p><h2>Import official lessons</h2><p className="hint">Imported words become available to every signed-in user. Files are parsed locally before the official catalog is updated.</p>
    <div className={`dropzone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); load(event.dataTransfer.files[0]); }}><UploadCloud size={36}/><h3>Drop an official vocabulary file here</h3><p className="hint">.csv or .xlsx · Required: level, day, kanji, reading, english</p><button type="button" className="btn secondary" onClick={() => input.current?.click()}>Choose a file</button><input ref={input} type="file" accept=".csv,.xlsx" onChange={(event) => load(event.target.files?.[0])}/></div>
    {error && <p className="error">{error}</p>}{message && <p className="pill good">✓ {message}</p>}
    {parsed.length > 0 && <><div className="preview-summary"><span className="pill"><FileSpreadsheet size={14}/> {fileName}</span><span className="pill good">✓ {valid.length} valid</span><span className="pill bad">{parsed.length - valid.length} invalid</span></div><div className="table-wrap"><table><thead><tr><th>Row</th><th>Level</th><th>Day</th><th>Kanji</th><th>Reading</th><th>English</th><th>Validation</th></tr></thead><tbody>{parsed.slice(0, 100).map((row) => { const raw = normalize(row.raw); return <tr key={row.row} className={row.errors.length ? "invalid-row" : ""}><td>{row.row}</td><td>{row.data?.level ?? String(raw.level ?? "")}</td><td>{row.data?.day ?? String(raw.day ?? "")}</td><td>{row.data?.kanji ?? String(raw.kanji ?? "")}</td><td>{row.data?.reading ?? String(raw.reading ?? "")}</td><td>{row.data?.english ?? String(raw.english ?? "")}</td><td>{row.errors.join(" · ") || "Ready"}</td></tr>; })}</tbody></table></div>
      {busy && <div style={{ marginTop: 16 }}><div className="progress"><div style={{ width: `${valid.length ? (progress / valid.length) * 100 : 0}%` }}/></div><p className="hint">Publishing {progress} of {valid.length}…</p></div>}
      <div className="form-actions"><button className="btn secondary" disabled={busy} onClick={() => setParsed([])}>Cancel</button><button className="btn" disabled={busy || !valid.length} onClick={confirmImport}>{busy ? "Publishing…" : `Publish ${valid.length} words`}</button></div></>}
    <div className="section-title"><h3>Expected columns</h3><a href="/sample-vocabulary.csv" download className="btn secondary">Download sample CSV</a></div><p className="hint">Optional columns: partOfSpeech, example, notes. Re-importing the same level, day, kanji, and reading updates lesson content without changing any user&apos;s study progress.</p>
  </section>;
}
