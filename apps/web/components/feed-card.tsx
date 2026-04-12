"use client";

import Link from "next/link";
import {
  sanitizeDisplayText,
  TOPIC_MAP,
  getClinicalImpact,
  getModeLens,
  getTakeaway,
  getTopicColor,
  studyDesignLabel,
  evidenceLevel
} from "@research-feed/shared";
import type { PaperRecord } from "@research-feed/shared";
import { BookmarkButton } from "./bookmark-button";
import { ClinicalArticleImage } from "./clinical-article-image";
import { LikeButton } from "./like-button";
import { PaperEvidenceMeta } from "./paper-evidence-meta";
import { useSkimMode } from "../lib/skim-mode-context";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatAuthors(paper: PaperRecord): string {
  if (!paper.authors || paper.authors.length === 0) return "";
  if (paper.authors.length === 1) {
    const a = paper.authors[0];
    return `${a.family} ${a.given}`.trim();
  }
  if (paper.authors.length <= 3) {
    return paper.authors.map((a) => `${a.family} ${a.given}`.trim()).join(", ");
  }
  const first = paper.authors[0];
  return `${first.family} ${first.given} et al.`.trim();
}

function EvidenceBadge({ design }: { design: PaperRecord["studyDesign"] }) {
  if (!design || design === "other") return null;
  const level = evidenceLevel(design);
  const label = studyDesignLabel(design);

  const colors = {
    high: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    moderate: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    low: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700",
    unknown: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700"
  };

  return (
    <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors[level]}`}>
      {label}
    </span>
  );
}

export function FeedCard({
  paper,
  shelfHint
}: {
  paper: PaperRecord;
  /** Library / detail: show a small shelf label (e.g. continue reading). */
  shelfHint?: "continue";
}) {
  const { mode } = useSkimMode();
  const title = sanitizeDisplayText(paper.title);
  const summary = sanitizeDisplayText(paper.shortSummary);
  const takeaway = sanitizeDisplayText(getTakeaway(paper));
  const lens = getModeLens(mode, paper);
  const journal = sanitizeDisplayText(paper.journal);
  const authors = formatAuthors(paper);
  const clinicalImpact = sanitizeDisplayText(getClinicalImpact(paper));

  return (
    <article className="flex flex-col overflow-hidden border border-amber-200/80 bg-white shadow-sm transition hover:border-amber-300/90 hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600">
      <Link href={`/papers/${encodeURIComponent(paper.slug)}`} className="block shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
        <ClinicalArticleImage
          seed={paper.id}
          topicIds={paper.topicIds}
          title={title}
          summary={summary}
        />
      </Link>
      <div className="border-b border-amber-100/90 px-5 pb-3 pt-4 dark:border-stone-700">
        <div className="mb-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
          {shelfHint === "continue" ? (
            <span className="rounded-sm border border-amber-600 bg-amber-600 px-2 py-0.5 text-white dark:border-amber-500 dark:bg-amber-700">
              Continue
            </span>
          ) : null}
          {paper.topicIds.map((topicId) => {
            const color = getTopicColor(topicId);
            return (
              <span key={topicId} className={`rounded-sm border px-2 py-0.5 ${color.chip} ${color.chipText}`}>
                {TOPIC_MAP[topicId]?.label ?? topicId}
              </span>
            );
          })}
          <EvidenceBadge design={paper.studyDesign} />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span className="line-clamp-1 font-medium">{journal}</span>
          <span className="shrink-0 text-stone-400 dark:text-stone-500">{formatDate(paper.publishedAt)}</span>
        </div>
        <div className="mt-2">
          <PaperEvidenceMeta paper={paper} size="compact" />
        </div>
        {authors ? (
          <p className="mt-1 line-clamp-1 text-xs text-stone-400 dark:text-stone-500">{authors}</p>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-5 pb-6 pt-4">
        <h2 className="mb-3 font-serif text-lg font-semibold leading-snug text-stone-900 dark:text-stone-100">{title}</h2>
        <div className="mb-5 flex-1 space-y-3">
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-900/10">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400">
              One-line takeaway
            </p>
            <p className="line-clamp-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{takeaway}</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">
              {lens.label}
            </p>
            <p className="line-clamp-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {sanitizeDisplayText(lens.text || clinicalImpact || summary)}
            </p>
          </div>
        </div>
        <div className="mb-5 flex flex-wrap gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span>{paper.openAccess ? "Open access" : "Publisher source"}</span>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/papers/${encodeURIComponent(paper.slug)}`}
              className="rounded-sm border border-amber-700 bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700 dark:hover:bg-amber-600"
            >
              {shelfHint === "continue" ? "Continue reading" : "Read summary"}
            </Link>
            <a
              href={paper.doiUrl ?? paper.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm border border-amber-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-900 transition hover:border-amber-400 hover:bg-amber-50 dark:border-stone-600 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-stone-800"
            >
              Open source
            </a>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <BookmarkButton paperId={paper.id} />
            <LikeButton paperId={paper.id} />
          </div>
        </div>
      </div>
    </article>
  );
}
