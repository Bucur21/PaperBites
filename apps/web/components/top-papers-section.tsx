import Link from "next/link";
import { inferPeerReviewDisplay, sanitizeDisplayText, studyDesignLabel, TOPIC_MAP } from "@research-feed/shared";
import type { PaperRecord, TopicId } from "@research-feed/shared";

function formatYear(value: string): string {
  return String(new Date(value).getFullYear());
}

function primaryTopicLabel(paper: PaperRecord): string {
  const id = paper.topicIds[0];
  if (!id) return "";
  return TOPIC_MAP[id as TopicId]?.label ?? "";
}

export function TopPapersSection({
  papers,
  limit = 5,
  className = "mb-12"
}: {
  papers: PaperRecord[];
  limit?: number;
  className?: string;
}) {
  const sorted = [...papers].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const top = sorted.slice(0, limit);

  if (top.length === 0) {
    return null;
  }

  return (
    <section className={className} aria-labelledby="top-papers-heading">
      <h2 id="top-papers-heading" className="font-serif text-xl font-semibold md:text-2xl">
        Top papers this week
      </h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        Newest in the weekly window — journal, year, design, and topic at a glance.
      </p>
      <ol className="mt-6 divide-y divide-amber-200/70 dark:divide-stone-700">
        {top.map((paper, index) => {
          const design = studyDesignLabel(paper.studyDesign);
          const topic = primaryTopicLabel(paper);
          const metaParts = [
            sanitizeDisplayText(paper.journal),
            formatYear(paper.publishedAt),
            design,
            topic
          ].filter(Boolean);
          const peer = inferPeerReviewDisplay(paper.articleType);
          const cite =
            paper.citedByCount != null
              ? `${paper.citedByCount.toLocaleString()} cites`
              : paper.doiUrl
                ? "Cites n/a"
                : "No DOI";

          return (
            <li key={paper.id} className="flex gap-4 py-4 first:pt-0">
              <span className="w-8 shrink-0 pt-0.5 text-sm font-semibold text-amber-700 dark:text-amber-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/papers/${encodeURIComponent(paper.slug)}`}
                  className="block font-medium text-stone-900 hover:text-amber-800 dark:text-stone-100 dark:hover:text-amber-400"
                >
                  {sanitizeDisplayText(paper.title)}
                </Link>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {metaParts.map((part, i) => (
                    <span key={i}>
                      {i > 0 ? " · " : null}
                      <span className={i === 0 ? "text-stone-700 dark:text-stone-300" : undefined}>{part}</span>
                    </span>
                  ))}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
                  <span title={paper.articleType}>{peer.label}</span>
                  <span className="text-stone-400 dark:text-stone-600"> · </span>
                  <span title="Cited-by (OpenAlex when indexed)">{cite}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
