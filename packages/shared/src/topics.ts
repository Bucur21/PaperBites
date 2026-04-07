import type { TopicDefinition, TopicId } from "./types";

export const TOPICS: TopicDefinition[] = [
  {
    id: "biomechanics",
    label: "Biomechanics",
    group: "movement-science",
    description: "Human movement, gait, joint loading, and musculoskeletal mechanics.",
    priority: 1,
    keywords: ["gait", "kinematics", "kinetics", "joint load", "movement analysis"],
    pubmedQuery:
      '("biomechanics"[Title/Abstract] OR "gait analysis"[Title/Abstract] OR kinematics[Title/Abstract] OR kinetics[Title/Abstract] OR "human movement"[Title/Abstract])'
  },
  {
    id: "ai-health",
    label: "AI In Health",
    group: "clinical-ai",
    description: "Applied artificial intelligence for diagnostics, screening, and decision support.",
    priority: 2,
    keywords: ["artificial intelligence", "machine learning", "deep learning", "decision support"],
    pubmedQuery:
      '("artificial intelligence"[Title/Abstract] OR "machine learning"[Title/Abstract] OR "deep learning"[Title/Abstract]) AND (healthcare[Title/Abstract] OR medicine[Title/Abstract] OR clinical[Title/Abstract])'
  },
  {
    id: "rehabilitation",
    label: "Rehabilitation",
    group: "movement-science",
    description: "Rehab science, physiotherapy, neurorehab, and functional recovery.",
    priority: 3,
    keywords: ["rehabilitation", "physiotherapy", "physical therapy", "functional recovery"],
    pubmedQuery:
      '("rehabilitation"[Title/Abstract] OR physiotherapy[Title/Abstract] OR "physical therapy"[Title/Abstract] OR neurorehabilitation[Title/Abstract])'
  },
  {
    id: "wearables",
    label: "Wearables",
    group: "digital-health",
    description: "Sensor-driven health monitoring, human performance, and remote assessment.",
    priority: 4,
    keywords: ["wearable", "IMU", "accelerometer", "remote monitoring", "biosensor"],
    pubmedQuery:
      '("wearable"[Title/Abstract] OR "wearable device"[Title/Abstract] OR accelerometer[Title/Abstract] OR IMU[Title/Abstract] OR biosensor[Title/Abstract]) AND (health[Title/Abstract] OR monitoring[Title/Abstract] OR assessment[Title/Abstract])'
  },
  {
    id: "sports-performance",
    label: "Sports Performance",
    group: "movement-science",
    description: "Training adaptation, performance analytics, fatigue, and athletic monitoring.",
    priority: 5,
    keywords: ["sports science", "performance", "fatigue", "training load"],
    pubmedQuery:
      '("sports science"[Title/Abstract] OR "athletic performance"[Title/Abstract] OR "training load"[Title/Abstract] OR fatigue[Title/Abstract])'
  },
  {
    id: "musculoskeletal",
    label: "Musculoskeletal",
    group: "movement-science",
    description: "Orthopedics, tendon, bone, spine, and injury-related research.",
    priority: 6,
    keywords: ["orthopedic", "musculoskeletal", "tendon", "ligament", "spine"],
    pubmedQuery:
      '("musculoskeletal"[Title/Abstract] OR orthopedic[Title/Abstract] OR tendon[Title/Abstract] OR ligament[Title/Abstract] OR spine[Title/Abstract])'
  },
  {
    id: "digital-biomarkers",
    label: "Digital Biomarkers",
    group: "digital-health",
    description: "Signals and computed features derived from behavior, sensors, or digital tools.",
    priority: 7,
    keywords: ["digital biomarker", "passive sensing", "phenotyping", "remote assessment"],
    pubmedQuery:
      '("digital biomarker"[Title/Abstract] OR "digital phenotyping"[Title/Abstract] OR "passive sensing"[Title/Abstract] OR "remote assessment"[Title/Abstract])'
  },
  {
    id: "clinical-ml",
    label: "Clinical ML",
    group: "clinical-ai",
    description: "Risk prediction, triage, prognosis, and model evaluation in clinical settings.",
    priority: 8,
    keywords: ["risk prediction", "triage", "clinical model", "prognosis"],
    pubmedQuery:
      '("risk prediction"[Title/Abstract] OR triage[Title/Abstract] OR prognosis[Title/Abstract] OR "clinical model"[Title/Abstract]) AND ("machine learning"[Title/Abstract] OR "predictive model"[Title/Abstract])'
  }
];

export const TOPIC_MAP = Object.fromEntries(TOPICS.map((topic) => [topic.id, topic])) as Record<
  TopicId,
  TopicDefinition
>;

export function rankTopicIds(topicIds: TopicId[]): TopicId[] {
  return [...topicIds].sort((left, right) => TOPIC_MAP[left].priority - TOPIC_MAP[right].priority);
}
