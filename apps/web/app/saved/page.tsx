import { SavedClient } from "./saved-client";

export default function SavedPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-[#fffdf7] px-6 py-12 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <SavedClient />
    </main>
  );
}
