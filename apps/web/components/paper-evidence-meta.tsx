"use client";

import { inferPeerReviewDisplay } from "@research-feed/shared";
import type { PaperRecord } from "@research-feed/shared";

const peerStyles: Record<"likely" | "unlikely" | "unknown", string> = {
  likely:
    "border-emerald-200/80 bg-emerald-100/90 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200",
  unlikely:
    "border-amber-200/80 bg-amber-100/90 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  unknown: "border-stone-200/80 bg-stone-100/90 text-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400"
};

function citationLabel(paper: PaperRecord): { text: string; title: string } {
  const n = paper.citedByCount;
  if (n !== undefined && n !== null) {
    return {
      text: `${n.toLocaleString()} citations`,
      title: "Cited-by count (OpenAlex index, when the DOI is indexed)"
    };
  }
  if (paper.doiUrl) {
    return {
      text: "Citations n/a",
      title: "No citation count returned for this DOI in OpenAlex yet"
    };
  }
  return {
    text: "No DOI",
    title: "Citation counts are resolved from DOIs when available"
  };
}

export function PaperEvidenceMeta({
  paper,
  size = "default"
}: {
  paper: PaperRecord;
  size?: "default" | "compact";
}) {
  const peer = inferPeerReviewDisplay(paper.articleType);
  const cite = citationLabel(paper);
  const textSize = size === "compact" ? "text-[10px]" : "text-xs";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${textSize}`}>
      <span
        title={paper.articleType}
        className={`rounded-sm border px-2 py-0.5 font-semibold uppercase tracking-wide ${peerStyles[peer.variant]}`}
      >
        {peer.label}
      </span>
      <span className="font-medium text-stone-600 dark:text-stone-400" title={cite.title}>
        {cite.text}
      </span>
    </div>
  );
}
