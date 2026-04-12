import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TOPICS } from "../../../../packages/shared/src";
import type { TopicId } from "../../../../packages/shared/src";
import { SESSION_COOKIE_NAME } from "../auth/constants";
import { hashSessionToken } from "../auth/session-token";
import { pool } from "../db";
import { getMyPapersFromUserUrls } from "../my-papers";
import {
  addLike,
  addSavedPaper,
  findUserBySessionTokenHash,
  getLikedPaperIds,
  getSavedPaperIds,
  getTopicInterests,
  getUserPublicationSettings,
  removeLike,
  removeSavedPaper,
  replaceSavedPapers,
  replaceTopicInterests,
  updatePublicationProfiles
} from "../users-repo";

const VALID_TOPIC_IDS = new Set<string>(TOPICS.map((t) => t.id));

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!pool) {
    await reply.code(503).send({ error: "Database unavailable" });
    return;
  }
  const token = request.cookies[SESSION_COOKIE_NAME];
  if (!token) {
    await reply.code(401).send({ error: "Unauthorized" });
    return;
  }
  const user = await findUserBySessionTokenHash(pool, hashSessionToken(token));
  if (!user) {
    await reply.code(401).send({ error: "Unauthorized" });
    return;
  }
  request.user = { id: user.id, email: user.email };
}

export async function registerMeRoutes(app: FastifyInstance) {
  const auth = { preHandler: authenticate };

  app.get("/me/interests", auth, async (request) => {
    const userId = request.user!.id;
    const topicIds = await getTopicInterests(pool!, userId);
    return { topicIds };
  });

  app.patch("/me/interests", auth, async (request, reply) => {
    const userId = request.user!.id;
    const body = request.body as { topicIds?: unknown };
    if (!Array.isArray(body.topicIds)) {
      return reply.code(400).send({ error: "topicIds array required" });
    }
    const topicIds = body.topicIds.filter((id): id is TopicId => typeof id === "string" && VALID_TOPIC_IDS.has(id));
    await replaceTopicInterests(pool!, userId, topicIds);
    return { topicIds };
  });

  app.get("/me/saved", auth, async (request) => {
    const userId = request.user!.id;
    const paperIds = await getSavedPaperIds(pool!, userId);
    return { paperIds };
  });

  app.put("/me/saved", auth, async (request, reply) => {
    const userId = request.user!.id;
    const body = request.body as { paperIds?: unknown };
    if (!Array.isArray(body.paperIds)) {
      return reply.code(400).send({ error: "paperIds array required" });
    }
    const raw = body.paperIds.filter((id): id is string => typeof id === "string");
    const paperIds = raw.filter((id) => UUID_RE.test(id));
    await replaceSavedPapers(pool!, userId, paperIds);
    return { paperIds };
  });

  app.post("/me/saved/:paperId", auth, async (request, reply) => {
    const userId = request.user!.id;
    const { paperId } = request.params as { paperId: string };
    if (!UUID_RE.test(paperId)) {
      return reply.code(400).send({ error: "Invalid paper id" });
    }
    const ok = await addSavedPaper(pool!, userId, paperId);
    if (!ok) {
      return reply.code(404).send({ error: "Paper not found" });
    }
    return { ok: true };
  });

  app.delete("/me/saved/:paperId", auth, async (request, reply) => {
    const userId = request.user!.id;
    const { paperId } = request.params as { paperId: string };
    if (!UUID_RE.test(paperId)) {
      return reply.code(400).send({ error: "Invalid paper id" });
    }
    await removeSavedPaper(pool!, userId, paperId);
    return { ok: true };
  });

  app.get("/me/likes", auth, async (request) => {
    const userId = request.user!.id;
    const paperIds = await getLikedPaperIds(pool!, userId);
    return { paperIds };
  });

  app.post("/me/likes/:paperId", auth, async (request, reply) => {
    const userId = request.user!.id;
    const { paperId } = request.params as { paperId: string };
    if (!UUID_RE.test(paperId)) {
      return reply.code(400).send({ error: "Invalid paper id" });
    }
    const ok = await addLike(pool!, userId, paperId);
    if (!ok) {
      return reply.code(404).send({ error: "Paper not found" });
    }
    return { ok: true };
  });

  app.delete("/me/likes/:paperId", auth, async (request, reply) => {
    const userId = request.user!.id;
    const { paperId } = request.params as { paperId: string };
    if (!UUID_RE.test(paperId)) {
      return reply.code(400).send({ error: "Invalid paper id" });
    }
    await removeLike(pool!, userId, paperId);
    return { ok: true };
  });

  app.get("/me/my-papers", auth, async (request) => {
    const userId = request.user!.id;
    const { hasPublications, authorProfileUrls } = await getUserPublicationSettings(pool!, userId);
    if (!hasPublications || authorProfileUrls.length === 0) {
      return { items: [], notes: [] as string[] };
    }
    return getMyPapersFromUserUrls(authorProfileUrls);
  });

  app.patch("/me/publication-profiles", auth, async (request, reply) => {
    const userId = request.user!.id;
    const body = request.body as { hasPublications?: boolean; authorProfileUrls?: unknown };
    const hasPub = body.hasPublications === true;
    const urls = Array.isArray(body.authorProfileUrls)
      ? body.authorProfileUrls
          .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
          .map((u) => u.trim())
          .slice(0, 10)
      : [];
    for (const u of urls) {
      if (u.length > 2000) {
        return reply.code(400).send({ error: "Each URL must be at most 2000 characters" });
      }
    }
    await updatePublicationProfiles(pool!, userId, hasPub, urls);
    return { hasPublications: hasPub, authorProfileUrls: urls };
  });
}
