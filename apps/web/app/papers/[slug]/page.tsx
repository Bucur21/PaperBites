import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPIC_MAP } from "../../../../../packages/shared/src";
import { loadPaper } from "../../feed-data";

export default async function PaperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = await loadPaper(slug);

  if (!paper) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <Link href="/" className="mb-8 text-sm text-sky-200/80">
        Back to feed
      </Link>

      <article className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/20">
        <div className="mb-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-sky-200/80">
          {paper.topicIds.map((topicId) => (
            <span key={topicId} className="rounded-full border border-sky-300/20 px-3 py-1">
              {TOPIC_MAP[topicId]?.label ?? topicId}
            </span>
          ))}
        </div>

        <h1 className="mb-3 text-4xl font-semibold text-white">{paper.title}</h1>
        <p className="mb-6 text-sm uppercase tracking-[0.2em] text-slate-400">
          {paper.journal} • {paper.articleType} • {paper.openAccess ? "Open access" : "External source"}
        </p>

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-sky-200/70">Short summary</p>
          <p className="text-lg leading-8 text-slate-200">{paper.shortSummary}</p>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-sky-200/70">Long summary</p>
          <p className="text-base leading-8 text-slate-300">
            {paper.longSummary ?? "A longer summary will appear here once the enrichment worker has processed this paper."}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-sky-200/70">Source links</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={paper.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-sky-300 px-4 py-2 text-sm font-medium text-slate-950"
            >
              Open PubMed
            </a>
            {paper.doiUrl ? (
              <a
                href={paper.doiUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200"
              >
                Open DOI
              </a>
            ) : null}
          </div>
        </div>
      </article>
    </main>
  );
}
