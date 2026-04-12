# What’s done vs. not (from your lists)

This document tracks Product ideas, UX/UI ideas, and trust/ranking ideas against the PaperBites codebase.

**Key files:** [`feed-card.tsx`](../apps/web/components/feed-card.tsx), [`saved-client.tsx`](../apps/web/app/saved/saved-client.tsx), [`paper-reading-tracker.tsx`](../apps/web/components/paper-reading-tracker.tsx), [`research-library-storage.ts`](../apps/web/lib/research-library-storage.ts), [`use-research-library.ts`](../apps/web/lib/use-research-library.ts), [`like-context.tsx`](../apps/web/lib/like-context.tsx), [`for-you-client.tsx`](../apps/web/app/for-you/for-you-client.tsx), [`skim-mode.ts`](../packages/shared/src/skim-mode.ts), [`paper-why-care-panel.tsx`](../apps/web/components/paper-why-care-panel.tsx), [`auth-nudge-context.tsx`](../apps/web/lib/auth-nudge-context.tsx), [`bookmark-context.tsx`](../apps/web/lib/bookmark-context.tsx).

---

## Product ideas

### 1. “Research Library” (Saved)

| Idea | Status |
|------|--------|
| Saved papers | **Done** — `SavedClient` loads bookmarks and shows `FeedCard` grid; page titled “Library”. |
| My papers (ORCID / PubMed URLs) | **Done (basic)** — profile URLs + checkbox + `/me/my-papers` when `hasPublications`. |
| Recently viewed | **Done (local)** — last N paper ids in `localStorage` via `research-library-storage` / `useRecentViews`; recorded on paper detail (`PaperReadingTracker`). |
| Liked (as a library section) | **Done** — `useLikes` (local + `/me/likes` when signed in); “Liked papers” section on Library. |
| Collections / folders | **Not done** — no data model or UI. |
| Continue reading | **Done (MVP, local)** — scroll position per paper in `localStorage`; restore on open; “Continue reading” section + `shelfHint` on `FeedCard`. |
| “Because you saved this” recommendations | **Not done** — no reco engine or section. |

### 2. “Why should I care?” workflow

| Idea | Status |
|------|--------|
| `whyItMatters` + takeaways | **Done** — `getTakeaway`, cards show “One-line takeaway”; detail has full panel. |
| Clinical impact / method quality / who it’s for | **Done** — paper detail `PaperWhyCarePanel` shows all four; feed uses mode lens from `getModeLens`. |
| Skim modes (clinician, researcher, founder, student) | **Done** — `SKIM_MODES`, `SkimModeSwitcher`; founder maps to “Why this matters” (minor naming vs “investor”). |

### 3. Author identity / growth loop

| Idea | Status |
|------|--------|
| Link ORCID / PubMed → “My papers” | **Done (ingestion path)** — Saved “Author profile links” + API. |
| “Claim your profile” / public profile UX | **Not done** — no dedicated claim flow or public profile page. |
| Track **your** citations / mentions | **Not done** — OpenAlex cited-by on **papers**, not author-level dashboards. |
| Follow authors | **Not done** — no follow graph. |
| “Who else in your niche” / similar authors | **Not done** — no social graph or similar-author feed. |
| “New papers by authors similar to you” | **Not done** — For you is topic-based only, not author-similarity. |

---

## UX / UI ideas

### 1. Save / like on feed cards

**Done** — `FeedCard` includes `BookmarkButton` and `LikeButton` on the card.

### 2. Contextual auth (not a separate wall)

| Trigger | Status |
|---------|--------|
| After first topic selection (guest) | **Done** — `tryNudge("interests")` in `for-you-client.tsx`. |
| After first save / several likes (guest) | **Done** — `tryNudge("first_save")` when first local bookmark is added; `tryNudge("likes_warm")` when guest has 3+ local likes (see bookmark/like contexts). |
| Gate bookmark/like when logged out | **Done** — `openValueModal("gate_bookmark")` / `gate_like` on click. |

### 3. Empty states → guided actions

| Surface | Status |
|---------|--------|
| Saved empty | **Partial** — message + curated feed starters (`/feed?limit=6` with sample fallback) and Save on cards; same pattern for empty Liked when Saved already has items. |
| For you (no topics) | **Partial** — short text + link home; no “pick 3 starter topics” pattern. |
| My papers empty | **Partial** — explains ORCID/PubMed; no single highlighted example URL block. |
| Search empty | **Partial** — “try different keywords” only; no suggested queries/filters. |

### 4. Trust design

| Idea | Status |
|------|--------|
| Evidence / study design on cards | **Done** — `EvidenceBadge` + topic chips. |
| Peer-review + citations | **Done** — `PaperEvidenceMeta`, OpenAlex enrichment. |
| Clear “AI summary vs metadata” disclosure | **Not done** — no prominent policy line on paper page. |
| Consistent PubMed / DOI / open hierarchy | **Partial** — links exist; not one standardized “trust strip” everywhere. |
| Study **sponsor / funding** | **Not done** — no field on `PaperRecord`, no ingest/UI. |

---

## Summary

**Largely implemented:** feed save/like on cards, skim modes and why-care panel, Saved + My papers ORCID path, topic-based For you, evidence/peer/cites on cards.

**Partial:** empty states, trust links without full AI disclosure, broader auth milestones beyond the nudges above.

**Not implemented:** collections, server-backed reading history, save-based recommendations; author graph and discovery; funding field; fuller empty states beyond Library starters.

---

## Follow-up priorities (when you choose scope)

1. Research Library — collections, cloud reading history, save-based recommendations (liked / recent / continue are implemented locally).
2. Growth / identity — profiles, follows, author-based discovery.
3. Trust — explicit AI-vs-metadata labeling; funding/sponsor when data exists.
4. Richer empty states — curated starters per surface.
