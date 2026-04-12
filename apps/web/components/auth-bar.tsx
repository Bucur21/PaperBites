"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth-context";

export function AuthBar() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="max-w-[min(100%,14rem)] truncate text-xs text-stone-400 dark:text-stone-500" aria-hidden>
        …
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex max-w-[min(100%,16rem)] flex-col items-end gap-1 text-right sm:flex-row sm:items-center sm:gap-3">
        <Link
          href="/profile"
          className="truncate text-xs text-stone-600 underline-offset-2 hover:text-amber-800 hover:underline dark:text-stone-400 dark:hover:text-amber-400"
          title="Profile"
        >
          {user.email}
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="shrink-0 rounded-sm border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-50 dark:border-stone-600 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-stone-800"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href="/login"
        className="rounded-sm border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-50 dark:border-stone-600 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-stone-800"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="rounded-sm border border-amber-700 bg-amber-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-700"
      >
        Sign up
      </Link>
    </div>
  );
}
