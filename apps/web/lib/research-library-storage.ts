const RECENT_KEY = "paperbites-library-recent";
const CONTINUE_KEY = "paperbites-library-continue";
const CHANGE_EVENT = "paperbites-research-library-change";

export const MAX_RECENT_VIEWS = 20;
const MIN_SCROLL_FOR_CONTINUE = 100;
const CONTINUE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type RecentViewEntry = { id: string; slug: string; at: number };

export type ContinueEntry = {
  scrollY: number;
  openedAt: number;
};

type ContinueStore = { byId: Record<string, ContinueEntry> };

function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function readRecent(): RecentViewEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (v): v is RecentViewEntry =>
          typeof v === "object" &&
          v !== null &&
          typeof (v as RecentViewEntry).id === "string" &&
          typeof (v as RecentViewEntry).slug === "string" &&
          typeof (v as RecentViewEntry).at === "number"
      )
      .slice(0, MAX_RECENT_VIEWS);
  } catch {
    return [];
  }
}

function writeRecent(entries: RecentViewEntry[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(entries.slice(0, MAX_RECENT_VIEWS)));
    emitChange();
  } catch {
    /* ignore */
  }
}

export function recordPaperView(id: string, slug: string) {
  if (typeof window === "undefined" || !id || !slug) return;
  const prev = readRecent();
  const next = [{ id, slug, at: Date.now() }, ...prev.filter((e) => e.id !== id)];
  writeRecent(next);

  const cont = readContinueStore();
  const existing = cont.byId[id];
  cont.byId[id] = {
    scrollY: existing?.scrollY ?? 0,
    openedAt: Date.now()
  };
  writeContinueStore(cont);
}

export function getRecentViews(): RecentViewEntry[] {
  if (typeof window === "undefined") return [];
  return readRecent();
}

function readContinueStore(): ContinueStore {
  try {
    const raw = localStorage.getItem(CONTINUE_KEY);
    if (!raw) return { byId: {} };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || !("byId" in parsed)) {
      return { byId: {} };
    }
    const byId = (parsed as ContinueStore).byId;
    if (typeof byId !== "object" || byId === null) return { byId: {} };
    return { byId: { ...byId } };
  } catch {
    return { byId: {} };
  }
}

function writeContinueStore(store: ContinueStore) {
  try {
    localStorage.setItem(CONTINUE_KEY, JSON.stringify(store));
    emitChange();
  } catch {
    /* ignore */
  }
}

export function updatePaperScrollY(id: string, scrollY: number) {
  if (typeof window === "undefined" || !id) return;
  const cont = readContinueStore();
  const prev = cont.byId[id] ?? { scrollY: 0, openedAt: Date.now() };
  cont.byId[id] = { ...prev, scrollY: Math.max(0, scrollY) };
  writeContinueStore(cont);
}

export function getContinueEntry(id: string): ContinueEntry | null {
  if (typeof window === "undefined") return null;
  const e = readContinueStore().byId[id];
  if (!e) return null;
  return e;
}

export function listContinuePaperIds(): string[] {
  if (typeof window === "undefined") return [];
  const { byId } = readContinueStore();
  const now = Date.now();
  return Object.entries(byId)
    .filter(([id, e]) => {
      if (!id) return false;
      if (e.scrollY >= MIN_SCROLL_FOR_CONTINUE) return true;
      if (now - e.openedAt > CONTINUE_MAX_AGE_MS) return false;
      return e.scrollY > 0;
    })
    .sort((a, b) => b[1].openedAt - a[1].openedAt)
    .map(([id]) => id);
}

export function subscribeResearchLibrary(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
