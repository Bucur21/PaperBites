import { TOPICS } from "./topics";
import type { PaperRecord, TopicId } from "./types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SAMPLE_TITLES: Record<TopicId, string[]> = {
  biomechanics: [
    "Wearable gait metrics reveal recovery trends after ACL reconstruction",
    "Lower-limb loading asymmetry in recreational runners"
  ],
  "ai-health": [
    "Lightweight multimodal model improves inpatient risk stratification",
    "Large language model support for radiology workflow triage"
  ],
  rehabilitation: [
    "Home-based neurorehabilitation program improves upper-limb adherence",
    "Virtual physiotherapy outcomes in post-operative knee recovery"
  ],
  wearables: [
    "Smartwatch-derived sleep and strain signals track weekly recovery",
    "IMU-based balance assessment for remote fall-risk screening"
  ],
  "sports-performance": [
    "Training-load variability predicts sprint performance shifts",
    "Neuromuscular fatigue markers after congested match schedules"
  ],
  musculoskeletal: [
    "Ultrasound markers of tendon adaptation in strength training",
    "Biomechanical predictors of low-back pain recurrence"
  ],
  "digital-biomarkers": [
    "Passive phone signals detect recovery patterns in chronic pain",
    "Digital biomarkers for real-world mobility decline in older adults"
  ],
  "clinical-ml": [
    "Machine learning triage model for early sepsis recognition",
    "Prognostic modeling of readmission risk after orthopedic surgery"
  ]
};

export function createSampleFeed(): PaperRecord[] {
  return TOPICS.flatMap((topic, topicIndex) =>
    SAMPLE_TITLES[topic.id].map((title, titleIndex) => {
      const id = `${topic.id}-${titleIndex + 1}`;
      const dayOffset = topicIndex * 2 + titleIndex;

      return {
        id,
        slug: slugify(title),
        sourceId: `PMID${38000000 + topicIndex * 10 + titleIndex}`,
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${38000000 + topicIndex * 10 + titleIndex}/`,
        doiUrl: `https://doi.org/10.1000/${topic.id}-${titleIndex + 1}`,
        journal: topic.group === "movement-science" ? "Journal of Applied Human Science" : "Digital Medicine Review",
        title,
        publishedAt: new Date(Date.now() - dayOffset * 86_400_000).toISOString(),
        articleType: titleIndex % 2 === 0 ? "Clinical Study" : "Review",
        topicIds: [topic.id],
        shortSummary: `A concise summary for ${topic.label.toLowerCase()} readers that highlights the main result without overstating the evidence.`,
        longSummary:
          "This sample record shows how the product presents a readable explanation, study framing, and direct source links before a real ingestion pipeline populates the database.",
        imageUrl: null,
        openAccess: titleIndex % 2 === 0,
        abstractAvailable: true,
        source: "pubmed" as const
      };
    })
  ).sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}
