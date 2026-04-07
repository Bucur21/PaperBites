import type { FastifyInstance } from "fastify";
import { CONTENT_POLICY_NOTES, CONTENT_RIGHTS_POLICY } from "../../../../packages/shared/src";
import type { TopicId } from "../../../../packages/shared/src";
import { getFeed, getPaper, getTopics } from "../db";

export async function registerFeedRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    ok: true,
    service: "research-feed-api",
    timestamp: new Date().toISOString()
  }));

  app.get("/topics", async () => ({
    items: await getTopics()
  }));

  app.get("/content-policy", async () => ({
    policy: CONTENT_RIGHTS_POLICY,
    notes: CONTENT_POLICY_NOTES
  }));

  app.get("/feed", async (request) => {
    const query = request.query as {
      topic?: TopicId;
      limit?: string;
      cursor?: string;
    };

    const limit = Math.min(Number(query.limit ?? 20), 50);
    const items = await getFeed(query.topic, limit, query.cursor);

    return {
      items,
      nextCursor: items.at(-1)?.publishedAt ?? null
    };
  });

  app.get("/papers/:slugOrId", async (request, reply) => {
    const params = request.params as { slugOrId: string };
    const paper = await getPaper(params.slugOrId);

    if (!paper) {
      return reply.code(404).send({ error: "Paper not found" });
    }

    return {
      item: paper
    };
  });
}
