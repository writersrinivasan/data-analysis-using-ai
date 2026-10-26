"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Audience } from "@/lib/types";
import { DEFAULT_MODEL } from "@/lib/groq";

interface Settings {
  apiKey: string;
  model: string;
  audience: Audience;
  remember: boolean;
  models: string[];
  completed: number[];
  quiz: Record<string, boolean>;
}

interface Ctx extends Settings {
  setApiKey: (k: string, remember: boolean) => void;
  clearKey: () => void;
  setModel: (m: string) => void;
  setModels: (m: string[]) => void;
  setAudience: (a: Audience) => void;
  toggleComplete: (id: number) => void;
  recordQuiz: (key: string, correct: boolean) => void;
  settingsOpen: boolean;
  openSettings: (open?: boolean) => void;
  aiHeaders: () => Record<string, string>;
}

const SettingsContext = createContext<Ctx | null>(null);

const LS = "dataai.settings.v1";
const SS_KEY = "dataai.key.session";

function load<T>(storage: () => Storage, key: string): T | null {
  try {
    const v = storage().getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function save(storage: () => Storage, key: string, value: unknown) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: settings live in memory only */
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Settings>({ apiKey: "", model: DEFAULT_MODEL, audience: "intermediate", remember: false, models: [], completed: [], quiz: {} });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = load<Partial<Settings>>(() => localStorage, LS) ?? {};
    const sessionKey = load<string>(() => sessionStorage, SS_KEY);
    setS((prev) => ({ ...prev, ...stored, apiKey: stored.remember ? stored.apiKey ?? "" : sessionKey ?? "" }));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const { apiKey, ...rest } = s;
    save(() => localStorage, LS, s.remember ? s : { ...rest, apiKey: "" });
    save(() => sessionStorage, SS_KEY, s.remember ? null : apiKey || null);
  }, [s, loaded]);

  const setApiKey = useCallback((k: string, remember: boolean) => setS((p) => ({ ...p, apiKey: k.trim(), remember })), []);
  const clearKey = useCallback(() => setS((p) => ({ ...p, apiKey: "", models: [] })), []);
  const setModel = useCallback((model: string) => setS((p) => ({ ...p, model })), []);
  const setModels = useCallback((models: string[]) => setS((p) => ({ ...p, models })), []);
  const setAudience = useCallback((audience: Audience) => setS((p) => ({ ...p, audience })), []);
  const toggleComplete = useCallback((id: number) => setS((p) => ({ ...p, completed: p.completed.includes(id) ? p.completed.filter((x) => x !== id) : [...p.completed, id] })), []);
  const recordQuiz = useCallback((key: string, correct: boolean) => setS((p) => ({ ...p, quiz: { ...p.quiz, [key]: correct } })), []);
  const openSettings = useCallback((open = true) => setSettingsOpen(open), []);
  const aiHeaders = useCallback((): Record<string, string> => ({ "Content-Type": "application/json", "x-groq-key": s.apiKey }), [s.apiKey]);

  const value = useMemo(
    () => ({ ...s, setApiKey, clearKey, setModel, setModels, setAudience, toggleComplete, recordQuiz, settingsOpen, openSettings, aiHeaders }),
    [s, setApiKey, clearKey, setModel, setModels, setAudience, toggleComplete, recordQuiz, settingsOpen, openSettings, aiHeaders],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <Providers>");
  return ctx;
}
