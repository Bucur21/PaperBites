"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookmarkButton } from "../../../components/bookmark-button";
import { LikeButton } from "../../../components/like-button";
import { useAuth } from "../../../lib/auth-context";
import { useAuthNudge } from "../../../lib/auth-nudge-context";

export function PaperActions({
  paperId,
  citation,
  title
}: {
  paperId: string;
  citation: string;
  title: string;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { openValueModal } = useAuthNudge();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  const copyCitation = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      openValueModal("gate_cite");
      return;
    }
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API not available */
    }
  }, [authLoading, user, openValueModal, citation]);

  const share = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      openValueModal("gate_share");
      return;
    }
    const shareData = { title, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {
        /* fallback failed */
      }
    }
  }, [authLoading, user, openValueModal, title]);

  return (
    <div className="mb-8 flex items-center gap-3">
      <button
        type="button"
        onClick={goBack}
        className="text-sm font-medium text-amber-800 transition hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-300"
      >
        ← Back
      </button>
      <div className="flex-1" />
      <BookmarkButton paperId={paperId} />
      <LikeButton paperId={paperId} />
      <button
        type="button"
        onClick={copyCitation}
        title="Copy citation"
        className="rounded-sm border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-50 dark:border-stone-600 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-stone-800"
      >
        {copied ? "Copied!" : "Cite"}
      </button>
      <button
        type="button"
        onClick={share}
        title="Share this paper"
        className="rounded-sm border border-amber-200 p-2 text-amber-700 transition hover:border-amber-400 hover:bg-amber-50 dark:border-stone-600 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-stone-800"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
      </button>
    </div>
  );
}
