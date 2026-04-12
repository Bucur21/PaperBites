import Link from "next/link";
import { sanitizeDisplayText, TOPIC_MAP, getTopicColor, studyDesignLabel, evidenceLevel } from "@research-feed/shared";
import { loadPaper, loadRelatedPapers, tryPubMedIdFromPaperRouteParam } from "../../feed-data";
import { PaperWhyCarePanel } from "../../../components/paper-why-care-panel";
import { FeedCard } from "../../../components/feed-card";
import { PaperEvidenceMeta } from "../../../components/paper-evidence-meta";
import { PaperActions } from "@/app/papers/[slug]/paper-actions";
import { PaperReadingTracker } from "../../../components/paper-reading-tracker";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

function formatAuthors(paper: { authors?: Array<{ given: string; family: string }> }): string {
  if (!paper.authors || paper.authors.length === 0) return "";
  return paper.authors.map((a) => `${a.family} ${a.given}`.trim()).join(", ");
}

function generateCitation(paper: {
  title: string;
  journal: string;
  publishedAt: string;
  doiUrl: string | null;
  authors?: Array<{ given: string; family: string }>;
}): string {
  const year = new Date(paper.publishedAt).getFullYear();
  const authorStr = formatAuthors(paper) || "Unknown authors";
  const doi = paper.doiUrl ? ` ${paper.doiUrl}` : "";
  return `${authorStr} (${year}). ${paper.title}. ${paper.journal}.${doi}`;
}

export default async function PaperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = await loadPaper(slug);

  if (!paper) {
    const pmid = tryPubMedIdFromPaperRouteParam(slug);
    const pubmedUrl = pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null;

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col bg-[#fffdf7] px-6 py-12 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <Link href="/" className="mb-8 text-sm font-medium text-amber-800 transition hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-300">
          ← Back to feed
        </Link>

        <article className="glass-dashboard rounded-2xl p-8">
          <h1 className="mb-3 font-serif text-3xl font-semibold tracking-tight">Couldn't load this paper</h1>
          <p className="mb-8 text-base leading-relaxed text-stone-600 dark:text-stone-400">
            {pubmedUrl
              ? "The summary isn't available right now, but you can still open the PubMed record below."
              : "The summary isn't available right now. Use the back link to return to the feed."}
          </p>

          {pubmedUrl ? (
            <div className="border border-amber-100 bg-amber-50/40 p-6 dark:border-stone-700 dark:bg-stone-800/40">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-400">Source links</p>
              <a
                href={pubmedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-sm border border-amber-700 bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Open PubMed
              </a>
            </div>
          ) : null}
        </article>
      </main>
    );
  }

  const title = sanitizeDisplayText(paper.title);
  const journal = sanitizeDisplayText(paper.journal);
  const shortSummary = sanitizeDisplayText(paper.shortSummary);
  const longSummary = paper.longSummary ? sanitizeDisplayText(paper.longSummary) : null;
  const whyItMatters = paper.whyItMatters ? sanitizeDisplayText(paper.whyItMatters) : null;
  const authors = formatAuthors(paper);
  const citation = generateCitation({ ...paper, title, journal });
  const design = paper.studyDesign;
  const designLabel = studyDesignLabel(design);
  const level = evidenceLevel(design);

  const relatedPapers = await loadRelatedPapers(paper.id);

  const levelColors = {
    high: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    moderate: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    low: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700",
    unknown: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700"
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col bg-[#fffdf7] px-6 py-12 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <PaperReadingTracker paperId={paper.id} slug={paper.slug} />
      <PaperActions paperId={paper.id} citation={citation} title={title} />

      <article className="glass-dashboard rounded-2xl p-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
          {paper.topicIds.map((topicId) => {
            const color = getTopicColor(topicId);
            return (
              <Link
                key={topicId}
                href={`/?topic=${topicId}`}
                className={`rounded-sm border px-3 py-1 transition hover:opacity-80 ${color.chip} ${color.chipText}`}
              >
                {TOPIC_MAP[topicId]?.label ?? topicId}
              </Link>
            );
          })}
          {design && design !== "other" ? (
            <span className={`rounded-sm border px-3 py-1 ${levelColors[level]}`}>
              {designLabel}
            </span>
          ) : null}
        </div>

        <h1 className="mb-3 font-serif text-4xl font-semibold tracking-tight">{title}</h1>

        {authors ? (
          <p className="mb-2 text-sm text-stone-600 dark:text-stone-400">{authors}</p>
        ) : null}

        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          {journal} · {formatDate(paper.publishedAt)} · {paper.openAccess ? "Open access" : "External source"}
        </p>
        <div className="mb-6">
          <PaperEvidenceMeta paper={paper} />
          <p className="mt-2 text-xs leading-relaxed text-stone-500 dark:text-stone-500">
            Peer-review labels infer PubMed publication types; they are not a guarantee. Citation counts come from the
            OpenAlex index when your DOI is listed there.
          </p>
        </div>

        <div className="mb-8 border border-amber-100 bg-amber-50/40 p-6 dark:border-stone-700 dark:bg-stone-800/40">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-400">Short summary</p>
          <p className="text-lg leading-8 text-stone-800 dark:text-stone-200">{shortSummary}</p>
        </div>

        <PaperWhyCarePanel paper={paper} />

        <div className="mb-8 border border-amber-100 bg-amber-50/40 p-6 dark:border-stone-700 dark:bg-stone-800/40">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-400">Long summary</p>
          <p className="text-base leading-8 text-stone-700 dark:text-stone-300">
            {longSummary ?? "A longer summary will appear here once the enrichment worker has processed this paper."}
          </p>
        </div>

        {whyItMatters ? (
          <div className="mb-8 border border-teal-100 bg-teal-50/40 p-6 dark:border-teal-900 dark:bg-teal-900/20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-teal-700 dark:text-teal-400">Why it matters</p>
            <p className="text-base leading-8 text-teal-900 dark:text-teal-200">{whyItMatters}</p>
          </div>
        ) : null}

        <div className="border border-amber-100 bg-amber-50/40 p-6 dark:border-stone-700 dark:bg-stone-800/40">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-400">Source links</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={paper.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm border border-amber-700 bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700 dark:hover:bg-amber-600"
            >
              Open PubMed
            </a>
            {paper.doiUrl ? (
              <a
                href={paper.doiUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-sm border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-50 dark:border-stone-600 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-stone-800"
              >
                Open DOI
              </a>
            ) : null}
          </div>
        </div>
      </article>

      {relatedPapers.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-6 font-serif text-2xl font-semibold tracking-tight">
            More in {TOPIC_MAP[paper.topicIds[0]]?.label ?? "this topic"}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {relatedPapers.map((related) => (
              <FeedCard key={related.id} paper={related} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
