"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FeedCard } from "../../components/feed-card";
import { SkimModeSwitcher } from "../../components/skim-mode-switcher";
import { SkeletonCard } from "../../components/skeleton-card";
import type { PaperRecord } from "@research-feed/shared";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaperRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchSeq = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const seq = ++searchSeq.current;
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({ q: trimmed, limit: "20" });
      const response = await fetch(`${apiBaseUrl}/search?${params.toString()}`);
      if (!response.ok) throw new Error("Search failed");
      const payload = (await response.json()) as { items: PaperRecord[] };
      if (seq !== searchSeq.current) return;
      setResults(payload.items);
    } catch {
      if (seq === searchSeq.current) setResults([]);
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 350);
  };

  return (
    <>
      <div className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-400">Search</p>
        <h1 className="mb-6 font-serif text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-5xl">
          Find papers
        </h1>
        <div className="mb-6">
          <SkimModeSwitcher />
        </div>
        <div className="relative max-w-2xl">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search by title, keyword, or topic..."
            className="w-full rounded-lg border border-amber-200 bg-white px-4 py-3 pl-11 text-base text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-amber-500"
          />
          <svg
            className="absolute left-3.5 top-3.5 h-5 w-5 text-stone-400 dark:text-stone-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {loading ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </section>
      ) : searched && results.length === 0 ? (
        <p className="text-center text-stone-500 dark:text-stone-400">
          No papers found for &ldquo;{query.trim()}&rdquo;. Try different keywords.
        </p>
      ) : results.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.map((paper) => (
            <FeedCard key={paper.id} paper={paper} />
          ))}
        </section>
      ) : null}
    </>
  );
}
