import { FeedHero } from "../components/feed-hero";
import { InfiniteFeed } from "../components/infinite-feed";
import { SkimModeSwitcher } from "../components/skim-mode-switcher";
import { StickyScrollDashboard } from "../components/sticky-scroll-dashboard";
import { TopPapersSection } from "../components/top-papers-section";
import { WeeklyBriefingSection } from "../components/weekly-briefing-section";
import { loadFeedPage, loadTopics, loadWeeklyFeed, sortPapersByPublishedDesc } from "./feed-data";
import { TOPIC_MAP, type TopicId } from "@research-feed/shared";

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{ topic?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedTopic = resolvedSearchParams?.topic;
  const [topics, { items: papers, nextCursor: feedNextCursor }, weeklyRaw] = await Promise.all([
    loadTopics(),
    loadFeedPage(selectedTopic),
    loadWeeklyFeed(selectedTopic)
  ]);
  const weeklyPapers = sortPapersByPublishedDesc(weeklyRaw);

  const heroPapers = papers.slice(0, 3);
  const gridPapers = papers.slice(3);
  const heroEyebrow = selectedTopic
    ? TOPIC_MAP[selectedTopic as TopicId]?.label ?? "Featured"
    : "Latest highlights";

  return (
    <main className="min-h-screen bg-[#fffdf7] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto w-full max-w-7xl px-6 py-12">
        <StickyScrollDashboard
          eyebrow="The fastest way to stay current in your field"
          title="Skim what matters in biomechanics, digital health, and clinical AI"
          description="Read one-line takeaways, switch lens by role, and open the source only when a paper is truly worth your time."
          toolbar={
            <div className="flex w-full flex-col gap-4">
              <SkimModeSwitcher />
              <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <a
                  href="/"
                  className={
                    !selectedTopic
                      ? "shrink-0 rounded-sm border border-amber-700 bg-amber-600 px-4 py-2 text-sm font-semibold text-white dark:border-amber-600 dark:bg-amber-700"
                      : "shrink-0 rounded-sm border border-amber-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-amber-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
                  }
                >
                  All topics
                </a>
                {topics.map((topic) => (
                  <a
                    key={topic.id}
                    href={`/?topic=${topic.id}`}
                    className={
                      selectedTopic === topic.id
                        ? "shrink-0 rounded-sm border border-amber-700 bg-amber-600 px-4 py-2 text-sm font-semibold text-white dark:border-amber-600 dark:bg-amber-700"
                        : "shrink-0 rounded-sm border border-amber-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-amber-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
                    }
                  >
                    {topic.label}
                  </a>
                ))}
              </div>
            </div>
          }
        />

        {heroPapers.length > 0 ? <FeedHero papers={heroPapers} eyebrow={heroEyebrow} /> : null}

        <WeeklyBriefingSection papers={weeklyPapers} />
        <TopPapersSection papers={weeklyPapers} />

        <section className="mb-6" aria-labelledby="feed-more-heading">
          <h2 id="feed-more-heading" className="font-serif text-xl font-semibold md:text-2xl">
            More from your feed
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Skim the rest of the queue — same topics and modes as above.
          </p>
        </section>

        <InfiniteFeed initialPapers={gridPapers} initialNextCursor={feedNextCursor} topic={selectedTopic} />
      </div>
    </main>
  );
}
