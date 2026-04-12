import type { StudyDesign } from "./types";

const DESIGN_RULES: Array<{ pattern: RegExp; design: StudyDesign }> = [
  { pattern: /\bmeta[\s-]?analysis\b/i, design: "meta-analysis" },
  { pattern: /\bsystematic review\b/i, design: "systematic-review" },
  { pattern: /\brandomized controlled trial\b|\brct\b/i, design: "rct" },
  { pattern: /\bcohort\b/i, design: "cohort" },
  { pattern: /\bcase[\s-]?control\b/i, design: "case-control" },
  { pattern: /\bcross[\s-]?sectional\b/i, design: "cross-sectional" },
  { pattern: /\bcase report\b|\bcase series\b/i, design: "case-report" },
  { pattern: /\breview\b/i, design: "review" },
  { pattern: /\beditorial\b|\bcommentary\b|\bletter\b/i, design: "editorial" }
];

export function classifyStudyDesign(articleType: string, title: string): StudyDesign {
  const blob = `${articleType}\n${title}`;
  for (const rule of DESIGN_RULES) {
    if (rule.pattern.test(blob)) {
      return rule.design;
    }
  }
  return "other";
}

const DESIGN_LABELS: Record<StudyDesign, string> = {
  "systematic-review": "Systematic Review",
  "meta-analysis": "Meta-Analysis",
  rct: "RCT",
  cohort: "Cohort Study",
  "case-control": "Case-Control",
  "cross-sectional": "Cross-Sectional",
  "case-report": "Case Report",
  review: "Review",
  editorial: "Editorial",
  other: "Article"
};

export function studyDesignLabel(design: StudyDesign | null): string {
  return design ? DESIGN_LABELS[design] ?? "Article" : "Article";
}

const EVIDENCE_RANK: Record<StudyDesign, number> = {
  "meta-analysis": 1,
  "systematic-review": 2,
  rct: 3,
  cohort: 4,
  "case-control": 5,
  "cross-sectional": 6,
  "case-report": 7,
  review: 8,
  editorial: 9,
  other: 10
};

export function evidenceLevel(design: StudyDesign | null): "high" | "moderate" | "low" | "unknown" {
  if (!design) return "unknown";
  const rank = EVIDENCE_RANK[design];
  if (rank <= 3) return "high";
  if (rank <= 6) return "moderate";
  return "low";
}
