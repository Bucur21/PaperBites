export type TopicId =
  | "biomechanics"
  | "ai-health"
  | "rehabilitation"
  | "wearables"
  | "sports-performance"
  | "musculoskeletal"
  | "digital-biomarkers"
  | "clinical-ml";

export type ContentRights = "metadata-only" | "summary-only" | "oa-abstract-ok";

export type TopicGroup = "movement-science" | "clinical-ai" | "digital-health";

export interface TopicDefinition {
  id: TopicId;
  label: string;
  group: TopicGroup;
  description: string;
  pubmedQuery: string;
  priority: number;
  keywords: string[];
}

export interface RightsPolicy {
  rawAbstractStorage: "avoid-by-default" | "allow-for-open-access";
  outboundLinks: "pubmed-and-doi";
  publisherAbstractRedistribution: "restricted";
  generatedSummaryStorageDays: number;
  sourceMetadataStorageDays: number;
  rawSnapshotStorageDays: number;
}

export type StudyDesign =
  | "systematic-review"
  | "meta-analysis"
  | "rct"
  | "cohort"
  | "case-control"
  | "cross-sectional"
  | "case-report"
  | "review"
  | "editorial"
  | "other";

export interface PaperAuthor {
  given: string;
  family: string;
  position: number;
}

export interface PaperRecord {
  id: string;
  slug: string;
  sourceId: string;
  sourceUrl: string;
  doiUrl: string | null;
  journal: string;
  title: string;
  publishedAt: string;
  articleType: string;
  studyDesign: StudyDesign | null;
  topicIds: TopicId[];
  authors: PaperAuthor[];
  shortSummary: string;
  longSummary: string | null;
  whyItMatters: string | null;
  takeaway: string | null;
  clinicalImpact: string | null;
  methodQuality: string | null;
  whoItsFor: string | null;
  imageUrl: string | null;
  openAccess: boolean;
  abstractAvailable: boolean;
  source: "pubmed" | "europepmc";
  /**
   * Times this work was cited (third-party index, often OpenAlex). Omitted when unknown.
   */
  citedByCount?: number | null;
}
