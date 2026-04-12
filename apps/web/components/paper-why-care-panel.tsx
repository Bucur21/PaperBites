"use client";

import {
  getClinicalImpact,
  getMethodQuality,
  getModeLens,
  getTakeaway,
  getWhoItsFor,
  type PaperRecord
} from "@research-feed/shared";
import { SkimModeSwitcher } from "./skim-mode-switcher";
import { useSkimMode } from "../lib/skim-mode-context";

export function PaperWhyCarePanel({ paper }: { paper: PaperRecord }) {
  const { mode } = useSkimMode();
  const lens = getModeLens(mode, paper);

  return (
    <section className="mb-8 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-teal-50/60 p-6 dark:border-stone-700 dark:from-stone-900 dark:to-teal-950/20">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-400">
            Why should I care?
          </p>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            The fastest way to stay current in your field
          </h2>
        </div>
        <SkimModeSwitcher />
      </div>

      <div className="mb-6 rounded-xl border border-amber-200/80 bg-white/80 p-4 dark:border-stone-700 dark:bg-stone-900/60">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">
          Current lens: {lens.label}
        </p>
        <p className="text-base leading-7 text-stone-800 dark:text-stone-200">{lens.text}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InsightCard label="One-line takeaway" text={getTakeaway(paper)} accent="amber" />
        <InsightCard label="Clinical impact" text={getClinicalImpact(paper)} accent="teal" />
        <InsightCard label="Method quality" text={getMethodQuality(paper)} accent="blue" />
        <InsightCard label="Who this is for" text={getWhoItsFor(paper)} accent="stone" />
      </div>
    </section>
  );
}

function InsightCard({
  label,
  text,
  accent
}: {
  label: string;
  text: string;
  accent: "amber" | "teal" | "blue" | "stone";
}) {
  const accents = {
    amber: "border-amber-100 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-900/10",
    teal: "border-teal-100 bg-teal-50/40 dark:border-teal-900/40 dark:bg-teal-900/10",
    blue: "border-blue-100 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-900/10",
    stone: "border-stone-200 bg-white/70 dark:border-stone-700 dark:bg-stone-900/50"
  };

  return (
    <div className={`rounded-xl border p-4 ${accents[accent]}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">{label}</p>
      <p className="text-sm leading-7 text-stone-700 dark:text-stone-300">{text}</p>
    </div>
  );
}
