-- Full-text search: generated tsvector column on papers
ALTER TABLE papers ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_papers_search_tsv ON papers USING gin(search_tsv);

-- Missing index for topic filtering
CREATE INDEX IF NOT EXISTS idx_paper_topic_map_topic_id ON paper_topic_map (topic_id);

-- Authors table
CREATE TABLE IF NOT EXISTS paper_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  position integer NOT NULL,
  given_name text NOT NULL DEFAULT '',
  family_name text NOT NULL DEFAULT '',
  UNIQUE (paper_id, position)
);

CREATE INDEX IF NOT EXISTS idx_paper_authors_paper_id ON paper_authors (paper_id);

-- Study design classification on papers
ALTER TABLE papers ADD COLUMN IF NOT EXISTS study_design text;

-- Why it matters on paper_summaries (already has why_it_matters column)
-- No change needed -- column exists from 001_init.sql
