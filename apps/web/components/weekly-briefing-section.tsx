import Link from "next/link";
import {
  estimateReadMinutes,
  inferPeerReviewDisplay,
  sanitizeDisplayText
} from "@research-feed/shared";
import type { PaperRecord } from "@research-feed/shared";

function readMinutesForPaper(paper: PaperRecord): number {
  const title = sanitizeDisplayText(paper.title);
  const summary = sanitizeDisplayText(paper.shortSummary);
  return estimateReadMinutes(`${title} ${summary}`);
}

function totalReadMinutes(papers: PaperRecord[]): number {
  return papers.reduce((sum, p) => sum + readMinutesForPaper(p), 0);
}

export function WeeklyBriefingSection({
  papers,
  variant = "default",
  onWeeklyPage = false
}: {
  papers: PaperRecord[];
  /** On the dedicated weekly page, use compact top spacing. */
  variant?: "default" | "weeklyPage";
  /** Hide “Read full week” when already on `/weekly`. */
  onWeeklyPage?: boolean;
}) {
  const sorted = [...papers].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const lead = sorted[0];
  const teasers = sorted.slice(1, 3);
  const count = sorted.length;
  const totalMin = totalReadMinutes(sorted);

  const mb = variant === "weeklyPage" ? "mb-10" : "mb-12";

  if (!lead) {
    return (
      <section className={mb} aria-labelledby="weekly-briefing-heading">
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-white/70 p-6 dark:border-stone-700 dark:bg-stone-900/60 md:p-8">
          <h2 id="weekly-briefing-heading" className="font-serif text-xl font-semibold md:text-2xl">
            Weekly briefing
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            No papers indexed in the last seven days for this view yet.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-sm border border-amber-700 bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700"
          >
            Explore the full feed
          </Link>
        </div>
      </section>
    );
  }

  const leadSummary = sanitizeDisplayText(lead.shortSummary) || sanitizeDisplayText(lead.takeaway);
  const leadPeer = inferPeerReviewDisplay(lead.articleType);
  const leadCite =
    lead.citedByCount != null
      ? `${lead.citedByCount.toLocaleString()} citations`
      : lead.doiUrl
        ? "Citations n/a"
        : "No DOI";

  return (
    <section className={mb} aria-labelledby="weekly-briefing-heading">
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-white/70 p-6 dark:border-stone-700 dark:bg-stone-900/60 md:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-600/10"
          aria-hidden
        />
        <div className="relative">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 id="weekly-briefing-heading" className="font-serif text-xl font-semibold md:text-2xl">
                Weekly briefing
              </h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Papers indexed in the last seven days, distilled for a quick pass.
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-0">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950/80 dark:text-amber-200">
                {count} {count === 1 ? "paper" : "papers"}
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                ~{totalMin} min read
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Lead</p>
              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                <Link
                  href={`/papers/${encodeURIComponent(lead.slug)}`}
                  className="hover:text-amber-800 hover:underline dark:hover:text-amber-400"
                >
                  {sanitizeDisplayText(lead.title)}
                </Link>
              </p>
              {leadSummary ? (
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{leadSummary}</p>
              ) : null}
              <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">
                <span title={lead.articleType}>{leadPeer.label}</span>
                <span className="text-stone-400 dark:text-stone-600"> · </span>
                <span title="OpenAlex cited-by when indexed">{leadCite}</span>
              </p>
              {teasers.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-stone-600 dark:text-stone-400">
                  {teasers.map((p) => (
                    <li key={p.id} className="flex gap-2">
                      <span className="text-amber-600 dark:text-amber-500">+</span>
                      <Link href={`/papers/${encodeURIComponent(p.slug)}`} className="hover:text-amber-800 hover:underline dark:hover:text-amber-400">
                        {sanitizeDisplayText(p.title)}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col gap-2 md:items-end">
              {onWeeklyPage ? (
                <Link
                  href="#all-papers-this-week"
                  className="text-center text-xs font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-400 md:text-right"
                >
                  Jump to full list
                </Link>
              ) : (
                <>
                  <Link
                    href="/weekly"
                    className="inline-flex items-center justify-center rounded-sm border border-amber-700 bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700 dark:hover:bg-amber-600"
                  >
                    Read full week
                  </Link>
                  <span className="text-center text-xs text-stone-500 md:text-right">All papers from this window</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
