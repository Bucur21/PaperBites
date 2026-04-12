import type { TopicGroup, TopicId } from "./types";

export interface TopicColor {
  bg: string;
  border: string;
  text: string;
  chip: string;
  chipText: string;
}

const GROUP_COLORS: Record<TopicGroup, TopicColor> = {
  "movement-science": {
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-800",
    chip: "bg-teal-100/80 border-teal-200",
    chipText: "text-teal-800"
  },
  "clinical-ai": {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-800",
    chip: "bg-indigo-100/80 border-indigo-200",
    chipText: "text-indigo-800"
  },
  "digital-health": {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-800",
    chip: "bg-violet-100/80 border-violet-200",
    chipText: "text-violet-800"
  }
};

const TOPIC_TO_GROUP: Record<TopicId, TopicGroup> = {
  biomechanics: "movement-science",
  rehabilitation: "movement-science",
  "sports-performance": "movement-science",
  musculoskeletal: "movement-science",
  "ai-health": "clinical-ai",
  "clinical-ml": "clinical-ai",
  wearables: "digital-health",
  "digital-biomarkers": "digital-health"
};

export function getTopicColor(topicId: TopicId): TopicColor {
  const group = TOPIC_TO_GROUP[topicId];
  return GROUP_COLORS[group] ?? GROUP_COLORS["movement-science"];
}

export function getGroupColor(group: TopicGroup): TopicColor {
  return GROUP_COLORS[group];
}
