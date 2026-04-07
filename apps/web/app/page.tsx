import { FeedCard } from "../components/feed-card";
import { loadFeed, loadTopics } from "./feed-data";

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{ topic?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedTopic = resolvedSearchParams?.topic;
  const [topics, papers] = await Promise.all([loadTopics(), loadFeed(selectedTopic)]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-12">
      <section className="mb-10 flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-sky-200/70">Scientific Research Feed</p>
          <h1 className="mb-4 text-5xl font-semibold tracking-tight text-white">
            Scroll the newest research in biomechanics, digital health, and clinical AI.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            A clean publication-style feed that surfaces newly indexed papers, compresses them into readable summaries,
            and sends readers straight to PubMed or the journal page for the full source.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className={`rounded-full px-4 py-2 text-sm transition ${
              !selectedTopic ? "bg-sky-300 text-slate-950" : "border border-white/10 text-slate-200"
            }`}
          >
            All topics
          </a>
          {topics.map((topic) => (
            <a
              key={topic.id}
              href={`/?topic=${topic.id}`}
              className={`rounded-full px-4 py-2 text-sm transition ${
                selectedTopic === topic.id ? "bg-sky-300 text-slate-950" : "border border-white/10 text-slate-200"
              }`}
            >
              {topic.label}
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {papers.map((paper) => (
          <FeedCard key={paper.id} paper={paper} />
        ))}
      </section>
    </main>
  );
}
