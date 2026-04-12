import { TOPICS } from "@research-feed/shared";
import type { TopicId } from "@research-feed/shared";
import { apiBaseUrl } from "./api-base";

const VALID_TOPIC_IDS = new Set(TOPICS.map((t) => t.id));

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BOOKMARKS_KEY = "paperbites-bookmarks";
const FOR_YOU_KEY = "paperbites-for-you-topics";

/** After login or signup, merge browser-only bookmarks and topic picks into the server profile. */
export async function mergeLocalUserData(): Promise<void> {
  const base = apiBaseUrl;

  let localBookmarkIds: string[] = [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        localBookmarkIds = parsed.filter((v): v is string => typeof v === "string");
      }
    }
  } catch {
    /* ignore */
  }
  const localPaperUuids = localBookmarkIds.filter((id) => UUID_RE.test(id));

  let localTopicIds: string[] = [];
  try {
    const raw = localStorage.getItem(FOR_YOU_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        localTopicIds = parsed.filter((id): id is TopicId => typeof id === "string" && VALID_TOPIC_IDS.has(id as TopicId));
      }
    }
  } catch {
    /* ignore */
  }

  if (localPaperUuids.length > 0) {
    try {
      const savedRes = await fetch(`${base}/me/saved`, { credentials: "include" });
      if (savedRes.ok) {
        const data = (await savedRes.json()) as { paperIds?: string[] };
        const serverIds = Array.isArray(data.paperIds) ? data.paperIds : [];
        const merged = [...new Set([...serverIds, ...localPaperUuids])];
        await fetch(`${base}/me/saved`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperIds: merged })
        });
      }
    } catch {
      /* ignore */
    }
  }

  if (localTopicIds.length > 0) {
    try {
      const intRes = await fetch(`${base}/me/interests`, { credentials: "include" });
      if (intRes.ok) {
        const data = (await intRes.json()) as { topicIds?: string[] };
        const serverTopics = Array.isArray(data.topicIds) ? data.topicIds : [];
        const mergedTopics = [...new Set([...serverTopics, ...localTopicIds])];
        await fetch(`${base}/me/interests`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicIds: mergedTopics })
        });
      }
    } catch {
      /* ignore */
    }
  }
}
