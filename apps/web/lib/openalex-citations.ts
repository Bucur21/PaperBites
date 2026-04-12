import type { PaperRecord } from "@research-feed/shared";

/** Extract normalized DOI (e.g. 10.1234/abc) from a DOI URL or bare DOI string. */
export function extractDoiFromDoiUrl(doiUrl: string | null | undefined): string | null {
  if (!doiUrl) return null;
  const trimmed = doiUrl.trim();
  const direct = trimmed.match(/^(?:https?:\/\/(?:dx\.)?doi\.org\/)?(10\.\d{4,9}\/[^\s?#]+)/i);
  if (direct) return decodeURIComponent(direct[1]);
  try {
    const u = new URL(trimmed);
    if (u.hostname.endsWith("doi.org")) {
      return decodeURIComponent(u.pathname.replace(/^\//, ""));
    }
  } catch {
    /* ignore */
  }
  return null;
}

function normalizeDoiKey(doi: string): string {
  return doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").toLowerCase();
}

type OpenAlexResponse = {
  results?: Array<{ doi?: string | null; cited_by_count?: number }>;
};

const OPENALEX_USER_AGENT =
  typeof process !== "undefined" && process.env.OPENALEX_MAILTO
    ? `mailto:${process.env.OPENALEX_MAILTO}`
    : "PaperBites/1.0 (mailto:support@paperbites.local)";

function openAlexFetchInit(): RequestInit & { next?: { revalidate: number } } {
  const headers: Record<string, string> = { Accept: "application/json" };
  // Browsers forbid setting User-Agent; OpenAlex still accepts anonymous requests.
  if (typeof window === "undefined") {
    headers["User-Agent"] = OPENALEX_USER_AGENT;
  }
  const init: RequestInit & { next?: { revalidate: number } } = { headers };
  if (typeof window === "undefined") {
    init.next = { revalidate: 86_400 };
  }
  return init;
}

/**
 * Batch-fetch cited-by counts from OpenAlex (no API key; be polite with User-Agent).
 */
export async function fetchCitedByCountsByDoi(dois: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const unique = [...new Set(dois.map((d) => normalizeDoiKey(d)).filter((d) => d.startsWith("10.")))];
  const chunkSize = 25;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const filter = chunk.map((d) => `doi:${d}`).join("|");
    const url = `https://api.openalex.org/works?filter=${encodeURIComponent(filter)}&per_page=${Math.min(50, chunk.length + 5)}`;

    try {
      const res = await fetch(url, openAlexFetchInit());
      if (!res.ok) continue;
      const json = (await res.json()) as OpenAlexResponse;
      for (const w of json.results ?? []) {
        const rawDoi = w.doi;
        if (!rawDoi) continue;
        const key = normalizeDoiKey(rawDoi.replace(/^https?:\/\/doi\.org\//i, ""));
        out.set(key, typeof w.cited_by_count === "number" ? w.cited_by_count : 0);
      }
    } catch {
      /* ignore network / parse errors */
    }
  }

  return out;
}

/** Merge OpenAlex cited-by counts into paper records when a DOI is present. */
export async function enrichPapersWithCitationCounts<T extends PaperRecord>(papers: T[]): Promise<T[]> {
  if (papers.length === 0) return papers;

  const dois: string[] = [];
  for (const p of papers) {
    const d = extractDoiFromDoiUrl(p.doiUrl);
    if (d) dois.push(d);
  }
  if (dois.length === 0) return papers;

  const counts = await fetchCitedByCountsByDoi(dois);

  return papers.map((p) => {
    const d = extractDoiFromDoiUrl(p.doiUrl);
    if (!d) return p;
    const n = counts.get(normalizeDoiKey(d));
    if (n === undefined) return p;
    return { ...p, citedByCount: n };
  });
}
