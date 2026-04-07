import Link from "next/link";
import { TOPIC_MAP } from "../../../packages/shared/src";
import type { PaperRecord } from "../../../packages/shared/src";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function FeedCard({ paper }: { paper: PaperRecord }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/20">
      <div className="mb-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-sky-200/80">
        {paper.topicIds.map((topicId) => (
          <span key={topicId} className="rounded-full border border-sky-300/20 px-3 py-1">
            {TOPIC_MAP[topicId]?.label ?? topicId}
          </span>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-slate-300">
        <span>{paper.journal}</span>
        <span>{formatDate(paper.publishedAt)}</span>
      </div>

      <h2 className="mb-3 text-2xl font-semibold text-white">{paper.title}</h2>
      <p className="mb-5 text-base leading-7 text-slate-300">{paper.shortSummary}</p>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <span>{paper.articleType}</span>
        <span>{paper.openAccess ? "Open access" : "Source link"}</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/papers/${paper.slug}`}
          className="rounded-full bg-sky-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-200"
        >
          Read summary
        </Link>
        <a
          href={paper.doiUrl ?? paper.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-sky-200/50"
        >
          Open source
        </a>
      </div>
    </article>
  );
}
