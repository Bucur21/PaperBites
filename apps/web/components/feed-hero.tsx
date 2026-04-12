"use client";

import Link from "next/link";
import { estimateReadMinutes, getModeLens, getTakeaway, sanitizeDisplayText } from "@research-feed/shared";
import type { PaperRecord } from "@research-feed/shared";
import { ClinicalArticleImage } from "./clinical-article-image";
import { PaperEvidenceMeta } from "./paper-evidence-meta";
import { useSkimMode } from "../lib/skim-mode-context";

export function FeedHero({ papers, eyebrow }: { papers: PaperRecord[]; eyebrow: string }) {
  const { mode } = useSkimMode();

  if (papers.length === 0) {
    return null;
  }

  return (
    <section className="glass-dashboard mb-12 overflow-hidden rounded-2xl">
      <div className="grid divide-y divide-amber-200/80 md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-amber-200/80 dark:divide-stone-700">
        {papers.map((paper) => {
          const title = sanitizeDisplayText(paper.title);
          const summary = sanitizeDisplayText(paper.shortSummary);
          const takeaway = sanitizeDisplayText(getTakeaway(paper));
          const lens = sanitizeDisplayText(getModeLens(mode, paper).text);
          const minutes = estimateReadMinutes(`${title} ${takeaway}`);

          return (
            <article key={paper.id} className="flex flex-col">
              <Link href={`/papers/${encodeURIComponent(paper.slug)}`} className="group flex flex-1 flex-col">
                <ClinicalArticleImage
                  seed={paper.id}
                  topicIds={paper.topicIds}
                  title={title}
                  summary={summary}
                />
                <div className="flex flex-1 flex-col px-5 pb-6 pt-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">{eyebrow}</p>
                  <h2 className="mb-3 font-serif text-xl font-semibold leading-snug tracking-tight text-stone-900 transition group-hover:text-amber-900 dark:text-stone-100 dark:group-hover:text-amber-400">
                    {title}
                  </h2>
                  <p className="mb-2 line-clamp-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{takeaway}</p>
                  <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{lens}</p>
                  <div className="mt-auto space-y-2">
                    <PaperEvidenceMeta paper={paper} size="compact" />
                    <p className="text-xs font-medium text-stone-400 dark:text-stone-500">{minutes} min read</p>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
