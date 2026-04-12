/**
 * PubMed publication types are not a perfect proxy for peer review, but they help users
 * distinguish primary research-ish items from editorials, letters, and news.
 */
export type PeerReviewDisplay = {
  /** Short label for UI chips */
  label: string;
  /** Visual emphasis */
  variant: "likely" | "unlikely" | "unknown";
};

const NON_PEER_KEYWORDS =
  /\b(editorial|letter|news|newspaper|comment|interview|video|audio|biography|historical article|patient education|introductory journal article|published erratum|retraction|expression of concern|dataset|software|web article)\b/i;

const PEER_KEYWORDS =
  /\b(journal article|clinical trial|clinical study|randomized controlled trial|multicenter study|meta-analysis|systematic review|comparative study|observational study|validation study|evaluation study|twin study|cohort|case-control|cross-sectional|case reports|multicenter|research support)\b/i;

/**
 * Infer whether a PubMed-style publication type is likely peer-reviewed journal content.
 */
export function inferPeerReviewDisplay(articleType: string): PeerReviewDisplay {
  const t = articleType.trim();
  if (!t || t === "Article" || t === "Unknown") {
    return { label: "Review unknown", variant: "unknown" };
  }

  if (NON_PEER_KEYWORDS.test(t)) {
    return { label: "Unlikely peer-reviewed", variant: "unlikely" };
  }

  if (PEER_KEYWORDS.test(t)) {
    return { label: "Likely peer-reviewed", variant: "likely" };
  }

  // Whole-type shortcuts (sample data / simplified labels)
  if (/^(review|clinical study|research article|original article)$/i.test(t)) {
    return { label: "Likely peer-reviewed", variant: "likely" };
  }

  return { label: "Review unknown", variant: "unknown" };
}
