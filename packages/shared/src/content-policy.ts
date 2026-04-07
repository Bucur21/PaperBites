import type { RightsPolicy } from "./types";

export const CONTENT_RIGHTS_POLICY: RightsPolicy = {
  rawAbstractStorage: "avoid-by-default",
  outboundLinks: "pubmed-and-doi",
  publisherAbstractRedistribution: "restricted",
  generatedSummaryStorageDays: 365,
  sourceMetadataStorageDays: 365,
  rawSnapshotStorageDays: 30
};

export const CONTENT_POLICY_NOTES = [
  "Store PubMed metadata and generated summaries for one year.",
  "Avoid persisting raw publisher-supplied abstracts unless the source is clearly open access and reuse-permissive.",
  "Use raw abstracts transiently for AI summarization when the source allows access, then discard them after processing.",
  "Always provide a direct outbound link to PubMed and, when available, the DOI landing page.",
  "Label AI summaries and AI-generated illustrations clearly and avoid outputs that look like article figures or clinical evidence."
] as const;
