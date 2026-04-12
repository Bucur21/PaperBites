import Link from "next/link";
import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-[#fffdf7] px-6 py-16 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="glass-dashboard rounded-2xl p-8 shadow-sm">
        <h1 className="mb-2 font-serif text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="mb-8 text-sm text-stone-600 dark:text-stone-400">
          Password must be at least 8 characters. Optionally link ORCID or PubMed URLs so your publications appear under Library → My
          papers. Bookmarks and topic picks from this browser can be merged after you sign up.
        </p>
        <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
          <SignupForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-400">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
