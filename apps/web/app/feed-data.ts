import { createSampleFeed, TOPICS } from "../../../packages/shared/src";
import type { PaperRecord, TopicDefinition } from "../../../packages/shared/src";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function loadTopics(): Promise<TopicDefinition[]> {
  if (!apiBaseUrl) {
    return TOPICS;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/topics`, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error("Topic request failed");
    }

    const payload = (await response.json()) as { items: TopicDefinition[] };
    return payload.items;
  } catch {
    return TOPICS;
  }
}

export async function loadFeed(topic?: string): Promise<PaperRecord[]> {
  if (!apiBaseUrl) {
    return createSampleFeed().filter((paper) => !topic || paper.topicIds.includes(topic as never));
  }

  try {
    const params = new URLSearchParams();
    if (topic) {
      params.set("topic", topic);
    }

    const response = await fetch(`${apiBaseUrl}/feed?${params.toString()}`, { next: { revalidate: 900 } });
    if (!response.ok) {
      throw new Error("Feed request failed");
    }

    const payload = (await response.json()) as { items: PaperRecord[] };
    return payload.items;
  } catch {
    return createSampleFeed().filter((paper) => !topic || paper.topicIds.includes(topic as never));
  }
}

export async function loadPaper(slug: string): Promise<PaperRecord | null> {
  if (!apiBaseUrl) {
    return createSampleFeed().find((paper) => paper.slug === slug) ?? null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/papers/${slug}`, { next: { revalidate: 900 } });
    if (!response.ok) {
      throw new Error("Paper request failed");
    }

    const payload = (await response.json()) as { item: PaperRecord };
    return payload.item;
  } catch {
    return createSampleFeed().find((paper) => paper.slug === slug) ?? null;
  }
}
