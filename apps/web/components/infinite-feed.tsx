"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FeedCard } from "./feed-card";
import { SkeletonCard } from "./skeleton-card";
import type { PaperRecord } from "@research-feed/shared";
import { normalizeTopicParam } from "../lib/feed-topic";
import { enrichPapersWithCitationCounts } from "../lib/openalex-citations";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function InfiniteFeed({
  initialPapers,
  initialNextCursor,
  topic
}: {
  initialPapers: PaperRecord[];
  initialNextCursor: string | null;
  topic?: string;
}) {
  const topicId = normalizeTopicParam(topic);
  const [papers, setPapers] = useState(initialPapers);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initialNextCursor === null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setPapers(initialPapers);
    setCursor(initialNextCursor);
    setExhausted(initialNextCursor === null);
  }, [initialPapers, initialNextCursor]);

  const loadMore = useCallback(async () => {
    if (loading || exhausted || cursor == null) return;
    const reqId = ++requestIdRef.current;
    setLoading(true);

    try {
      const params = new URLSearchParams({ cursor, limit: "20" });
      if (topicId) params.set("topic", topicId);
      const response = await fetch(`${apiBaseUrl}/feed?${params.toString()}`);
      if (!response.ok) throw new Error("Feed request failed");
      const payload = (await response.json()) as { items: PaperRecord[]; nextCursor: string | null };

      if (reqId !== requestIdRef.current) return;

      let nextItems = payload.items;
      try {
        nextItems = await enrichPapersWithCitationCounts(payload.items);
      } catch {
        /* keep unenriched */
      }

      if (nextItems.length === 0) {
        setExhausted(true);
        setCursor(null);
      } else {
        setPapers((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          for (const p of nextItems) {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              merged.push(p);
            }
          }
          return merged;
        });
        setCursor(payload.nextCursor ?? null);
        if (payload.nextCursor == null) setExhausted(true);
      }
    } catch {
      if (reqId === requestIdRef.current) {
        setExhausted(true);
      }
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [cursor, loading, exhausted, topicId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {papers.map((paper) => (
          <FeedCard key={paper.id} paper={paper} />
        ))}
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)
          : null}
      </section>
      {!exhausted ? <div ref={sentinelRef} className="h-1" /> : null}
      {exhausted && papers.length > 0 ? (
        <p className="mt-8 text-center text-sm text-stone-400 dark:text-stone-500">
          You've reached the end of the feed.
        </p>
      ) : null}
    </>
  );
}
