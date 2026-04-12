"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SkimMode } from "@research-feed/shared";

const STORAGE_KEY = "paperbites-skim-mode";

type SkimModeContextValue = {
  mode: SkimMode;
  setMode: (mode: SkimMode) => void;
};

const SkimModeContext = createContext<SkimModeContextValue | null>(null);

export function SkimModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SkimMode>("clinician");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "clinician" || stored === "researcher" || stored === "founder" || stored === "student") {
        setModeState(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode: (next: SkimMode) => {
        setModeState(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* ignore */
        }
      }
    }),
    [mode]
  );

  return <SkimModeContext.Provider value={value}>{children}</SkimModeContext.Provider>;
}

export function useSkimMode() {
  const ctx = useContext(SkimModeContext);
  if (!ctx) {
    throw new Error("useSkimMode must be used within SkimModeProvider");
  }
  return ctx;
}
