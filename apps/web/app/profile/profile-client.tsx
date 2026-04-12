"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiBaseUrl } from "../../lib/api-base";

export function ProfileClient() {
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();
  const [myPapersCount, setMyPapersCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  const loadMyPapersCount = useCallback(async () => {
    if (!user?.hasPublications) {
      setMyPapersCount(0);
      return;
    }
    setLoadingCount(true);
    try {
      const res = await fetch(`${apiBaseUrl}/me/my-papers`, { credentials: "include" });
      if (!res.ok) {
        setMyPapersCount(null);
        return;
      }
      const data = (await res.json()) as { items?: unknown[] };
      setMyPapersCount(Array.isArray(data.items) ? data.items.length : 0);
    } catch {
      setMyPapersCount(null);
    } finally {
      setLoadingCount(false);
    }
  }, [user?.hasPublications]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/profile")}`);
      return;
    }
    void loadMyPapersCount();
  }, [authLoading, user, router, loadMyPapersCount]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-stone-500 dark:text-stone-400">Loading…</p>
      </div>
    );
  }

  const urls = user.authorProfileUrls ?? [];
  const hasLinks = urls.length > 0;

  return (
    <>
      <div className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-400">Account</p>
        <h1 className="mb-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-5xl">
          Profile
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-stone-600 dark:text-stone-400">
          Your signed-in identity on PaperBites. Connect ORCID or PubMed URLs to surface your publications in Library.
        </p>
      </div>

      <section className="glass-dashboard mb-8 rounded-2xl p-6 md:p-8">
        <h2 className="mb-4 font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">Sign-in email</h2>
        <p className="font-mono text-sm text-stone-800 dark:text-stone-200">{user.email}</p>
      </section>

      <section className="glass-dashboard mb-8 rounded-2xl p-6 md:p-8">
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">Author profile links</h2>
        <p className="mb-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          ORCID or PubMed URLs you&apos;ve saved for &ldquo;My papers&rdquo;. Edit them in{" "}
          <Link href="/saved#author-profile-links" className="font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-400">
            Library
          </Link>
          .
        </p>
        {hasLinks ? (
          <ul className="list-inside list-disc space-y-2 text-sm text-stone-700 dark:text-stone-300">
            {urls.map((u) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noreferrer" className="break-all text-amber-800 hover:underline dark:text-amber-400">
                  {u}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No profile URLs yet.{" "}
            <Link href="/saved#author-profile-links" className="font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-400">
              Add your ORCID in Library
            </Link>
            .
          </p>
        )}
      </section>

      <section className="glass-dashboard mb-8 rounded-2xl p-6 md:p-8">
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">My papers</h2>
        <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
          Works we match from your linked profiles appear in Library under &ldquo;My papers.&rdquo;
        </p>
        {user.hasPublications ? (
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {loadingCount ? "Loading count…" : myPapersCount !== null ? `${myPapersCount} paper${myPapersCount === 1 ? "" : "s"} matched` : "Could not load count."}
          </p>
        ) : (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Turn on &ldquo;My papers&rdquo; and add URLs in{" "}
            <Link href="/saved#author-profile-links" className="font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-400">
              Library
            </Link>
            .
          </p>
        )}
      </section>

      <section className="glass-dashboard mb-8 rounded-2xl p-6 md:p-8">
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">Citations &amp; metrics</h2>
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          PaperBites shows third-party <strong className="font-medium text-stone-700 dark:text-stone-300">cited-by counts per paper</strong> (e.g. via
          OpenAlex) when a DOI is available — not a personal citation dashboard yet. A consolidated view of how{" "}
          <em>your</em> work is cited is on the roadmap for signed-in researchers.
        </p>
      </section>

      <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-6 dark:border-stone-600 dark:bg-stone-900/40">
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">Public profile</h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          A shareable author page for others to discover your work through PaperBites is <strong className="font-medium">coming soon</strong>.
        </p>
      </section>

      <p className="mt-8 text-center text-sm text-stone-500 dark:text-stone-500">
        <Link href="/saved" className="font-medium text-amber-800 hover:underline dark:text-amber-400">
          Back to Library
        </Link>
      </p>
    </>
  );
}
