"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { AuthNudgeReason } from "../lib/auth-nudge-types";

const COPY: Record<
  AuthNudgeReason,
  { title: string; body: string; benefit: string }
> = {
  first_save: {
    title: "Keep this library forever",
    body: "You’ve started a reading list. Create a free account so saves sync across devices and survive browser clears.",
    benefit: "Bookmarks merge into your account — nothing is lost."
  },
  interests: {
    title: "Save your topic picks",
    body: "Your “For you” topics are only in this browser right now. Sign in to sync them everywhere you use PaperBites.",
    benefit: "Same feed, any device — interests follow your account."
  },
  likes_warm: {
    title: "Your taste is showing",
    body: "You’ve liked several papers. An account keeps those signals with you and opens the door to better recommendations later.",
    benefit: "Likes stay on your profile when you sign up."
  },
  my_papers: {
    title: "Sync your author publications",
    body: "Link ORCID or PubMed once; we’ll pull your works into Library under My papers. That needs a signed-in account.",
    benefit: "One-time setup — your papers stay updated here."
  },
  gate_bookmark: {
    title: "Save papers to your account",
    body: "Bookmarks sync across devices and stay with you when you sign in. Create a free account or log in to keep this library.",
    benefit: "Your reading list follows you everywhere."
  },
  gate_like: {
    title: "Like papers with your profile",
    body: "Likes are tied to your account so they’re not lost when you switch browsers. Log in or sign up to use hearts.",
    benefit: "Build a signal of what matters to you over time."
  },
  gate_cite: {
    title: "Copy citations as a member",
    body: "Citing and sharing from PaperBites works best when you’re signed in — we’ll keep your library and references consistent.",
    benefit: "One account for saves, likes, and citations."
  },
  gate_share: {
    title: "Share with your PaperBites profile",
    body: "Share links and keep track of what you send when you’re logged in. Sign in or create an account to continue.",
    benefit: "Optional: sync saves and likes with what you share."
  }
};

export function AuthValueModal({
  reason,
  onDismiss
}: {
  reason: AuthNudgeReason;
  onDismiss: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const next = useMemo(() => {
    const q = searchParams.toString();
    const path = q ? `${pathname}?${q}` : pathname;
    return encodeURIComponent(path || "/");
  }, [pathname, searchParams]);

  const { title, body, benefit } = COPY[reason];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-value-title"
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onDismiss} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-amber-200/90 bg-[#fffdf7] p-6 shadow-xl dark:border-stone-600 dark:bg-stone-900">
        <h2 id="auth-value-title" className="mb-2 font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {title}
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{body}</p>
        <p className="mb-6 rounded-sm border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-950/90 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200/90">
          {benefit}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="order-2 rounded-sm border border-amber-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-amber-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800 sm:order-1"
          >
            Not now
          </button>
          <Link
            href={`/login?next=${next}`}
            onClick={onDismiss}
            className="order-3 rounded-sm border border-amber-200 px-4 py-2.5 text-center text-sm font-medium text-stone-700 transition hover:bg-amber-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800 sm:order-2"
          >
            Log in
          </Link>
          <Link
            href={`/signup?next=${next}`}
            onClick={onDismiss}
            className="order-1 rounded-sm border border-amber-700 bg-amber-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700 sm:order-3"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
