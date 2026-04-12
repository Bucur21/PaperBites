export function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden border border-amber-200/80 bg-white dark:border-stone-700 dark:bg-stone-900">
      <div className="aspect-video w-full bg-amber-100/60 dark:bg-stone-800" />
      <div className="border-b border-amber-100/90 px-5 pb-3 pt-4 dark:border-stone-700">
        <div className="mb-2 h-3 w-20 rounded bg-amber-100 dark:bg-stone-700" />
        <div className="h-3 w-32 rounded bg-stone-100 dark:bg-stone-700" />
      </div>
      <div className="flex flex-1 flex-col px-5 pb-6 pt-4">
        <div className="mb-3 h-5 w-4/5 rounded bg-stone-100 dark:bg-stone-700" />
        <div className="mb-2 h-3 w-full rounded bg-stone-100 dark:bg-stone-700" />
        <div className="mb-2 h-3 w-full rounded bg-stone-100 dark:bg-stone-700" />
        <div className="mb-5 h-3 w-3/4 rounded bg-stone-100 dark:bg-stone-700" />
        <div className="mt-auto flex gap-2">
          <div className="h-9 w-28 rounded bg-amber-100 dark:bg-stone-700" />
          <div className="h-9 w-24 rounded bg-stone-100 dark:bg-stone-700" />
        </div>
      </div>
    </div>
  );
}
