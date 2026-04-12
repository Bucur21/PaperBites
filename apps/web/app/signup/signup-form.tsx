"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { safeNextPath } from "../../lib/safe-next-path";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hasPublications, setHasPublications] = useState(false);
  const [profileUrlsText, setProfileUrlsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    const authorProfileUrls = profileUrlsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (hasPublications && authorProfileUrls.length === 0) {
      setError("Add at least one profile link, or turn off “I have publications”.");
      return;
    }
    setPending(true);
    try {
      await register(email, password, {
        hasPublications,
        authorProfileUrls: hasPublications ? authorProfileUrls : []
      });
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
        <label htmlFor="signup-email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Email
        </label>
        <input
          id="signup-email"
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
        <label htmlFor="signup-password" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-amber-200 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-500 focus:border-amber-500 focus:ring-2 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </div>
      <div>
        <label htmlFor="signup-confirm" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Confirm password
        </label>
        <input
          id="signup-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-sm border border-amber-200 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-500 focus:border-amber-500 focus:ring-2 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </div>

      <div className="rounded-sm border border-amber-100 bg-amber-50/50 p-4 dark:border-stone-700 dark:bg-stone-900/40">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={hasPublications}
            onChange={(e) => setHasPublications(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700 focus:ring-amber-500"
          />
          <span className="text-sm text-stone-700 dark:text-stone-300">
            I already have publications — link my journal or ORCID profiles so PaperBites can list my papers under <strong>Saved → My papers</strong>.
          </span>
        </label>
        {hasPublications ? (
          <div className="mt-3">
            <label htmlFor="signup-profiles" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Profile URLs (one per line)
            </label>
            <textarea
              id="signup-profiles"
              name="authorProfileUrls"
              rows={4}
              value={profileUrlsText}
              onChange={(e) => setProfileUrlsText(e.target.value)}
              placeholder={`https://orcid.org/0000-0001-2345-6789\nhttps://pubmed.ncbi.nlm.nih.gov/12345678/`}
              className="w-full rounded-sm border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-stone-900 outline-none ring-amber-500 focus:border-amber-500 focus:ring-2 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
            <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
              Best results: your public <strong>ORCID</strong> profile, or direct <strong>PubMed</strong> article links. We read PubMed IDs from ORCID works and match them to papers in PaperBites (or show PubMed metadata).
            </p>
          </div>
        ) : null}
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
        {pending ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}
