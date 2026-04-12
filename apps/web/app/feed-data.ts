import { createSampleFeed, sanitizePaperRecord, TOPICS } from "@research-feed/shared";
import type { PaperRecord, TopicDefinition, TopicId } from "@research-feed/shared";
import { normalizeTopicParam } from "../lib/feed-topic";
import { enrichPapersWithCitationCounts } from "../lib/openalex-citations";

export { normalizeTopicParam } from "../lib/feed-topic";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function withOpenAlexCitations(papers: PaperRecord[]): Promise<PaperRecord[]> {
  try {
    return await enrichPapersWithCitationCounts(papers);
  } catch {
    return papers;
  }
}

async function withOpenAlexCitation(paper: PaperRecord | null): Promise<PaperRecord | null> {
  if (!paper) return null;
  const enriched = await withOpenAlexCitations([paper]);
  return enriched[0] ?? paper;
}

export async function loadTopics(): Promise<TopicDefinition[]> {
  if (!apiBaseUrl) {
    return TOPICS;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/topics`, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error("Topic request failed");
    }

    const payload = (await response.json()) as { items: TopicDefinition[] };
    return payload.items;
  } catch {
    return TOPICS;
  }
}

async function sampleFeedSlice(
  topic: TopicId | undefined,
  limit: number,
  cursor?: string
): Promise<{ items: PaperRecord[]; nextCursor: string | null }> {
  let items = createSampleFeed()
    .filter((paper) => !topic || paper.topicIds.includes(topic))
    .map(sanitizePaperRecord);
  if (cursor) {
    items = items.filter((item) => item.publishedAt < cursor);
  }
  const slice = items.slice(0, limit);
  const hasMore = slice.length === limit;
  const nextCursor = hasMore ? (slice.at(-1)?.publishedAt ?? null) : null;
  return { items: await withOpenAlexCitations(slice), nextCursor };
}

/** First page of the feed with cursor for infinite scroll. */
export async function loadFeedPage(
  topic?: string,
  options?: { limit?: number }
): Promise<{ items: PaperRecord[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 20;
  const topicId = normalizeTopicParam(topic);

  if (!apiBaseUrl) {
    return await sampleFeedSlice(topicId, limit);
  }

  try {
    const params = new URLSearchParams();
    if (topicId) {
      params.set("topic", topicId);
    }
    if (limit !== 20) {
      params.set("limit", String(limit));
    }

    const response = await fetch(`${apiBaseUrl}/feed?${params.toString()}`, { next: { revalidate: 900 } });
    if (!response.ok) {
      throw new Error("Feed request failed");
    }

    const payload = (await response.json()) as { items: PaperRecord[]; nextCursor: string | null };
    return {
      items: await withOpenAlexCitations(payload.items),
      nextCursor: payload.nextCursor ?? null
    };
  } catch {
    return await sampleFeedSlice(topicId, limit);
  }
}

export async function loadFeed(topic?: string, options?: { limit?: number }): Promise<PaperRecord[]> {
  const { items } = await loadFeedPage(topic, options);
  return items;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Papers published in the last 7 days (fetches a larger window then filters). */
export async function loadWeeklyFeed(topic?: string): Promise<PaperRecord[]> {
  const { items } = await loadFeedPage(topic, { limit: 50 });
  const cutoff = Date.now() - WEEK_MS;
  return items.filter((paper) => new Date(paper.publishedAt).getTime() >= cutoff);
}

/** Most recent first — useful for weekly briefing and “top papers this week”. */
export function sortPapersByPublishedDesc(papers: PaperRecord[]): PaperRecord[] {
  return [...papers].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Ingest slugs end with `-{PMID}`; bare numeric params may also appear. UUID params are paper ids, not PMIDs.
 */
export function tryPubMedIdFromPaperRouteParam(param: string): string | null {
  const decoded = decodeURIComponent(param.trim());
  if (!decoded || UUID_RE.test(decoded)) {
    return null;
  }
  if (/^\d{6,12}$/.test(decoded)) {
    return decoded;
  }
  const tail = decoded.match(/-(\d{6,12})$/);
  return tail?.[1] ?? null;
}

export async function searchPapers(query: string, limit = 20): Promise<PaperRecord[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!apiBaseUrl) {
    const lower = trimmed.toLowerCase();
    const rows = createSampleFeed()
      .filter((p) => p.title.toLowerCase().includes(lower) || p.shortSummary.toLowerCase().includes(lower))
      .slice(0, limit)
      .map(sanitizePaperRecord);
    return withOpenAlexCitations(rows);
  }

  try {
    const params = new URLSearchParams({ q: trimmed, limit: String(limit) });
    const response = await fetch(`${apiBaseUrl}/search?${params.toString()}`, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error("Search request failed");
    const payload = (await response.json()) as { items: PaperRecord[] };
    return withOpenAlexCitations(payload.items);
  } catch {
    const lower = trimmed.toLowerCase();
    const rows = createSampleFeed()
      .filter((p) => p.title.toLowerCase().includes(lower) || p.shortSummary.toLowerCase().includes(lower))
      .slice(0, limit)
      .map(sanitizePaperRecord);
    return withOpenAlexCitations(rows);
  }
}

export async function loadRelatedPapers(paperId: string): Promise<PaperRecord[]> {
  if (!apiBaseUrl) {
    const all = createSampleFeed();
    const paper = all.find((p) => p.id === paperId);
    if (!paper) return [];
    const rows = all
      .filter((p) => p.id !== paperId && p.topicIds.some((t) => paper.topicIds.includes(t)))
      .slice(0, 4)
      .map(sanitizePaperRecord);
    return withOpenAlexCitations(rows);
  }

  try {
    const response = await fetch(`${apiBaseUrl}/papers/${encodeURIComponent(paperId)}/related`, { next: { revalidate: 900 } });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items: PaperRecord[] };
    return withOpenAlexCitations(payload.items);
  } catch {
    return [];
  }
}

export async function loadPaper(slugOrId: string): Promise<PaperRecord | null> {
  const key = decodeURIComponent(slugOrId.trim());

  if (!apiBaseUrl) {
    const found = createSampleFeed().find((paper) => paper.slug === key || paper.id === key);
    return withOpenAlexCitation(found ? sanitizePaperRecord(found) : null);
  }

  try {
    const response = await fetch(`${apiBaseUrl}/papers/${encodeURIComponent(key)}`, { next: { revalidate: 900 } });
    if (!response.ok) {
      throw new Error("Paper request failed");
    }

    const payload = (await response.json()) as { item: PaperRecord };
    return withOpenAlexCitation(payload.item);
  } catch {
    const found = createSampleFeed().find((paper) => paper.slug === key || paper.id === key);
    return withOpenAlexCitation(found ? sanitizePaperRecord(found) : null);
  }
}
