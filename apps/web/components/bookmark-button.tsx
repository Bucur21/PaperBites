"use client";

import { useAuth } from "../lib/auth-context";
import { useAuthNudge } from "../lib/auth-nudge-context";
import { useBookmarks } from "../lib/use-bookmarks";

export function BookmarkButton({ paperId }: { paperId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { openValueModal } = useAuthNudge();
  const { toggle, isBookmarked, hydrated } = useBookmarks();
  const saved = hydrated && isBookmarked(paperId);

  return (
    <button
      type="button"
      onClick={() => {
        if (authLoading) return;
        if (!user) {
          openValueModal("gate_bookmark");
          return;
        }
        void toggle(paperId);
      }}
      aria-label={saved ? "Remove bookmark" : "Bookmark this paper"}
      title={saved ? "Remove bookmark" : "Bookmark this paper"}
      className="rounded-sm border border-amber-200 p-2 text-amber-700 transition hover:border-amber-400 hover:bg-amber-50 dark:border-stone-600 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-stone-800"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </button>
  );
}
