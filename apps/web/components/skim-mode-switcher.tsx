"use client";

import { SKIM_MODES } from "@research-feed/shared";
import { useSkimMode } from "../lib/skim-mode-context";

export function SkimModeSwitcher({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useSkimMode();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!compact ? (
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">
          Skim mode
        </span>
      ) : null}
      {SKIM_MODES.map((option) => {
        const active = option.id === mode;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id)}
            className={
              active
                ? "rounded-sm border border-amber-700 bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white dark:border-amber-600 dark:bg-amber-700"
                : "rounded-sm border border-amber-200 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-amber-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
