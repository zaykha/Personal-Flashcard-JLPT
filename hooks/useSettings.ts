"use client";
import { useEffect, useState } from "react";
import type { StudySettings } from "@/types";
export type Theme = "light" | "dark" | "system";
export function useSettings() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [study, setStudyState] = useState<StudySettings>({
    direction: "mixed",
    shuffle: true,
  });
  useEffect(() => {
    setThemeState((localStorage.getItem("theme") as Theme) || "system");
    const saved = localStorage.getItem("study-settings");
    if (saved) setStudyState(JSON.parse(saved));
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const dark =
      theme === "dark" ||
      (theme === "system" &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  }, [theme]);
  const setTheme = (v: Theme) => {
    setThemeState(v);
    localStorage.setItem("theme", v);
  };
  const setStudy = (v: StudySettings) => {
    setStudyState(v);
    localStorage.setItem("study-settings", JSON.stringify(v));
  };
  return { theme, setTheme, study, setStudy };
}
