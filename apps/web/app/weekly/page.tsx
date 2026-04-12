import Link from "next/link";
import { FeedCard } from "../../components/feed-card";
import { SkimModeSwitcher } from "../../components/skim-mode-switcher";
import { StickyScrollDashboard } from "../../components/sticky-scroll-dashboard";
import { TopPapersSection } from "../../components/top-papers-section";
import { WeeklyBriefingSection } from "../../components/weekly-briefing-section";
import { loadWeeklyFeed, sortPapersByPublishedDesc } from "../feed-data";

export default async function WeeklyPage() {
  const raw = await loadWeeklyFeed();
  const papers = sortPapersByPublishedDesc(raw);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-[#fffdf7] px-6 py-12 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <StickyScrollDashboard
        eyebrow="This week"
        title="Papers indexed in the last seven days"
        description="A tighter window on what landed recently, with a skimmable lens for clinicians, researchers, founders, and students."
        toolbar={<SkimModeSwitcher />}
      />

      <WeeklyBriefingSection papers={papers} variant="weeklyPage" onWeeklyPage />

      <TopPapersSection papers={papers} className="mb-10" />

      <section id="all-papers-this-week" className="scroll-mt-8" aria-labelledby="weekly-all-heading">
        <h2 id="weekly-all-heading" className="font-serif text-xl font-semibold md:text-2xl">
          All papers this week
        </h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Every paper in the weekly window, in a browsable grid.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {papers.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-stone-500 dark:text-stone-400">No papers in this window yet.</p>
              <Link
                href="/"
                className="rounded-sm border border-amber-700 bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700"
              >
                Explore the full feed
              </Link>
            </div>
          ) : (
            papers.map((paper) => <FeedCard key={paper.id} paper={paper} />)
          )}
        </div>
      </section>
    </main>
  );
}
