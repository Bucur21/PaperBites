"use client";

import { useAuth } from "../lib/auth-context";
import { useAuthNudge } from "../lib/auth-nudge-context";
import { useLikes } from "../lib/use-likes";

export function LikeButton({ paperId }: { paperId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { openValueModal } = useAuthNudge();
  const { toggle, isLiked, hydrated } = useLikes();
  const liked = hydrated && isLiked(paperId);

  return (
    <button
      type="button"
      onClick={() => {
        if (authLoading) return;
        if (!user) {
          openValueModal("gate_like");
          return;
        }
        void toggle(paperId);
      }}
      aria-label={liked ? "Unlike this paper" : "Like this paper"}
      title={liked ? "Unlike" : "Like"}
      className="rounded-sm border border-amber-200 p-2 text-amber-700 transition hover:border-amber-400 hover:bg-amber-50 dark:border-stone-600 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-stone-800"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
