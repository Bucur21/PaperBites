const ORCID_RE = /(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i;

export function extractOrcidIdFromUrl(url: string): string | null {
  try {
    const u = url.trim();
    const m = u.match(ORCID_RE);
    return m ? m[1]!.toUpperCase() : null;
  } catch {
    return null;
  }
}

function collectExternalIds(node: unknown, out: Set<string>): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const x of node) collectExternalIds(x, out);
    return;
  }
  if (typeof node !== "object") return;

  const o = node as Record<string, unknown>;
  if ("external-id-type" in o && "external-id-value" in o) {
    const type = String(o["external-id-type"] ?? "").toLowerCase();
    const val = String(o["external-id-value"] ?? "").trim();
    if (type === "pmid" && /^\d{5,10}$/.test(val)) {
      out.add(val);
    }
  }

  for (const v of Object.values(o)) {
    collectExternalIds(v, out);
  }
}

/** Public ORCID works API — returns PubMed IDs when listed on the profile. */
export async function fetchPmidsFromOrcidWorks(orcid: string): Promise<string[]> {
  const clean = orcid.trim().toUpperCase();
  if (!ORCID_RE.test(clean)) return [];

  const url = `https://pub.orcid.org/v3.0/${encodeURIComponent(clean)}/works`;
  const mail = process.env.PUBMED_EMAIL ?? "research-feed@example.com";
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": `PaperBites/1.0 (mailto:${mail})`
    }
  });

  if (!res.ok) return [];

  const json = (await res.json()) as unknown;
  const pmids = new Set<string>();
  collectExternalIds(json, pmids);
  return [...pmids];
}
