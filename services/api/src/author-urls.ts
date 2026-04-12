import { extractOrcidIdFromUrl, fetchPmidsFromOrcidWorks } from "./orcid-works";

export function extractPmidFromPubmedArticleUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (!host.includes("nih.gov")) return null;
    const m = u.pathname.match(/\/(\d{5,10})(?:\/|$)/);
    return m ? m[1]! : null;
  } catch {
    return null;
  }
}

export async function resolvePmidsFromProfileUrls(
  urls: string[]
): Promise<{ pmids: string[]; notes: string[] }> {
  const pmids = new Set<string>();
  const notes: string[] = [];

  for (const raw of urls) {
    const url = raw.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      if (url) notes.push(`Skipped invalid URL (use https): ${url.slice(0, 60)}…`);
      continue;
    }

    const orcid = extractOrcidIdFromUrl(url);
    if (orcid) {
      const list = await fetchPmidsFromOrcidWorks(orcid);
      for (const p of list) pmids.add(p);
      if (list.length === 0) {
        notes.push(`No PubMed-linked works found for ORCID profile (works may be private or use DOI only).`);
      }
      continue;
    }

    const pmid = extractPmidFromPubmedArticleUrl(url);
    if (pmid) {
      pmids.add(pmid);
      continue;
    }

    notes.push(
      "Unsupported link format. Use an ORCID profile URL (orcid.org/…-…-…-…) or a PubMed article URL containing the PMID."
    );
  }

  return { pmids: [...pmids], notes };
}
