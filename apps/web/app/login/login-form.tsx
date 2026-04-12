"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { safeNextPath } from "../../lib/safe-next-path";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
      const next = safeNextPath(searchParams.get("next"));
      router.push(next as never);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="login-email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          className="w-full rounded-sm border border-amber-200 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-500 focus:border-amber-500 focus:ring-2 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          className="w-full rounded-sm border border-amber-200 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-500 focus:border-amber-500 focus:ring-2 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm border border-amber-700 bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60 dark:border-amber-600 dark:bg-amber-700"
      >
        {pending ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
