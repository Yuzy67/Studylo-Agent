import { useState, useEffect } from "react";

export type ResponseStyle = "concise" | "balanced" | "detailed";
export type DefaultMode = "study" | "research" | "dev-tools" | "vibe-coder" | "notes";
export type AccentColor = "purple" | "blue" | "green" | "orange";
export type StudyLevel = "middle-school" | "high-school" | "university" | "self-learner" | "developer" | "researcher";

export interface UserSettings {
  name: string;
  studyLevel: StudyLevel;
  defaultMode: DefaultMode;
  responseStyle: ResponseStyle;
  accentColor: AccentColor;
  showWebBadge: boolean;
  dailyGoalMinutes: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  name: "",
  studyLevel: "high-school",
  defaultMode: "study",
  responseStyle: "detailed",
  accentColor: "purple",
  showWebBadge: true,
  dailyGoalMinutes: 60,
};

const STORAGE_KEY = "studylo_settings";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return { settings, updateSettings, resetSettings };
}

export function getInitials(name: string): string {
  if (!name.trim()) return "S";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
