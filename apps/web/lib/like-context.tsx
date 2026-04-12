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

const STORAGE_KEY = "paperbites-likes";

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

function mergeLikeLists(serverIds: string[], localIds: string[]): string[] {
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

type LikeContextValue = {
  ids: string[];
  hydrated: boolean;
  toggle: (id: string) => Promise<void>;
  isLiked: (id: string) => boolean;
};

const LikeContext = createContext<LikeContextValue | null>(null);

const LIKES_WARM_THRESHOLD = 3;

export function LikesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { tryNudge } = useAuthNudge();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      let cancelled = false;
      const local = readLocalIds();
      fetch(`${apiBaseUrl}/me/likes`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("likes"))))
        .then((data: { paperIds?: string[] }) => {
          if (cancelled) return;
          const list = Array.isArray(data.paperIds) ? data.paperIds : [];
          setIds(mergeLikeLists(list, local));
          setHydrated(true);
        })
        .catch(() => {
          if (!cancelled) {
            setIds(mergeLikeLists([], local));
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
        const wasLiked = ids.includes(id);
        const method = wasLiked ? "DELETE" : "POST";
        try {
          const res = await fetch(`${apiBaseUrl}/me/likes/${encodeURIComponent(id)}`, {
            method,
            credentials: "include"
          });
          if (res.ok) {
            setIds((prev) => (wasLiked ? prev.filter((v) => v !== id) : [id, ...prev]));
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
        const wasLiked = prev.includes(id);
        const next = wasLiked ? prev.filter((v) => v !== id) : [id, ...prev];
        persistLocal(next);
        if (!user && !wasLiked && next.length >= LIKES_WARM_THRESHOLD) {
          queueMicrotask(() => tryNudge("likes_warm"));
        }
        return next;
      });
    },
    [user, ids, persistLocal, tryNudge]
  );

  const isLiked = useCallback((id: string) => ids.includes(id), [ids]);

  const value = useMemo(() => ({ ids, hydrated, toggle, isLiked }), [ids, hydrated, toggle, isLiked]);

  return <LikeContext.Provider value={value}>{children}</LikeContext.Provider>;
}

export function useLikes(): LikeContextValue {
  const ctx = useContext(LikeContext);
  if (!ctx) {
    throw new Error("useLikes must be used within LikesProvider");
  }
  return ctx;
}
