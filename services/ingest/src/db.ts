import "./env";

import { Pool } from "pg";
import { classifyStudyDesign, TOPICS } from "../../../packages/shared/src";
import type { TopicId } from "../../../packages/shared/src";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for the ingest service.");
}

export const pool = new Pool({ connectionString });

export async function seedTopics() {
  const client = await pool.connect();

  try {
    await client.query("begin");

    for (const topic of TOPICS) {
      await client.query(
        `
          insert into topics (id, label, group_name, description, pubmed_query, priority, keywords)
          values ($1, $2, $3, $4, $5, $6, $7)
          on conflict (id) do update
          set
            label = excluded.label,
            group_name = excluded.group_name,
            description = excluded.description,
            pubmed_query = excluded.pubmed_query,
            priority = excluded.priority,
            keywords = excluded.keywords
        `,
        [topic.id, topic.label, topic.group, topic.description, topic.pubmedQuery, topic.priority, topic.keywords]
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function createIngestJob(topicId: TopicId, windowStart: Date, windowEnd: Date) {
  const result = await pool.query<{ id: string }>(
    `
      insert into ingest_jobs (topic_id, source, window_start, window_end, status)
      values ($1, 'pubmed', $2, $3, 'running')
      returning id
    `,
    [topicId, windowStart.toISOString(), windowEnd.toISOString()]
  );

  return result.rows[0].id;
}

export async function finishIngestJob(
  jobId: string,
  input: {
    itemsSeen: number;
    itemsInserted: number;
    itemsUpdated: number;
    errorMessage?: string;
  }
) {
  await pool.query(
    `
      update ingest_jobs
      set
        status = $2,
        items_seen = $3,
        items_inserted = $4,
        items_updated = $5,
        error_message = $6,
        completed_at = now()
      where id = $1
    `,
    [
      jobId,
      input.errorMessage ? "failed" : "completed",
      input.itemsSeen,
      input.itemsInserted,
      input.itemsUpdated,
      input.errorMessage ?? null
    ]
  );
}

export async function upsertPaper(input: {
  sourceId: string;
  title: string;
  journal: string;
  publishedAt: Date;
  articleType: string;
  doi: string | null;
  doiUrl: string | null;
  sourceUrl: string;
  abstractAvailable: boolean;
  openAccess: boolean;
  topicIds: TopicId[];
  authors: Array<{ given: string; family: string; position: number }>;
  snapshot: unknown;
}) {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const slug = `${input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${input.sourceId.toLowerCase()}`;

    const studyDesign = classifyStudyDesign(input.articleType, input.title);

    const paperResult = await client.query<{ id: string; inserted: boolean }>(
      `
        insert into papers (
          source,
          source_id,
          slug,
          title,
          journal,
          published_at,
          article_type,
          study_design,
          doi,
          doi_url,
          source_url,
          abstract_available,
          open_access
        )
        values ('pubmed', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        on conflict (source, source_id) do update
        set
          slug = excluded.slug,
          title = excluded.title,
          journal = excluded.journal,
          published_at = excluded.published_at,
          article_type = excluded.article_type,
          study_design = excluded.study_design,
          doi = excluded.doi,
          doi_url = excluded.doi_url,
          source_url = excluded.source_url,
          abstract_available = excluded.abstract_available,
          open_access = excluded.open_access,
          updated_at = now(),
          expires_at = now() + interval '365 days'
        returning id, (xmax = 0) as inserted
      `,
      [
        input.sourceId,
        slug,
        input.title,
        input.journal,
        input.publishedAt.toISOString(),
        input.articleType,
        studyDesign,
        input.doi,
        input.doiUrl,
        input.sourceUrl,
        input.abstractAvailable,
        input.openAccess
      ]
    );

    const paperId = paperResult.rows[0].id;

    const existingTopics = await client.query<{ topic_id: TopicId }>(
      "select topic_id from paper_topic_map where paper_id = $1",
      [paperId]
    );
    const merged = new Set<TopicId>([...existingTopics.rows.map((r) => r.topic_id), ...input.topicIds]);

    await client.query("delete from paper_topic_map where paper_id = $1", [paperId]);

    for (const topicId of merged) {
      await client.query("insert into paper_topic_map (paper_id, topic_id) values ($1, $2)", [paperId, topicId]);
    }

    await client.query("delete from paper_authors where paper_id = $1", [paperId]);

    for (const author of input.authors) {
      await client.query(
        "insert into paper_authors (paper_id, position, given_name, family_name) values ($1, $2, $3, $4)",
        [paperId, author.position, author.given, author.family]
      );
    }

    await client.query(
      `
        insert into paper_source_snapshots (paper_id, source, payload)
        values ($1, 'pubmed', $2::jsonb)
      `,
      [paperId, JSON.stringify(input.snapshot)]
    );

    await client.query("commit");

    return {
      paperId,
      inserted: paperResult.rows[0].inserted
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function runRetentionPolicy() {
  const client = await pool.connect();

  try {
    await client.query("begin");
    const snapshotsDeleted = await client.query("delete from paper_source_snapshots where expires_at < now()");
    const papersDeleted = await client.query("delete from papers where expires_at < now()");
    await client.query("commit");

    return {
      snapshotsDeleted: snapshotsDeleted.rowCount ?? 0,
      papersDeleted: papersDeleted.rowCount ?? 0
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
