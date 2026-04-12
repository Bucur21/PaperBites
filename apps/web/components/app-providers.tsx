"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "../lib/auth-context";
import { AuthNudgeProvider } from "../lib/auth-nudge-context";
import { BookmarkProvider } from "../lib/bookmark-context";
import { LikesProvider } from "../lib/like-context";
import { SkimModeProvider } from "../lib/skim-mode-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthNudgeProvider>
        <BookmarkProvider>
          <LikesProvider>
            <SkimModeProvider>{children}</SkimModeProvider>
          </LikesProvider>
        </BookmarkProvider>
      </AuthNudgeProvider>
    </AuthProvider>
  );
}
