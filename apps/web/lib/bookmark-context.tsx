"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { apiBaseUrl } from "./api-base";
import { useAuth } from "./auth-context";
import { useAuthNudge } from "./auth-nudge-context";
import { isDatabasePaperId } from "./paper-id";

const STORAGE_KEY = "paperbites-bookmarks";

function readLocalIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

/** Server order first, then local-only ids (e.g. pubmed-* while logged in). */
function mergeBookmarkLists(serverIds: string[], localIds: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of serverIds) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of localIds) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

type BookmarkContextValue = {
  ids: string[];
  hydrated: boolean;
  toggle: (id: string) => Promise<void>;
  isBookmarked: (id: string) => boolean;
};

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { tryNudge } = useAuthNudge();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      let cancelled = false;
      const local = readLocalIds();
      fetch(`${apiBaseUrl}/me/saved`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("saved"))))
        .then((data: { paperIds?: string[] }) => {
          if (cancelled) return;
          const list = Array.isArray(data.paperIds) ? data.paperIds : [];
          setIds(mergeBookmarkLists(list, local));
          setHydrated(true);
        })
        .catch(() => {
          if (!cancelled) {
            setIds(mergeBookmarkLists([], local));
            setHydrated(true);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    setIds(readLocalIds());
    setHydrated(true);
  }, [authLoading, user]);

  const persistLocal = useCallback((next: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    async (id: string) => {
      if (user && isDatabasePaperId(id)) {
        const wasSaved = ids.includes(id);
        const method = wasSaved ? "DELETE" : "POST";
        try {
          const res = await fetch(`${apiBaseUrl}/me/saved/${encodeURIComponent(id)}`, {
            method,
            credentials: "include"
          });
          if (res.ok) {
            setIds((prev) => (wasSaved ? prev.filter((v) => v !== id) : [id, ...prev]));
          }
        } catch {
          /* ignore */
        }
        return;
      }

      if (user && !isDatabasePaperId(id)) {
        setIds((prev) => {
          const next = prev.includes(id) ? prev.filter((v) => v !== id) : [id, ...prev];
          persistLocal(next);
          return next;
        });
        return;
      }

      setIds((prev) => {
        const wasSaved = prev.includes(id);
        const next = wasSaved ? prev.filter((v) => v !== id) : [id, ...prev];
        persistLocal(next);
        if (!user && !wasSaved && prev.length === 0) {
          queueMicrotask(() => tryNudge("first_save"));
        }
        return next;
      });
    },
    [user, ids, persistLocal, tryNudge]
  );

  const isBookmarked = useCallback((id: string) => ids.includes(id), [ids]);

  const value = useMemo(
    () => ({ ids, hydrated, toggle, isBookmarked }),
    [ids, hydrated, toggle, isBookmarked]
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks(): BookmarkContextValue {
  const ctx = useContext(BookmarkContext);
  if (!ctx) {
    throw new Error("useBookmarks must be used within BookmarkProvider");
  }
  return ctx;
}
