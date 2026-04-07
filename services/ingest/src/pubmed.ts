import { XMLParser } from "fast-xml-parser";
import { TOPICS } from "../../../packages/shared/src";
import type { TopicDefinition } from "../../../packages/shared/src";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (name) => ["PubmedArticle", "PubDate", "ArticleId", "PublicationType", "AbstractText"].includes(name)
});

const MONTH_MAP: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12"
};

let lastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttledFetch(url: string, init?: RequestInit, attempt = 0): Promise<Response> {
  const minDelayMs = process.env.PUBMED_API_KEY ? 120 : 400;
  const elapsed = Date.now() - lastRequestAt;

  if (elapsed < minDelayMs) {
    await sleep(minDelayMs - elapsed);
  }

  const response = await fetch(url, init);
  lastRequestAt = Date.now();

  if (response.status === 429 && attempt < 4) {
    const retryAfterSeconds = Number(response.headers.get("retry-after") ?? "0");
    const backoffMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 1000 * (attempt + 1);
    await sleep(backoffMs);
    return throttledFetch(url, init, attempt + 1);
  }

  return response;
}

function normalizeMonth(value: string) {
  const trimmed = value.slice(0, 3);
  return MONTH_MAP[trimmed] ?? value.padStart(2, "0");
}

function textFromValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const text = (value as { "#text"?: unknown })["#text"];
    if (typeof text === "string" || typeof text === "number") {
      return String(text);
    }
  }

  return "";
}

function getBaseParams() {
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

export async function searchPmids(topic: TopicDefinition, daysBack = 7) {
  const params = getBaseParams();
  params.set("term", topic.pubmedQuery);
  params.set("reldate", String(daysBack));
  params.set("datetype", "pdat");
  params.set("retmax", "25");
  params.set("sort", "pub_date");

  const response = await throttledFetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`PubMed search failed for ${topic.id}: ${response.status}`);
  }

  const payload = (await response.json()) as {
    esearchresult: { idlist: string[] };
  };

  return payload.esearchresult.idlist;
}

export async function fetchPaperDetails(pmids: string[]) {
  if (!pmids.length) {
    return [];
  }

  const params = getBaseParams();
  params.set("db", "pubmed");
  params.set("id", pmids.join(","));
  params.set("retmode", "xml");

  const response = await throttledFetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`PubMed efetch failed: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as {
    PubmedArticleSet?: {
      PubmedArticle?: Array<{
        MedlineCitation?: {
          PMID?: string;
          Article?: {
            ArticleTitle?: string;
            Abstract?: { AbstractText?: Array<string | { "#text"?: string }> };
            Journal?: { Title?: string; JournalIssue?: { PubDate?: Array<Record<string, string>> } };
            PublicationTypeList?: { PublicationType?: string[] };
          };
        };
        PubmedData?: {
          ArticleIdList?: { ArticleId?: Array<{ IdType?: string; "#text"?: string }> };
        };
      }>;
    };
  };

  const articles = parsed.PubmedArticleSet?.PubmedArticle ?? [];

  return articles.map((article) => {
    const citation = article.MedlineCitation;
    const details = citation?.Article;
    const ids = article.PubmedData?.ArticleIdList?.ArticleId ?? [];
    const doi = ids.find((entry) => entry.IdType === "doi")?.["#text"] ?? null;
    const publicationType = details?.PublicationTypeList?.PublicationType?.[0] ?? "Article";
    const pubDate = details?.Journal?.JournalIssue?.PubDate?.[0] ?? {};
    const year = pubDate.Year ?? new Date().getUTCFullYear().toString();
    const month = normalizeMonth(pubDate.Month ?? "01");
    const day = pubDate.Day ?? "01";
    const abstractText = (details?.Abstract?.AbstractText ?? [])
      .map((entry) => (typeof entry === "string" ? entry : entry["#text"] ?? ""))
      .join(" ")
      .trim();

    return {
      sourceId: textFromValue(citation?.PMID),
      title: textFromValue(details?.ArticleTitle) || "Untitled article",
      journal: textFromValue(details?.Journal?.Title) || "Unknown journal",
      publishedAt: new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00Z`),
      articleType: publicationType,
      doi,
      doiUrl: doi ? `https://doi.org/${doi}` : null,
      sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${textFromValue(citation?.PMID)}/`,
      abstractAvailable: Boolean(abstractText),
      abstractText,
      openAccess: false,
      snapshot: article
    };
  });
}

export function matchTopicsFromText(text: string) {
  const lowerText = text.toLowerCase();

  return TOPICS.filter((topic) =>
    topic.keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()))
  ).map((topic) => topic.id);
}
