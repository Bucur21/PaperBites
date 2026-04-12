"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedCard } from "../../components/feed-card";
import { SkimModeSwitcher } from "../../components/skim-mode-switcher";
import { SkeletonCard } from "../../components/skeleton-card";
import { StickyScrollDashboard } from "../../components/sticky-scroll-dashboard";
import { apiBaseUrl } from "../../lib/api-base";
import { useAuth } from "../../lib/auth-context";
import { useAuthNudge } from "../../lib/auth-nudge-context";
import type { PaperRecord, TopicDefinition, TopicId } from "@research-feed/shared";

const STORAGE_KEY = "paperbites-for-you-topics";

async function fetchMergedFeed(topicIds: TopicId[]): Promise<PaperRecord[]> {
  if (topicIds.length === 0) return [];

  const results = await Promise.all(
    topicIds.map(async (topic) => {
      const params = new URLSearchParams({ topic, limit: "30" });
      const response = await fetch(`${apiBaseUrl}/feed?${params.toString()}`);
      if (!response.ok) throw new Error("Feed request failed");
      const payload = (await response.json()) as { items: PaperRecord[] };
      return payload.items;
    })
  );

  const merged = new Map<string, PaperRecord>();
  for (const items of results) {
    for (const paper of items) {
      merged.set(paper.id, paper);
    }
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function ForYouClient({ topics }: { topics: TopicDefinition[] }) {
  const { user, loading: authLoading } = useAuth();
  const { tryNudge } = useAuthNudge();
  const validIds = useMemo(() => topics.map((t) => t.id), [topics]);
  const [selected, setSelected] = useState<TopicId[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      let cancelled = false;
      fetch(`${apiBaseUrl}/me/interests`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("interests"))))
        .then((data: { topicIds?: string[] }) => {
          if (cancelled) return;
          const raw = Array.isArray(data.topicIds) ? data.topicIds : [];
          setSelected(raw.filter((id): id is TopicId => typeof id === "string" && validIds.includes(id as TopicId)));
          setHydrated(true);
        })
        .catch(() => {
          if (!cancelled) setHydrated(true);
        });
      return () => {
        cancelled = true;
      };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setSelected(parsed.filter((id): id is TopicId => typeof id === "string" && validIds.includes(id as TopicId)));
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [authLoading, user, validIds]);

  const loadPapers = useCallback(async (ids: TopicId[]) => {
    if (ids.length === 0) {
      setPapers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await fetchMergedFeed(ids);
      setPapers(items);
    } catch {
      setError("Could not load your feed. Check that the API is running.");
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    loadPapers(selected);
  }, [hydrated, selected, loadPapers]);

  const toggle = (id: TopicId) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      if (!user && prev.length === 0 && next.length >= 1) {
        queueMicrotask(() => tryNudge("interests"));
      }
      if (user) {
        fetch(`${apiBaseUrl}/me/interests`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicIds: next })
        }).catch(() => {
          /* ignore */
        });
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };

  const description = user
    ? "Pick one or more research areas. Your choices are saved to your account."
    : "Pick one or more research areas. We merge and de-duplicate the latest papers so your queue stays in one place. Your choices are saved only in this browser.";

  const showAuthorHint =
    user &&
    (!user.hasPublications || (user.authorProfileUrls?.length ?? 0) === 0);

  return (
    <>
      <StickyScrollDashboard
        eyebrow="For you"
        title="Topics you follow"
        description={description}
        toolbar={
          <div className="flex w-full flex-col gap-4">
            <SkimModeSwitcher />
            <div className="flex flex-wrap gap-3">
              {topics.map((topic) => {
                const on = selected.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggle(topic.id)}
                    className={
                      on
                        ? "rounded-sm border border-amber-700 bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700"
                        : "rounded-sm border border-amber-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-amber-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
                    }
                  >
                    {topic.label}
                  </button>
                );
              })}
            </div>
          </div>
        }
      />

      {showAuthorHint ? (
        <section
          className="mb-8 rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/90 to-amber-50/40 p-5 dark:border-teal-900/50 dark:from-teal-950/30 dark:to-stone-900/40"
          aria-labelledby="author-discovery-heading"
        >
          <h2 id="author-discovery-heading" className="mb-2 font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
            Surface your own publications
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Add your public ORCID (or PubMed URLs) so PaperBites can list <strong className="font-medium text-stone-800 dark:text-stone-200">My papers</strong> next to
            your saves. Quick setup lives on your profile or in Library.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-sm border border-amber-700 bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700"
            >
              Open profile
            </Link>
            <Link
              href="/saved#author-profile-links"
              className="rounded-sm border border-teal-300 px-4 py-2 text-sm font-semibold text-teal-900 transition hover:bg-teal-50 dark:border-teal-700 dark:text-teal-200 dark:hover:bg-teal-950/50"
            >
              Add ORCID in Library
            </Link>
          </div>
        </section>
      ) : null}

      {!hydrated || loading ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </section>
      ) : error ? (
        <p className="text-center text-amber-800 dark:text-amber-400">{error}</p>
      ) : selected.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-stone-500 dark:text-stone-400">Select at least one topic above, or browse everything on the home feed.</p>
          <Link
            href="/"
            className="rounded-sm border border-amber-700 bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700"
          >
            Explore the full feed
          </Link>
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {papers.map((paper) => (
            <FeedCard key={paper.id} paper={paper} />
          ))}
        </section>
      )}
    </>
  );
}
