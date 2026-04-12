import { Suspense } from "react";
import { ProfileClient } from "./profile-client";

export default function ProfilePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-[#fffdf7] px-6 py-12 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
        <ProfileClient />
      </Suspense>
    </main>
  );
}
