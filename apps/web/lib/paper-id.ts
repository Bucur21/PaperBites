/** Paper rows in the database use UUID ids; PubMed-only fallbacks use `pubmed-{pmid}`. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDatabasePaperId(id: string): boolean {
  return UUID_RE.test(id);
}
