import { TOPICS } from "@research-feed/shared";
import type { TopicId } from "@research-feed/shared";

const VALID_TOPIC_IDS = new Set<string>(TOPICS.map((t) => t.id));

export function normalizeTopicParam(topic: string | undefined): TopicId | undefined {
  if (!topic) return undefined;
  return VALID_TOPIC_IDS.has(topic) ? (topic as TopicId) : undefined;
}
