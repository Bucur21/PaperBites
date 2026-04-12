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
import { usePathname } from "next/navigation";
import { AuthValueModal } from "../components/auth-value-modal";
import { useAuth } from "./auth-context";
import type { AuthNudgeReason } from "./auth-nudge-types";

export type { AuthNudgeReason } from "./auth-nudge-types";

const STORAGE_KEY = "pb-auth-value-nudges-v1";

function readFlags(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function markShown(reason: AuthNudgeReason): void {
  try {
    const flags = readFlags();
    flags[reason] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    /* ignore */
  }
}

function hasShown(reason: AuthNudgeReason): boolean {
  return readFlags()[reason] === true;
}

type AuthNudgeContextValue = {
  /** One-time milestone prompts (respects localStorage so we don’t nag). */
  tryNudge: (reason: AuthNudgeReason) => void;
  /** Opens the benefit modal anytime (e.g. explicit “Set up” buttons). */
  openValueModal: (reason: AuthNudgeReason) => void;
  dismiss: () => void;
  activeReason: AuthNudgeReason | null;
};

const AuthNudgeContext = createContext<AuthNudgeContextValue | null>(null);

export function AuthNudgeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [activeReason, setActiveReason] = useState<AuthNudgeReason | null>(null);

  /** Client-side navigation keeps this provider mounted — clear overlay when the route changes. */
  useEffect(() => {
    setActiveReason(null);
  }, [pathname]);

  const tryNudge = useCallback(
    (reason: AuthNudgeReason) => {
      if (authLoading) return;
      if (user) return;
      if (hasShown(reason)) return;
      markShown(reason);
      setActiveReason(reason);
    },
    [authLoading, user]
  );

  const openValueModal = useCallback(
    (reason: AuthNudgeReason) => {
      if (authLoading) return;
      if (user) return;
      setActiveReason(reason);
    },
    [authLoading, user]
  );

  const dismiss = useCallback(() => {
    setActiveReason(null);
  }, []);

  const value = useMemo(
    () => ({ tryNudge, openValueModal, dismiss, activeReason }),
    [tryNudge, openValueModal, dismiss, activeReason]
  );

  return (
    <AuthNudgeContext.Provider value={value}>
      {children}
      {activeReason ? <AuthValueModal reason={activeReason} onDismiss={dismiss} /> : null}
    </AuthNudgeContext.Provider>
  );
}

export function useAuthNudge(): AuthNudgeContextValue {
  const ctx = useContext(AuthNudgeContext);
  if (!ctx) {
    throw new Error("useAuthNudge must be used within AuthNudgeProvider");
  }
  return ctx;
}
