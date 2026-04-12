import type { Pool } from "pg";
import type { TopicId } from "../../../packages/shared/src";

const SESSION_DAYS = 30;

export async function createUser(
  pool: Pool,
  email: string,
  passwordHash: string,
  options?: { hasPublications?: boolean; authorProfileUrls?: string[] }
): Promise<{ id: string }> {
  const hasPub = options?.hasPublications === true;
  const urls = JSON.stringify(options?.authorProfileUrls?.filter((u) => typeof u === "string" && u.trim()) ?? []);
  const result = await pool.query<{ id: string }>(
    "insert into users (email, password_hash, has_publications, author_profile_urls) values ($1, $2, $3, $4::jsonb) returning id",
    [email, passwordHash, hasPub, urls]
  );
  return result.rows[0]!;
}

export async function findUserByEmail(
  pool: Pool,
  email: string
): Promise<{ id: string; password_hash: string; has_publications: boolean; author_profile_urls: unknown } | null> {
  const result = await pool.query<{
    id: string;
    password_hash: string;
    has_publications: boolean;
    author_profile_urls: unknown;
  }>("select id, password_hash, has_publications, author_profile_urls from users where email = $1", [email]);
  return result.rows[0] ?? null;
}

export async function insertSession(pool: Pool, userId: string, tokenHash: string): Promise<void> {
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await pool.query("insert into sessions (user_id, token_hash, expires_at) values ($1, $2, $3)", [
    userId,
    tokenHash,
    expires
  ]);
}

export async function deleteSessionByTokenHash(pool: Pool, tokenHash: string): Promise<void> {
  await pool.query("delete from sessions where token_hash = $1", [tokenHash]);
}

export async function findUserBySessionTokenHash(
  pool: Pool,
  tokenHash: string
): Promise<{
  id: string;
  email: string;
  has_publications: boolean;
  author_profile_urls: unknown;
} | null> {
  const result = await pool.query<{
    id: string;
    email: string;
    has_publications: boolean;
    author_profile_urls: unknown;
  }>(
    `select u.id, u.email, u.has_publications, u.author_profile_urls
     from sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export function parseAuthorProfileUrls(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  }
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? p.filter((u): u is string => typeof u === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function updatePublicationProfiles(
  pool: Pool,
  userId: string,
  hasPublications: boolean,
  authorProfileUrls: string[]
): Promise<void> {
  await pool.query(
    "update users set has_publications = $2, author_profile_urls = $3::jsonb, updated_at = now() where id = $1",
    [userId, hasPublications, JSON.stringify(authorProfileUrls)]
  );
}

export async function getUserPublicationSettings(
  pool: Pool,
  userId: string
): Promise<{ hasPublications: boolean; authorProfileUrls: string[] }> {
  const result = await pool.query<{ has_publications: boolean; author_profile_urls: unknown }>(
    "select has_publications, author_profile_urls from users where id = $1",
    [userId]
  );
  const row = result.rows[0];
  if (!row) return { hasPublications: false, authorProfileUrls: [] };
  return {
    hasPublications: row.has_publications,
    authorProfileUrls: parseAuthorProfileUrls(row.author_profile_urls)
  };
}

export async function getTopicInterests(pool: Pool, userId: string): Promise<TopicId[]> {
  const result = await pool.query<{ topic_id: string }>(
    "select topic_id from user_topic_interests where user_id = $1 order by topic_id",
    [userId]
  );
  return result.rows.map((r) => r.topic_id as TopicId);
}

export async function replaceTopicInterests(pool: Pool, userId: string, topicIds: string[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("delete from user_topic_interests where user_id = $1", [userId]);
    for (const topicId of topicIds) {
      await client.query("insert into user_topic_interests (user_id, topic_id) values ($1, $2) on conflict do nothing", [
        userId,
        topicId
      ]);
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export async function getSavedPaperIds(pool: Pool, userId: string): Promise<string[]> {
  const result = await pool.query<{ paper_id: string }>(
    "select paper_id::text from user_saved_papers where user_id = $1 order by saved_at desc",
    [userId]
  );
  return result.rows.map((r) => r.paper_id);
}

export async function addSavedPaper(pool: Pool, userId: string, paperId: string): Promise<boolean> {
  const check = await pool.query("select 1 from papers where id = $1", [paperId]);
  if (check.rowCount === 0) return false;
  await pool.query(
    "insert into user_saved_papers (user_id, paper_id) values ($1, $2) on conflict do nothing",
    [userId, paperId]
  );
  return true;
}

export async function removeSavedPaper(pool: Pool, userId: string, paperId: string): Promise<void> {
  await pool.query("delete from user_saved_papers where user_id = $1 and paper_id = $2", [userId, paperId]);
}

export async function replaceSavedPapers(pool: Pool, userId: string, paperIds: string[]): Promise<void> {
  const unique = [...new Set(paperIds)];
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("delete from user_saved_papers where user_id = $1", [userId]);
    for (const pid of unique) {
      const check = await client.query("select 1 from papers where id = $1", [pid]);
      if (check.rowCount === 0) continue;
      await client.query("insert into user_saved_papers (user_id, paper_id) values ($1, $2)", [userId, pid]);
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export async function getLikedPaperIds(pool: Pool, userId: string): Promise<string[]> {
  const result = await pool.query<{ paper_id: string }>(
    "select paper_id::text from user_paper_likes where user_id = $1 order by liked_at desc",
    [userId]
  );
  return result.rows.map((r) => r.paper_id);
}

export async function addLike(pool: Pool, userId: string, paperId: string): Promise<boolean> {
  const check = await pool.query("select 1 from papers where id = $1", [paperId]);
  if (check.rowCount === 0) return false;
  await pool.query(
    "insert into user_paper_likes (user_id, paper_id) values ($1, $2) on conflict do nothing",
    [userId, paperId]
  );
  return true;
}

export async function removeLike(pool: Pool, userId: string, paperId: string): Promise<void> {
  await pool.query("delete from user_paper_likes where user_id = $1 and paper_id = $2", [userId, paperId]);
}
