import "./env";

import { Pool } from "pg";
import { classifyStudyDesign, createSampleFeed, rankTopicIds, sanitizePaperRecord, TOPICS } from "../../../packages/shared/src";
import type { PaperAuthor, PaperRecord, StudyDesign, TopicId } from "../../../packages/shared/src";
import { extractPmidFromSlugOrId, fetchPaperRecordFromPubmedEsummary } from "./pubmed-esummary";

const databaseUrl = process.env.DATABASE_URL;

export const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

interface PaperRow {
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
  study_design: string | null;
  open_access: boolean;
  abstract_available: boolean;
  short_summary: string;
  long_summary: string | null;
  why_it_matters: string | null;
  takeaway: string | null;
  clinical_impact: string | null;
  method_quality: string | null;
  who_its_for: string | null;
  image_url: string | null;
  topic_ids: TopicId[];
}

function rowToPaper(row: PaperRow, authors: PaperAuthor[] = []): PaperRecord {
  return sanitizePaperRecord({
    id: row.id,
    slug: row.slug,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    doiUrl: row.doi_url,
    journal: row.journal,
    title: row.title,
    publishedAt: row.published_at.toISOString(),
    articleType: row.article_type,
    studyDesign: (row.study_design as StudyDesign) ?? classifyStudyDesign(row.article_type, row.title),
    topicIds: rankTopicIds(row.topic_ids ?? []),
    authors,
    shortSummary: row.short_summary,
    longSummary: row.long_summary,
    whyItMatters: row.why_it_matters ?? null,
    takeaway: row.takeaway ?? null,
    clinicalImpact: row.clinical_impact ?? null,
    methodQuality: row.method_quality ?? null,
    whoItsFor: row.who_its_for ?? null,
    imageUrl: row.image_url,
    openAccess: row.open_access,
    abstractAvailable: row.abstract_available,
    source: row.source
  });
}

function sampleWithExtras(): PaperRecord[] {
  return createSampleFeed();
}

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

const FEED_SELECT = `
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
  papers.study_design,
  papers.open_access,
  papers.abstract_available,
  coalesce(ps.short_summary, 'Summary pending.') as short_summary,
  ps.long_summary,
  ps.why_it_matters,
  ps.takeaway,
  ps.clinical_impact,
  ps.method_quality,
  ps.who_its_for,
  pi.image_url,
  array_remove(array_agg(ptm.topic_id order by t.priority), null) as topic_ids
`;

const FEED_JOINS = `
  from papers
  left join paper_summaries ps on ps.paper_id = papers.id
  left join paper_images pi on pi.paper_id = papers.id and pi.status = 'ready'
  left join paper_topic_map ptm on ptm.paper_id = papers.id
  left join topics t on t.id = ptm.topic_id
`;

const FEED_GROUP =
  "group by papers.id, ps.short_summary, ps.long_summary, ps.why_it_matters, ps.takeaway, ps.clinical_impact, ps.method_quality, ps.who_its_for, pi.image_url";

async function loadAuthorsForPapers(paperIds: string[]): Promise<Map<string, PaperAuthor[]>> {
  if (!pool || paperIds.length === 0) return new Map();
  const result = await pool.query<{
    paper_id: string;
    position: number;
    given_name: string;
    family_name: string;
  }>(
    "select paper_id, position, given_name, family_name from paper_authors where paper_id = any($1) order by position",
    [paperIds]
  );
  const map = new Map<string, PaperAuthor[]>();
  for (const row of result.rows) {
    const list = map.get(row.paper_id) ?? [];
    list.push({ given: row.given_name, family: row.family_name, position: row.position });
    map.set(row.paper_id, list);
  }
  return map;
}

export async function getFeed(topicId?: TopicId, limit = 20, cursor?: string) {
  if (!pool) {
    let items = sampleWithExtras();

    if (topicId) {
      items = items.filter((item) => item.topicIds.includes(topicId));
    }

    if (cursor) {
      items = items.filter((item) => item.publishedAt < cursor);
    }

    return items.slice(0, limit).map(sanitizePaperRecord);
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
    select ${FEED_SELECT}
    ${FEED_JOINS}
    ${where.length ? `where ${where.join(" and ")}` : ""}
    ${FEED_GROUP}
    order by papers.published_at desc
    limit $${params.length}
  `;

  const result = await pool.query<PaperRow>(query, params);
  const authorMap = await loadAuthorsForPapers(result.rows.map((r) => r.id));
  return result.rows.map((row) => rowToPaper(row, authorMap.get(row.id) ?? []));
}

export async function getPapersByPubmedSourceIds(pmids: string[]): Promise<PaperRecord[]> {
  if (!pool || pmids.length === 0) return [];

  const result = await pool.query<PaperRow>(
    `
      select ${FEED_SELECT}
      ${FEED_JOINS}
      where papers.source = 'pubmed' and papers.source_id = any($1::text[])
      ${FEED_GROUP}
      order by papers.published_at desc
    `,
    [pmids]
  );

  const authorMap = await loadAuthorsForPapers(result.rows.map((r) => r.id));
  return result.rows.map((row) => rowToPaper(row, authorMap.get(row.id) ?? []));
}

export async function getPaper(slugOrId: string) {
  const key = slugOrId.trim();
  const tryEsummary = async () => {
    const pmid = extractPmidFromSlugOrId(key) ?? (/^\d{5,10}$/.test(key) ? key : null);
    if (!pmid) return null;
    return fetchPaperRecordFromPubmedEsummary(pmid);
  };

  if (!pool) {
    const found = sampleWithExtras().find((paper) => paper.slug === key || paper.id === key);
    if (found) return sanitizePaperRecord(found);
    return tryEsummary();
  }

  const result = await pool.query<PaperRow>(
    `
      select ${FEED_SELECT}
      ${FEED_JOINS}
      where papers.slug = $1 or papers.id::text = $1
        or (papers.source = 'pubmed' and papers.source_id = $1)
      ${FEED_GROUP}
      limit 1
    `,
    [key]
  );

  const row = result.rows[0];
  if (row) {
    const authorMap = await loadAuthorsForPapers([row.id]);
    return rowToPaper(row, authorMap.get(row.id) ?? []);
  }

  return tryEsummary();
}

export async function searchPapers(query: string, limit = 20) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!pool) {
    const lower = trimmed.toLowerCase();
    return sampleWithExtras()
      .filter((p) => p.title.toLowerCase().includes(lower) || p.shortSummary.toLowerCase().includes(lower))
      .slice(0, limit)
      .map(sanitizePaperRecord);
  }

  const ftsParams = [trimmed, limit];
  const ftsSql = `
    select ${FEED_SELECT}
    ${FEED_JOINS}
    where papers.search_tsv @@ plainto_tsquery('english', $1)
    ${FEED_GROUP}
    order by ts_rank(papers.search_tsv, plainto_tsquery('english', $1)) desc
    limit $2
  `;

  try {
    const result = await pool.query<PaperRow>(ftsSql, ftsParams);
    const authorMap = await loadAuthorsForPapers(result.rows.map((r) => r.id));
    return result.rows.map((row) => rowToPaper(row, authorMap.get(row.id) ?? []));
  } catch {
    const needle = trimmed.toLowerCase();
    const fallbackParams = [needle, limit];
    const fallbackSql = `
      select ${FEED_SELECT}
      ${FEED_JOINS}
      where position($1 in lower(papers.title)) > 0
         or position($1 in lower(coalesce(ps.short_summary, ''))) > 0
         or position($1 in lower(coalesce(ps.long_summary, ''))) > 0
      ${FEED_GROUP}
      order by papers.published_at desc
      limit $2
    `;
    const result = await pool.query<PaperRow>(fallbackSql, fallbackParams);
    const authorMap = await loadAuthorsForPapers(result.rows.map((r) => r.id));
    return result.rows.map((row) => rowToPaper(row, authorMap.get(row.id) ?? []));
  }
}

export async function getRelatedPapers(paperId: string, topicId: TopicId, limit = 4) {
  if (!pool) {
    return sampleWithExtras()
      .filter((p) => p.topicIds.includes(topicId) && p.id !== paperId)
      .slice(0, limit)
      .map(sanitizePaperRecord);
  }

  const sql = `
    select ${FEED_SELECT}
    ${FEED_JOINS}
    where papers.id != $1
      and exists (select 1 from paper_topic_map ptm2 where ptm2.paper_id = papers.id and ptm2.topic_id = $2)
    ${FEED_GROUP}
    order by papers.published_at desc
    limit $3
  `;

  const result = await pool.query<PaperRow>(sql, [paperId, topicId, limit]);
  const authorMap = await loadAuthorsForPapers(result.rows.map((r) => r.id));
  return result.rows.map((row) => rowToPaper(row, authorMap.get(row.id) ?? []));
}

export async function closeDb() {
  await pool?.end();
}
