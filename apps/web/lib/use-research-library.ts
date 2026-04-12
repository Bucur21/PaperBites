"use client";

import { useEffect, useState } from "react";
import {
  getRecentViews,
  listContinuePaperIds,
  subscribeResearchLibrary,
  type RecentViewEntry
} from "./research-library-storage";

export function useRecentViews(): { entries: RecentViewEntry[]; hydrated: boolean } {
  const [hydrated, setHydrated] = useState(false);
  const [entries, setEntries] = useState<RecentViewEntry[]>([]);

  useEffect(() => {
    setEntries(getRecentViews());
    setHydrated(true);
    return subscribeResearchLibrary(() => setEntries(getRecentViews()));
  }, []);

  return { entries, hydrated };
}

export function useContinuePaperIds(): { ids: string[]; hydrated: boolean } {
  const [hydrated, setHydrated] = useState(false);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(listContinuePaperIds());
    setHydrated(true);
    return subscribeResearchLibrary(() => setIds(listContinuePaperIds()));
  }, []);

  return { ids, hydrated };
}
