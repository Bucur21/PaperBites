import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-[#fffdf7] px-6 py-16 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="glass-dashboard rounded-2xl p-8 shadow-sm">
        <h1 className="mb-2 font-serif text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="mb-8 text-sm text-stone-600 dark:text-stone-400">
          Use the email and password you registered with. Sessions stay on this device for 30 days.
        </p>
        <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
          No account?{" "}
          <Link href="/signup" className="font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-400">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
