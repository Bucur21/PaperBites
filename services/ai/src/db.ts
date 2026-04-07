import "./env";

import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for the AI service.");
}

export const pool = new Pool({ connectionString });

export async function getPapersMissingSummaries(limit = 10) {
  const result = await pool.query<{
    id: string;
    title: string;
    journal: string;
    source_url: string;
    article_type: string;
  }>(
    `
      select p.id, p.title, p.journal, p.source_url, p.article_type
      from papers p
      left join paper_summaries ps on ps.paper_id = p.id
      where ps.paper_id is null
      order by p.published_at desc
      limit $1
    `,
    [limit]
  );

  return result.rows;
}

export async function saveSummary(input: {
  paperId: string;
  shortSummary: string;
  longSummary: string;
  whyItMatters: string | null;
  qualityFlags: string[];
  modelName: string;
}) {
  await pool.query(
    `
      insert into paper_summaries (
        paper_id,
        short_summary,
        long_summary,
        why_it_matters,
        model_name,
        prompt_version,
        quality_flags
      )
      values ($1, $2, $3, $4, $5, 'v1', $6)
      on conflict (paper_id) do update
      set
        short_summary = excluded.short_summary,
        long_summary = excluded.long_summary,
        why_it_matters = excluded.why_it_matters,
        model_name = excluded.model_name,
        prompt_version = excluded.prompt_version,
        quality_flags = excluded.quality_flags
    `,
    [input.paperId, input.shortSummary, input.longSummary, input.whyItMatters, input.modelName, input.qualityFlags]
  );
}

export async function saveImage(input: {
  paperId: string;
  prompt: string;
  imageUrl: string | null;
  status: "pending" | "ready" | "skipped";
  moderationNotes: string[];
  modelName: string;
}) {
  await pool.query(
    `
      insert into paper_images (paper_id, prompt, image_url, status, moderation_notes, model_name)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (paper_id) do update
      set
        prompt = excluded.prompt,
        image_url = excluded.image_url,
        status = excluded.status,
        moderation_notes = excluded.moderation_notes,
        model_name = excluded.model_name
    `,
    [input.paperId, input.prompt, input.imageUrl, input.status, input.moderationNotes, input.modelName]
  );
}
