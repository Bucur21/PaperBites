import type { PaperRecord } from "./types";

/**
 * Removes PubMed/XML parser artifacts and JSON-like fragments from user-facing strings.
 */
export function sanitizeDisplayText(input: string | null | undefined): string {
  if (input == null) {
    return "";
  }

  let s = String(input).trim();
  if (!s) {
    return "";
  }

  if (s.startsWith("{") && s.includes('"#text"')) {
    try {
      const parsed = JSON.parse(s) as { "#text"?: string; [key: string]: unknown };
      if (typeof parsed?.["#text"] === "string") {
        return parsed["#text"].trim();
      }
    } catch {
      /* fall through */
    }
  }

  s = s.replace(/\{"#text"\s*:\s*"((?:\\.|[^"\\])*)"\s*,[^}]*\}/g, (_, inner: string) => inner.replace(/\\"/g, '"'));
  s = s.replace(/\{"#text"\s*:\s*"([^"]+)"\}/g, "$1");

  return s.replace(/\s+/g, " ").trim();
}

export function estimateReadMinutes(text: string, wordsPerMinute = 200): number {
  const words = sanitizeDisplayText(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function sanitizePaperRecord(paper: PaperRecord): PaperRecord {
  const cited =
    paper.citedByCount === undefined || paper.citedByCount === null
      ? paper.citedByCount
      : Math.max(0, Math.floor(Number(paper.citedByCount)) || 0);

  return {
    ...paper,
    citedByCount: cited,
    title: sanitizeDisplayText(paper.title),
    journal: sanitizeDisplayText(paper.journal),
    articleType: sanitizeDisplayText(paper.articleType) || "Article",
    shortSummary: sanitizeDisplayText(paper.shortSummary),
    longSummary: paper.longSummary ? sanitizeDisplayText(paper.longSummary) : null,
    whyItMatters: paper.whyItMatters ? sanitizeDisplayText(paper.whyItMatters) : null,
    takeaway: paper.takeaway ? sanitizeDisplayText(paper.takeaway) : null,
    clinicalImpact: paper.clinicalImpact ? sanitizeDisplayText(paper.clinicalImpact) : null,
    methodQuality: paper.methodQuality ? sanitizeDisplayText(paper.methodQuality) : null,
    whoItsFor: paper.whoItsFor ? sanitizeDisplayText(paper.whoItsFor) : null
  };
}
