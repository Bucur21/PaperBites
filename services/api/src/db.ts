import "./env";

import { Pool } from "pg";
import { createSampleFeed, rankTopicIds, TOPICS } from "../../../packages/shared/src";
import type { PaperRecord, TopicId } from "../../../packages/shared/src";

const databaseUrl = process.env.DATABASE_URL;

export const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

export async function getTopics() {
  if (!pool) {
    return TOPICS;
  }

  const result = await pool.query<{
    id: TopicId;
    label: string;
    group_name: string;
    description: string;
    pubmed_query: string;
    priority: number;
    keywords: string[];
  }>(
    "select id, label, group_name, description, pubmed_query, priority, keywords from topics order by priority asc"
  );

  return result.rows.map((row) => ({
    id: row.id,
    label: row.label,
    group: row.group_name as (typeof TOPICS)[number]["group"],
    description: row.description,
    pubmedQuery: row.pubmed_query,
    priority: row.priority,
    keywords: row.keywords
  }));
}

export async function getFeed(topicId?: TopicId, limit = 20, cursor?: string) {
  if (!pool) {
    let items = createSampleFeed();

    if (topicId) {
      items = items.filter((item) => item.topicIds.includes(topicId));
    }

    if (cursor) {
      items = items.filter((item) => item.publishedAt < cursor);
    }

    return items.slice(0, limit);
  }

  const params: Array<string | number> = [];
  const where: string[] = [];

  if (topicId) {
    params.push(topicId);
    where.push(`exists (
      select 1
      from paper_topic_map ptm
      where ptm.paper_id = papers.id and ptm.topic_id = $${params.length}
    )`);
  }

  if (cursor) {
    params.push(cursor);
    where.push(`papers.published_at < $${params.length}`);
  }

  params.push(limit);

  const query = `
    select
      papers.id,
      papers.slug,
      papers.source,
      papers.source_id,
      papers.source_url,
      papers.doi_url,
      papers.journal,
      papers.title,
      papers.published_at,
      papers.article_type,
      papers.open_access,
      papers.abstract_available,
      coalesce(ps.short_summary, 'Summary pending.') as short_summary,
      ps.long_summary,
      pi.image_url,
      array_remove(array_agg(ptm.topic_id order by t.priority), null) as topic_ids
    from papers
    left join paper_summaries ps on ps.paper_id = papers.id
    left join paper_images pi on pi.paper_id = papers.id and pi.status = 'ready'
    left join paper_topic_map ptm on ptm.paper_id = papers.id
    left join topics t on t.id = ptm.topic_id
    ${where.length ? `where ${where.join(" and ")}` : ""}
    group by papers.id, ps.short_summary, ps.long_summary, pi.image_url
    order by papers.published_at desc
    limit $${params.length}
  `;

  const result = await pool.query<{
    id: string;
    slug: string;
    source: "pubmed" | "europepmc";
    source_id: string;
    source_url: string;
    doi_url: string | null;
    journal: string;
    title: string;
    published_at: Date;
    article_type: string;
    open_access: boolean;
    abstract_available: boolean;
    short_summary: string;
    long_summary: string | null;
    image_url: string | null;
    topic_ids: TopicId[];
  }>(query, params);

  return result.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    doiUrl: row.doi_url,
    journal: row.journal,
    title: row.title,
    publishedAt: row.published_at.toISOString(),
    articleType: row.article_type,
    topicIds: rankTopicIds(row.topic_ids ?? []),
    shortSummary: row.short_summary,
    longSummary: row.long_summary,
    imageUrl: row.image_url,
    openAccess: row.open_access,
    abstractAvailable: row.abstract_available,
    source: row.source
  })) satisfies PaperRecord[];
}

export async function getPaper(slugOrId: string) {
  if (!pool) {
    return createSampleFeed().find((paper) => paper.slug === slugOrId || paper.id === slugOrId) ?? null;
  }

  const result = await pool.query<{
    id: string;
    slug: string;
    source: "pubmed" | "europepmc";
    source_id: string;
    source_url: string;
    doi_url: string | null;
    journal: string;
    title: string;
    published_at: Date;
    article_type: string;
    open_access: boolean;
    abstract_available: boolean;
    short_summary: string;
    long_summary: string | null;
    image_url: string | null;
    topic_ids: TopicId[];
  }>(
    `
      select
        papers.id,
        papers.slug,
        papers.source,
        papers.source_id,
        papers.source_url,
        papers.doi_url,
        papers.journal,
        papers.title,
        papers.published_at,
        papers.article_type,
        papers.open_access,
        papers.abstract_available,
        coalesce(ps.short_summary, 'Summary pending.') as short_summary,
        ps.long_summary,
        pi.image_url,
        array_remove(array_agg(ptm.topic_id order by t.priority), null) as topic_ids
      from papers
      left join paper_summaries ps on ps.paper_id = papers.id
      left join paper_images pi on pi.paper_id = papers.id and pi.status = 'ready'
      left join paper_topic_map ptm on ptm.paper_id = papers.id
      left join topics t on t.id = ptm.topic_id
      where papers.slug = $1 or papers.id::text = $1
      group by papers.id, ps.short_summary, ps.long_summary, pi.image_url
      limit 1
    `,
    [slugOrId]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    doiUrl: row.doi_url,
    journal: row.journal,
    title: row.title,
    publishedAt: row.published_at.toISOString(),
    articleType: row.article_type,
    topicIds: rankTopicIds(row.topic_ids ?? []),
    shortSummary: row.short_summary,
    longSummary: row.long_summary,
    imageUrl: row.image_url,
    openAccess: row.open_access,
    abstractAvailable: row.abstract_available,
    source: row.source
  } satisfies PaperRecord;
}

export async function closeDb() {
  await pool?.end();
}
