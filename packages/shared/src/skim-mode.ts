import { evidenceLevel, studyDesignLabel } from "./study-design";
import type { PaperRecord } from "./types";

export type SkimMode = "clinician" | "researcher" | "founder" | "student";

export const SKIM_MODES: Array<{ id: SkimMode; label: string }> = [
  { id: "clinician", label: "Clinician" },
  { id: "researcher", label: "Researcher" },
  { id: "founder", label: "Founder" },
  { id: "student", label: "Student" }
];

export function getTakeaway(paper: PaperRecord): string {
  return paper.takeaway?.trim() || paper.whyItMatters?.trim() || paper.shortSummary;
}

export function getClinicalImpact(paper: PaperRecord): string {
  if (paper.clinicalImpact?.trim()) return paper.clinicalImpact;
  const level = evidenceLevel(paper.studyDesign);
  if (level === "high") return "Potentially practice-informing evidence, but still verify the full paper before acting.";
  if (level === "moderate") return "Useful for clinical decision support and discussion, though likely not enough on its own to change practice.";
  return "Best treated as directional context rather than immediate practice-changing evidence.";
}

export function getMethodQuality(paper: PaperRecord): string {
  if (paper.methodQuality?.trim()) return paper.methodQuality;
  const design = studyDesignLabel(paper.studyDesign);
  const level = evidenceLevel(paper.studyDesign);
  if (level === "high") return `${design} level evidence, which usually offers stronger methodological confidence than a narrative article.`;
  if (level === "moderate") return `${design} evidence, useful but more sensitive to population, bias, and implementation details.`;
  return `${design} level evidence. Read cautiously and treat the summary as a starting point, not a verdict.`;
}

export function getWhoItsFor(paper: PaperRecord): string {
  if (paper.whoItsFor?.trim()) return paper.whoItsFor;
  if (paper.topicIds.includes("clinical-ml") || paper.topicIds.includes("ai-health")) {
    return "Most useful for clinicians evaluating AI tools, digital health teams, and applied researchers.";
  }
  if (paper.topicIds.includes("rehabilitation") || paper.topicIds.includes("musculoskeletal")) {
    return "Most useful for rehab clinicians, sports medicine teams, and movement-science researchers.";
  }
  return "Most useful for professionals staying current in this specialty, plus students building domain context.";
}

export function getModeLens(mode: SkimMode, paper: PaperRecord): { label: string; text: string } {
  switch (mode) {
    case "clinician":
      return { label: "Clinical impact", text: getClinicalImpact(paper) };
    case "researcher":
      return { label: "Method quality", text: getMethodQuality(paper) };
    case "founder":
      return {
        label: "Why this matters",
        text:
          paper.whyItMatters?.trim() ||
          "Useful for spotting where clinical workflows, diagnostics, or care delivery may be shifting."
      };
    case "student":
      return { label: "Who this is for", text: getWhoItsFor(paper) };
    default:
      return { label: "Takeaway", text: getTakeaway(paper) };
  }
}
