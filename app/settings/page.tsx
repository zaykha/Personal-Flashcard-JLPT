"use client";
import { useState } from "react";
import { utils, writeFile } from "xlsx";
import { Download, LogOut, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CustomSelect } from "@/components/CustomSelect";
import { useAuth } from "@/hooks/useAuth";
import { useWords } from "@/hooks/useWords";
import { useSettings, type Theme } from "@/hooks/useSettings";
import type { StudyDirection } from "@/types";
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { words, deleteAll } = useWords();
  const { theme, setTheme, study, setStudy } = useSettings();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const exportRows = () =>
    words.map(
      ({
        level,
        day,
        kanji,
        reading,
        english,
        partOfSpeech,
        example,
        notes,
        difficult,
        suspended,
        learningStatus,
        reviewIntervalDays,
        reviewCount,
        failedReviewCount,
      }) => ({
        level,
        day,
        kanji,
        reading,
        english,
        partOfSpeech,
        example,
        notes,
        difficult,
        suspended,
        learningStatus,
        reviewIntervalDays,
        reviewCount,
        failedReviewCount,
      }),
    );
  function exportFile(kind: "csv" | "xlsx") {
    const sheet = utils.json_to_sheet(exportRows());
    if (kind === "xlsx")
      writeFile(
        { SheetNames: ["Vocabulary"], Sheets: { Vocabulary: sheet } },
        "kotoba-vocabulary.xlsx",
      );
    else {
      const blob = new Blob([utils.sheet_to_csv(sheet)], {
        type: "text/csv;charset=utf-8",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "kotoba-vocabulary.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }
  async function removeAll() {
    if (confirmText !== "DELETE ALL") return;
    setDeleting(true);
    try {
      await deleteAll();
      setConfirmText("");
    } finally {
      setDeleting(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Make Kotoba feel like your study space."
      />
      <div className="settings-grid">
        <section className="panel">
          <h2>Account</h2>
          <div className="setting-row">
            <div>
              <b>{user?.displayName || "Google account"}</b>
              <p>{user?.email}</p>
            </div>
            <button className="btn secondary" onClick={logout}>
              <LogOut size={17} /> Log out
            </button>
          </div>
        </section>
        <section className="panel">
          <h2>Study</h2>
          <div className="setting-row">
            <div>
              <b>Default direction</b>
              <p>Used when starting a new session.</p>
            </div>
            <CustomSelect
              ariaLabel="Default study direction"
              className="settings-select"
              value={study.direction}
              options={[
                { value: "kanji", label: "Kanji → English" },
                { value: "english", label: "English → Japanese" },
                { value: "mixed", label: "Mixed" },
              ]}
              onChange={(value) =>
                setStudy({
                  ...study,
                  direction: value as StudyDirection,
                })
              }
            />
          </div>
          <div className="setting-row">
            <div>
              <b>Shuffle by default</b>
              <p>Prevents memorizing the list order.</p>
            </div>
            <button
              className="btn secondary"
              onClick={() => setStudy({ ...study, shuffle: !study.shuffle })}
            >
              {study.shuffle ? "On" : "Off"}
            </button>
          </div>
        </section>
        <section className="panel">
          <h2>Appearance</h2>
          <div className="setting-row">
            <div>
              <b>Theme</b>
              <p>Choose a calm light or dark palette.</p>
            </div>
            <div className="segmented">
              {(["light", "dark", "system"] as Theme[]).map((t) => (
                <button
                  key={t}
                  className={theme === t ? "active" : ""}
                  onClick={() => setTheme(t)}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>Your data</h2>
          <div className="setting-row">
            <div>
              <b>Export vocabulary</b>
              <p>Download {words.length} words and their study counts.</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn secondary"
                onClick={() => exportFile("csv")}
              >
                <Download size={16} /> CSV
              </button>
              <button
                className="btn secondary"
                onClick={() => exportFile("xlsx")}
              >
                <Download size={16} /> XLSX
              </button>
            </div>
          </div>
        </section>
        <section
          className="panel"
          style={{
            borderColor: "color-mix(in srgb,var(--red) 45%,var(--line))",
          }}
        >
          <h2 style={{ color: "var(--red)" }}>Danger zone</h2>
          <p className="hint">
            Permanently delete all vocabulary and study history. Type{" "}
            <b>DELETE ALL</b> to confirm.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              className="search-input"
              style={{ flex: 1 }}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE ALL"
            />
            <button
              className="btn danger"
              disabled={confirmText !== "DELETE ALL" || deleting}
              onClick={removeAll}
            >
              <Trash2 size={17} />
              {deleting ? "Deleting…" : "Delete all vocabulary"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
