"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiBaseUrl } from "./api-base";
import { mergeLocalUserData } from "./merge-local-user-data";

const BOOKMARKS_KEY = "paperbites-bookmarks";

const API_UNREACHABLE_HINT =
  "Cannot reach the API. In a separate terminal run `npm run dev:api`, ensure PostgreSQL is up (DATABASE_URL in services/api), and open the app at the same origin as WEB_ORIGIN (e.g. http://localhost:3000).";

function rethrowNetworkError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("Load failed")) {
    throw new Error(API_UNREACHABLE_HINT);
  }
  throw err instanceof Error ? err : new Error("Something went wrong");
}

export type AuthUser = {
  id: string;
  email: string;
  hasPublications?: boolean;
  authorProfileUrls?: string[];
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    options?: { hasPublications?: boolean; authorProfileUrls?: string[] }
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/me`, { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as {
        user: (AuthUser & { hasPublications?: boolean; authorProfileUrls?: string[] }) | null;
      };
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
    } catch (e) {
      rethrowNetworkError(e);
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error ?? "Login failed");
    }
    await mergeLocalUserData();
    await refresh();
  }, [refresh]);

  const register = useCallback(
    async (
      email: string,
      password: string,
      options?: { hasPublications?: boolean; authorProfileUrls?: string[] }
    ) => {
    let res: Response;
    try {
      res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          hasPublications: options?.hasPublications === true,
          authorProfileUrls: options?.authorProfileUrls ?? []
        })
      });
    } catch (e) {
      rethrowNetworkError(e);
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error ?? "Registration failed");
    }
    await mergeLocalUserData();
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      if (user) {
        const savedRes = await fetch(`${apiBaseUrl}/me/saved`, { credentials: "include" });
        if (savedRes.ok) {
          const body = (await savedRes.json()) as { paperIds?: string[] };
          const paperIds = Array.isArray(body.paperIds) ? body.paperIds : [];
          try {
            localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(paperIds));
          } catch {
            /* ignore */
          }
        }
      }
      await fetch(`${apiBaseUrl}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    setUser(null);
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
