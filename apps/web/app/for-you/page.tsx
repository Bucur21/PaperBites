import { ForYouAuthGate } from "./for-you-auth-gate";
import { ForYouClient } from "./for-you-client";
import { loadTopics } from "../feed-data";

export default async function ForYouPage() {
  const topics = await loadTopics();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-[#fffdf7] px-6 py-12 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <ForYouAuthGate>
        <ForYouClient topics={topics} />
      </ForYouAuthGate>
    </main>
  );
}
