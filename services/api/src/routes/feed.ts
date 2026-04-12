import type { FastifyInstance } from "fastify";
import { CONTENT_POLICY_NOTES, CONTENT_RIGHTS_POLICY, TOPICS } from "../../../../packages/shared/src";
import type { TopicId } from "../../../../packages/shared/src";

const VALID_TOPIC_IDS = new Set<string>(TOPICS.map((t) => t.id));
import { getFeed, getPaper, getRelatedPapers, getTopics, searchPapers } from "../db";

function cacheFor(reply: { header: (k: string, v: string) => void }, seconds: number) {
  reply.header("Cache-Control", `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`);
}

export async function registerFeedRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    ok: true,
    service: "research-feed-api",
    timestamp: new Date().toISOString()
  }));

  app.get("/topics", async (_request, reply) => {
    cacheFor(reply, 3600);
    return { items: await getTopics() };
  });

  app.get("/content-policy", async () => ({
    policy: CONTENT_RIGHTS_POLICY,
    notes: CONTENT_POLICY_NOTES
  }));

  app.get("/feed", async (request, reply) => {
    const query = request.query as {
      topic?: string;
      limit?: string;
      cursor?: string;
    };

    const limit = Math.min(Math.max(1, Number(query.limit ?? 20)), 50);

    if (query.limit && isNaN(Number(query.limit))) {
      return reply.code(400).send({ error: "limit must be a number" });
    }

    let topicId: TopicId | undefined;
    if (query.topic !== undefined && query.topic !== "") {
      if (!VALID_TOPIC_IDS.has(query.topic)) {
        return reply.code(400).send({ error: "invalid topic" });
      }
      topicId = query.topic as TopicId;
    }

    cacheFor(reply, 900);
    const items = await getFeed(topicId, limit, query.cursor);

    const hasMore = items.length === limit;
    return {
      items,
      nextCursor: hasMore ? (items.at(-1)?.publishedAt ?? null) : null
    };
  });

  app.get("/search", async (request, reply) => {
    const query = request.query as { q?: string; limit?: string };
    const q = (query.q ?? "").trim();

    if (!q) {
      return reply.code(400).send({ error: "q is required" });
    }

    const limit = Math.min(Math.max(1, Number(query.limit ?? 20)), 50);
    cacheFor(reply, 300);

    return { items: await searchPapers(q, limit) };
  });

  app.get("/papers/:slugOrId", async (request, reply) => {
    const params = request.params as { slugOrId: string };
    const paper = await getPaper(params.slugOrId);

    if (!paper) {
      return reply.code(404).send({ error: "Paper not found" });
    }

    cacheFor(reply, 900);
    return { item: paper };
  });

  app.get("/papers/:slugOrId/related", async (request, reply) => {
    const params = request.params as { slugOrId: string };
    const query = request.query as { limit?: string };
    const paper = await getPaper(params.slugOrId);

    if (!paper) {
      return reply.code(404).send({ error: "Paper not found" });
    }

    const limit = Math.min(Math.max(1, Number(query.limit ?? 4)), 10);
    const primaryTopic = paper.topicIds[0];

    if (!primaryTopic) {
      return { items: [] };
    }

    cacheFor(reply, 900);
    return { items: await getRelatedPapers(paper.id, primaryTopic, limit) };
  });
}
