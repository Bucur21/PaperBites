"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSampleFeed, sanitizePaperRecord, type PaperRecord } from "@research-feed/shared";
import { FeedCard } from "../../components/feed-card";
import { SkimModeSwitcher } from "../../components/skim-mode-switcher";
import { SkeletonCard } from "../../components/skeleton-card";
import { useBookmarks } from "../../lib/use-bookmarks";
import { useLikes } from "../../lib/use-likes";
import { useAuth } from "../../lib/auth-context";
import { useAuthNudge } from "../../lib/auth-nudge-context";
import { apiBaseUrl } from "../../lib/api-base";
import { useContinuePaperIds, useRecentViews } from "../../lib/use-research-library";

async function fetchPapersOrdered(ids: string[]): Promise<PaperRecord[]> {
  const map = new Map<string, PaperRecord>();
  for (const id of ids.slice(0, 50)) {
    try {
      const response = await fetch(`${apiBaseUrl}/papers/${encodeURIComponent(id)}`);
      if (!response.ok) continue;
      const payload = (await response.json()) as { item: PaperRecord };
      map.set(id, payload.item);
    } catch {
      /* skip */
    }
  }
  return ids.map((id) => map.get(id)).filter((p): p is PaperRecord => Boolean(p));
}

function StarterGrid({ papers }: { papers: PaperRecord[] }) {
  if (papers.length === 0) return null;
  return (
    <div className="mt-8">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-400">Try these</p>
      <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
        Tap <span className="font-medium text-stone-700 dark:text-stone-300">Save</span> on a card to add it to Saved papers.
      </p>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {papers.map((paper) => (
          <FeedCard key={`starter-${paper.id}`} paper={paper} />
        ))}
      </div>
    </div>
  );
}

export function SavedClient() {
  const { user, loading: authLoading, refresh } = useAuth();
  const { openValueModal } = useAuthNudge();
  const { ids, hydrated: bookmarksHydrated } = useBookmarks();
  const { ids: likeIds, hydrated: likesHydrated } = useLikes();
  const { entries: recentEntries, hydrated: recentHydrated } = useRecentViews();
  const { ids: continuePaperIds, hydrated: continueHydrated } = useContinuePaperIds();

  const [savedPapers, setSavedPapers] = useState<PaperRecord[]>([]);
  const [likedPapers, setLikedPapers] = useState<PaperRecord[]>([]);
  const [recentPapers, setRecentPapers] = useState<PaperRecord[]>([]);
  const [continuePapers, setContinuePapers] = useState<PaperRecord[]>([]);
  const [starters, setStarters] = useState<PaperRecord[]>([]);

  const [myPapers, setMyPapers] = useState<PaperRecord[]>([]);
  const [myNotes, setMyNotes] = useState<string[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingLiked, setLoadingLiked] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingContinue, setLoadingContinue] = useState(true);
  const [loadingMy, setLoadingMy] = useState(false);
  const [profileEdit, setProfileEdit] = useState("");
  const [profileHasPub, setProfileHasPub] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const continueSet = useMemo(() => new Set(continuePaperIds), [continuePaperIds]);
  const recentIdsOrdered = useMemo(
    () => recentEntries.filter((e) => !continueSet.has(e.id)).map((e) => e.id),
    [recentEntries, continueSet]
  );

  const loadSaved = useCallback(async (paperIds: string[]) => {
    if (paperIds.length === 0) {
      setSavedPapers([]);
      setLoadingSaved(false);
      return;
    }

    setLoadingSaved(true);
    const loaded = await fetchPapersOrdered(paperIds);
    setSavedPapers(loaded);
    setLoadingSaved(false);
  }, []);

  const fetchMyPapers = useCallback(async () => {
    setLoadingMy(true);
    try {
      const res = await fetch(`${apiBaseUrl}/me/my-papers`, { credentials: "include" });
      if (!res.ok) {
        setMyPapers([]);
        setMyNotes([]);
        return;
      }
      const data = (await res.json()) as { items?: PaperRecord[]; notes?: string[] };
      setMyPapers(Array.isArray(data.items) ? data.items : []);
      setMyNotes(Array.isArray(data.notes) ? data.notes : []);
    } catch {
      setMyPapers([]);
      setMyNotes([]);
    } finally {
      setLoadingMy(false);
    }
  }, []);

  useEffect(() => {
    if (!bookmarksHydrated) return;
    void loadSaved(ids);
  }, [bookmarksHydrated, ids, loadSaved]);

  useEffect(() => {
    if (!likesHydrated) return;
    let cancelled = false;
    void (async () => {
      if (likeIds.length === 0) {
        setLikedPapers([]);
        setLoadingLiked(false);
        return;
      }
      setLoadingLiked(true);
      const rows = await fetchPapersOrdered(likeIds);
      if (!cancelled) {
        setLikedPapers(rows);
        setLoadingLiked(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [likesHydrated, likeIds]);

  useEffect(() => {
    if (!recentHydrated || !continueHydrated) return;
    let cancelled = false;
    void (async () => {
      if (recentIdsOrdered.length === 0) {
        setRecentPapers([]);
        setLoadingRecent(false);
        return;
      }
      setLoadingRecent(true);
      const rows = await fetchPapersOrdered(recentIdsOrdered);
      if (!cancelled) {
        setRecentPapers(rows);
        setLoadingRecent(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recentHydrated, continueHydrated, recentIdsOrdered]);

  useEffect(() => {
    if (!continueHydrated) return;
    let cancelled = false;
    void (async () => {
      if (continuePaperIds.length === 0) {
        setContinuePapers([]);
        setLoadingContinue(false);
        return;
      }
      setLoadingContinue(true);
      const rows = await fetchPapersOrdered(continuePaperIds);
      if (!cancelled) {
        setContinuePapers(rows);
        setLoadingContinue(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [continueHydrated, continuePaperIds]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/feed?limit=6`);
        if (!res.ok) throw new Error("feed");
        const data = (await res.json()) as { items?: PaperRecord[] };
        const items = Array.isArray(data.items) ? data.items.slice(0, 6) : [];
        if (!cancelled) setStarters(items);
      } catch {
        if (!cancelled) {
          setStarters(createSampleFeed().slice(0, 6).map(sanitizePaperRecord));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authLoading && user?.hasPublications) {
      void fetchMyPapers();
    } else if (!authLoading && !user?.hasPublications) {
      setMyPapers([]);
      setMyNotes([]);
    }
  }, [authLoading, user?.hasPublications, fetchMyPapers]);

  useEffect(() => {
    if (!user) return;
    setProfileHasPub(user.hasPublications === true);
    setProfileEdit((user.authorProfileUrls ?? []).join("\n"));
  }, [user]);

  const showSavedEmpty = bookmarksHydrated && !loadingSaved && savedPapers.length === 0;
  const showLikedEmpty = likesHydrated && !loadingLiked && likedPapers.length === 0;

  return (
    <>
      <div className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-400">Saved</p>
        <h1 className="mb-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-5xl">
          Library
        </h1>
        <div className="mb-5">
          <SkimModeSwitcher />
        </div>
        <p className="max-w-2xl text-lg leading-8 text-stone-600 dark:text-stone-400">
          {authLoading
            ? "Loading…"
            : user
              ? "Bookmarks sync to your account. Likes and reading progress stay on this device until you’re signed in. Link ORCID or PubMed URLs to list your own publications under My papers."
              : "Sign in to save papers to your account. Likes and reading history stay on this device until you sign in. Link ORCID or PubMed URLs under My papers after you register."}
        </p>
        {user && !authLoading ? (
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            <Link href="/profile" className="font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-400">
              Account &amp; author settings
            </Link>{" "}
            — email, linked profiles, and citation expectations.
          </p>
        ) : null}
      </div>

      <section className="mb-14">
        <h2 className="mb-4 font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Recently viewed
        </h2>
        <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
          Papers you opened on this device (newest first). Items with saved reading progress appear under Continue reading instead.
        </p>
        {!recentHydrated || !continueHydrated || loadingRecent ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : recentPapers.length === 0 ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50/30 py-10 text-center dark:border-stone-700 dark:bg-stone-900/30">
            <p className="text-lg font-medium text-stone-500 dark:text-stone-400">No recent papers yet</p>
            <p className="mt-2 text-sm text-stone-400 dark:text-stone-500">Open a paper from the feed or search to build your history.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {recentPapers.map((paper) => (
              <FeedCard key={`recent-${paper.id}`} paper={paper} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-14">
        <h2 className="mb-4 font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Continue reading
        </h2>
        <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
          Reading position is saved on this device when you scroll a paper page.
        </p>
        {!continueHydrated || loadingContinue ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : continuePapers.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 py-10 text-center dark:border-stone-700 dark:bg-stone-900/30">
            <p className="text-lg font-medium text-stone-500 dark:text-stone-400">Nothing to resume yet</p>
            <p className="mt-2 text-sm text-stone-400 dark:text-stone-500">Scroll a paper summary page and we’ll list it here.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {continuePapers.map((paper) => (
              <FeedCard key={`cont-${paper.id}`} paper={paper} shelfHint="continue" />
            ))}
          </div>
        )}
      </section>

      <section className="mb-14">
        <h2 className="mb-4 font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Saved papers
        </h2>
        <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
          Bookmarks from the feed or paper pages (synced when logged in).
        </p>
        {!bookmarksHydrated || loadingSaved ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : savedPapers.length === 0 ? (
          <>
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 py-12 text-center dark:border-stone-700 dark:bg-stone-900/30">
              <p className="mb-2 text-lg font-medium text-stone-500 dark:text-stone-400">No saved papers yet</p>
              <p className="text-sm text-stone-400 dark:text-stone-500">
                Log in or create an account, then use the bookmark on any paper to add it here.
              </p>
            </div>
            {showSavedEmpty ? <StarterGrid papers={starters} /> : null}
          </>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {savedPapers.map((paper) => (
              <FeedCard key={paper.id} paper={paper} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-14">
        <h2 className="mb-4 font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Liked papers
        </h2>
        <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
          Hearts from the feed or paper pages. When signed in, likes merge with your account; guests keep them on this device.
        </p>
        {!likesHydrated || loadingLiked ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : likedPapers.length === 0 ? (
          <>
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 py-12 text-center dark:border-stone-700 dark:bg-stone-900/30">
              <p className="mb-2 text-lg font-medium text-stone-500 dark:text-stone-400">No liked papers yet</p>
              <p className="text-sm text-stone-400 dark:text-stone-500">Tap the heart on a card to add papers you want to remember.</p>
            </div>
            {showLikedEmpty && savedPapers.length > 0 ? <StarterGrid papers={starters} /> : null}
            {showLikedEmpty && savedPapers.length === 0 ? (
              <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
                Heart papers from the suggestions under Saved papers, or browse the feed.
              </p>
            ) : null}
          </>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {likedPapers.map((paper) => (
              <FeedCard key={`like-${paper.id}`} paper={paper} />
            ))}
          </div>
        )}
      </section>

      {!user && !authLoading ? (
        <section className="mb-14 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-stone-50/50 p-6 dark:border-stone-600 dark:from-stone-900/50 dark:to-stone-950/30">
          <h2 className="mb-2 font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            My papers
          </h2>
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Connect your ORCID or PubMed URLs once and we’ll list your publications here with summaries and links — same cards as the rest
            of PaperBites. Syncing author profiles requires an account.
          </p>
          <button
            type="button"
            onClick={() => openValueModal("my_papers")}
            className="rounded-sm border border-amber-700 bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700"
          >
            Set up My papers
          </button>
        </section>
      ) : null}

      {user ? (
        <section
          id="author-profile-links"
          className="mb-14 scroll-mt-24 rounded-xl border border-amber-100 bg-amber-50/30 p-6 dark:border-stone-700 dark:bg-stone-900/40"
        >
          <h2 className="mb-2 font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Author profile links
          </h2>
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
            Add your public ORCID profile and/or PubMed article URLs (one per line). We discover PubMed IDs from ORCID works and match
            them to PaperBites or show PubMed metadata.
          </p>
          <label className="mb-3 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={profileHasPub}
              onChange={(e) => setProfileHasPub(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700"
            />
            <span className="text-sm text-stone-700 dark:text-stone-300">Show “My papers” from these profiles</span>
          </label>
          <textarea
            value={profileEdit}
            onChange={(e) => setProfileEdit(e.target.value)}
            rows={4}
            className="mb-3 w-full rounded-sm border border-amber-200 bg-white px-3 py-2 font-mono text-sm dark:border-stone-600 dark:bg-stone-900"
            placeholder="https://orcid.org/0000-0001-2345-6789"
          />
          {profileMsg ? <p className="mb-2 text-sm text-amber-800 dark:text-amber-400">{profileMsg}</p> : null}
          <button
            type="button"
            disabled={profileSaving}
            onClick={async () => {
              setProfileSaving(true);
              setProfileMsg(null);
              const authorProfileUrls = profileEdit
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 10);
              if (profileHasPub && authorProfileUrls.length === 0) {
                setProfileMsg("Add at least one URL or turn off the checkbox.");
                setProfileSaving(false);
                return;
              }
              try {
                const res = await fetch(`${apiBaseUrl}/me/publication-profiles`, {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    hasPublications: profileHasPub,
                    authorProfileUrls: profileHasPub ? authorProfileUrls : []
                  })
                });
                if (!res.ok) {
                  const err = (await res.json().catch(() => ({}))) as { error?: string };
                  throw new Error(err.error ?? "Save failed");
                }
                await refresh();
                await fetchMyPapers();
                setProfileMsg("Saved.");
              } catch (e) {
                setProfileMsg(e instanceof Error ? e.message : "Could not save");
              } finally {
                setProfileSaving(false);
              }
            }}
            className="rounded-sm border border-amber-700 bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 dark:border-amber-600 dark:bg-amber-700"
          >
            {profileSaving ? "Saving…" : "Save profiles"}
          </button>
        </section>
      ) : null}

      {user?.hasPublications ? (
        <section>
          <h2 className="mb-4 font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            My papers
          </h2>
          <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
            Works linked from your profiles. Full PaperBites summaries appear when the paper is ingested; otherwise we show PubMed
            metadata and a link to the full article.
          </p>
          {myNotes.length > 0 ? (
            <ul className="mb-6 list-inside list-disc text-sm text-amber-800 dark:text-amber-400">
              {myNotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : null}
          {loadingMy ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : myPapers.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50/50 py-12 text-center dark:border-stone-700 dark:bg-stone-900/30">
              <p className="text-stone-500 dark:text-stone-400">
                No PubMed-linked works found yet. Ensure your ORCID profile is public and lists PubMed IDs, or add direct PubMed article URLs
                above.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {myPapers.map((paper) => (
                <FeedCard key={`my-${paper.sourceId}-${paper.id}`} paper={paper} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}
