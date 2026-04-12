import { classifyStudyDesign, rankTopicIds, sanitizePaperRecord } from "../../../packages/shared/src";
import type { PaperAuthor, PaperRecord, TopicId } from "../../../packages/shared/src";

const PMID_INLINE = /^(\d{5,10})$/;
const PMID_SUFFIX = /-(\d{5,10})$/;

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

function parseAuthors(raw: unknown): PaperAuthor[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const out: PaperAuthor[] = [];
  let pos = 1;
  for (const a of list) {
    if (typeof a === "object" && a !== null && "name" in a && typeof (a as { name: string }).name === "string") {
      const name = (a as { name: string }).name.trim();
      const parts = name.split(/\s+/);
      const family = parts[0] ?? name;
      const given = parts.slice(1).join(" ") || ".";
      out.push({ family, given, position: pos++ });
    }
  }
  return out;
}

function textField(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "#text" in v) {
    const t = (v as { "#text"?: unknown })["#text"];
    return typeof t === "string" ? t : String(t ?? "");
  }
  return "";
}

function parsePubDate(sortpubdate: string | undefined, pubdate: string | undefined): string {
  const raw = sortpubdate ?? pubdate ?? "";
  const m = raw.match(/^(\d{4})\//);
  if (m) {
    return new Date(`${m[1]}-01-01T12:00:00.000Z`).toISOString();
  }
  const y = raw.match(/(\d{4})/);
  if (y) {
    return new Date(`${y[1]}-01-01T12:00:00.000Z`).toISOString();
  }
  return new Date().toISOString();
}

function getEutilsParams() {
  const params = new URLSearchParams({
    db: "pubmed",
    tool: process.env.PUBMED_TOOL ?? "research-feed-app",
    email: process.env.PUBMED_EMAIL ?? "research-feed@example.com",
    retmode: "json"
  });
  if (process.env.PUBMED_API_KEY) {
    params.set("api_key", process.env.PUBMED_API_KEY);
  }
  return params;
}

/** Build a PaperRecord from PubMed when the row is not in our database (summary from PubMed metadata). */
export async function fetchPaperRecordFromPubmedEsummary(pmid: string): Promise<PaperRecord | null> {
  if (!PMID_INLINE.test(pmid.trim())) return null;

  const params = getEutilsParams();
  params.set("id", pmid.trim());

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const json = (await res.json()) as {
    result?: Record<string, unknown> & { uids?: string[] };
  };
  const result = json.result;
  if (!result?.uids?.length) return null;

  const uid = result.uids[0]!;
  const row = result[uid] as Record<string, unknown> | undefined;
  if (!row || typeof row !== "object") return null;

  const title = textField(row.title);
  if (!title) return null;

  const journal = textField(row.source) || textField(row.fulljournalname) || "PubMed";
  const pubdate = parsePubDate(
    typeof row.sortpubdate === "string" ? row.sortpubdate : undefined,
    typeof row.pubdate === "string" ? row.pubdate : undefined
  );
  const authors = parseAuthors(row.authors);

  const slugBase = slugifyTitle(title) || "article";
  const slug = `${slugBase}-${pmid.trim()}`;

  const articleType = "Article";
  const shortSummary =
    "Summary is not in PaperBites yet — open PubMed for the abstract. You can still save this link from your bookmarks when the paper is ingested.";
  const takeaway = "Quick takeaway: relevant enough to scan now, but the full source is still the best place to judge importance.";

  const record: PaperRecord = {
    id: `pubmed-${pmid.trim()}`,
    slug,
    sourceId: pmid.trim(),
    sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid.trim()}/`,
    doiUrl: null,
    journal,
    title,
    publishedAt: pubdate,
    articleType,
    studyDesign: classifyStudyDesign(articleType, title),
    topicIds: [] as TopicId[],
    authors,
    shortSummary,
    longSummary: null,
    whyItMatters: null,
    takeaway,
    clinicalImpact: "Potentially useful for awareness, but clinical implications require reading the original paper.",
    methodQuality: "Method quality is not assessed yet because this paper has not been fully enriched in PaperBites.",
    whoItsFor: "Best for readers who want a first-pass scan before opening PubMed.",
    imageUrl: null,
    openAccess: false,
    abstractAvailable: true,
    source: "pubmed"
  };

  return sanitizePaperRecord({ ...record, topicIds: rankTopicIds(record.topicIds) });
}

export async function fetchPaperRecordsFromPubmedEsummaryBatch(pmids: string[]): Promise<PaperRecord[]> {
  const clean = [...new Set(pmids.map((p) => p.trim()).filter((p) => PMID_INLINE.test(p)))];
  if (clean.length === 0) return [];

  const params = getEutilsParams();
  params.set("id", clean.join(","));

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const json = (await res.json()) as {
    result?: Record<string, unknown> & { uids?: string[] };
  };
  const result = json.result;
  if (!result?.uids?.length) return [];

  const out: PaperRecord[] = [];
  for (const uid of result.uids) {
    const row = result[uid] as Record<string, unknown> | undefined;
    if (!row || typeof row !== "object") continue;
    const title = textField(row.title);
    if (!title) continue;

    const journal = textField(row.source) || textField(row.fulljournalname) || "PubMed";
    const pubdate = parsePubDate(
      typeof row.sortpubdate === "string" ? row.sortpubdate : undefined,
      typeof row.pubdate === "string" ? row.pubdate : undefined
    );
    const authors = parseAuthors(row.authors);
    const slugBase = slugifyTitle(title) || "article";
    const slug = `${slugBase}-${uid}`;
    const articleType = "Article";
    const shortSummary =
      "Summary is not in PaperBites yet — open PubMed for the abstract. Papers ingested into PaperBites will show full summaries here.";
    const takeaway = "Quick takeaway: this looks worth a skim, but PaperBites has not enriched it fully yet.";

    const record: PaperRecord = {
      id: `pubmed-${uid}`,
      slug,
      sourceId: uid,
      sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
      doiUrl: null,
      journal,
      title,
      publishedAt: pubdate,
      articleType,
      studyDesign: classifyStudyDesign(articleType, title),
      topicIds: [] as TopicId[],
      authors,
      shortSummary,
      longSummary: null,
      whyItMatters: null,
      takeaway,
      clinicalImpact: "Potentially useful for awareness, but practical impact should be judged from the original paper.",
      methodQuality: "Method quality is not assessed yet because this paper has not been fully enriched in PaperBites.",
      whoItsFor: "Best for readers who want a quick source-first scan from PubMed metadata.",
      imageUrl: null,
      openAccess: false,
      abstractAvailable: true,
      source: "pubmed"
    };
    out.push(sanitizePaperRecord({ ...record, topicIds: rankTopicIds(record.topicIds) }));
  }
  return out;
}

export function extractPmidFromSlugOrId(param: string): string | null {
  const t = param.trim();
  if (PMID_INLINE.test(t)) return t;
  const m = t.match(PMID_SUFFIX);
  if (m) return m[1]!;
  if (t.startsWith("pubmed-")) {
    const rest = t.slice("pubmed-".length);
    if (PMID_INLINE.test(rest)) return rest;
  }
  return null;
}
