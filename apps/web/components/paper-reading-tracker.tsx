"use client";

import { useEffect, useRef } from "react";
import { recordPaperView, updatePaperScrollY, getContinueEntry } from "../lib/research-library-storage";

const SCROLL_SAVE_MS = 450;
const RESTORE_MIN = 120;

export function PaperReadingTracker({ paperId, slug }: { paperId: string; slug: string }) {
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const restored = useRef(false);

  useEffect(() => {
    recordPaperView(paperId, slug);
  }, [paperId, slug]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = getContinueEntry(paperId);
    if (!restored.current && saved && saved.scrollY >= RESTORE_MIN) {
      restored.current = true;
      const run = () => window.scrollTo({ top: saved.scrollY, behavior: "auto" });
      requestAnimationFrame(run);
      queueMicrotask(run);
    }

    const onScroll = () => {
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        updatePaperScrollY(paperId, window.scrollY);
      }, SCROLL_SAVE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      updatePaperScrollY(paperId, window.scrollY);
    };
  }, [paperId]);

  return null;
}
