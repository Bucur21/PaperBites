import { resolvePmidsFromProfileUrls } from "./author-urls";
import { getPapersByPubmedSourceIds } from "./db";
import { fetchPaperRecordsFromPubmedEsummaryBatch } from "./pubmed-esummary";
import type { PaperRecord } from "../../../packages/shared/src";

export async function getMyPapersFromUserUrls(urls: string[]): Promise<{ items: PaperRecord[]; notes: string[] }> {
  const { pmids, notes } = await resolvePmidsFromProfileUrls(urls);
  if (pmids.length === 0) return { items: [], notes };

  const fromDb = await getPapersByPubmedSourceIds(pmids);
  const bySourceId = new Map(fromDb.map((p) => [p.sourceId, p]));
  const missing = pmids.filter((p) => !bySourceId.has(p));
  const transient = missing.length > 0 ? await fetchPaperRecordsFromPubmedEsummaryBatch(missing) : [];
  const byTransient = new Map(transient.map((p) => [p.sourceId, p]));

  const items: PaperRecord[] = [];
  for (const pmid of pmids) {
    const a = bySourceId.get(pmid) ?? byTransient.get(pmid);
    if (a) items.push(a);
  }

  return { items, notes };
}
