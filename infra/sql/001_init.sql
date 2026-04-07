create extension if not exists "pgcrypto";

create table if not exists topics (
  id text primary key,
  label text not null,
  group_name text not null,
  description text not null,
  pubmed_query text not null,
  priority integer not null,
  keywords text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists papers (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  slug text not null unique,
  title text not null,
  journal text not null,
  published_at timestamptz not null,
  article_type text not null default 'Unknown',
  doi text,
  doi_url text,
  source_url text not null,
  abstract_available boolean not null default false,
  open_access boolean not null default false,
  language text not null default 'eng',
  generated_image_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '365 days',
  unique (source, source_id)
);

create table if not exists paper_topic_map (
  paper_id uuid not null references papers(id) on delete cascade,
  topic_id text not null references topics(id) on delete cascade,
  primary key (paper_id, topic_id)
);

create table if not exists paper_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references papers(id) on delete cascade,
  source text not null,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create table if not exists paper_summaries (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references papers(id) on delete cascade,
  short_summary text not null,
  long_summary text,
  why_it_matters text,
  model_name text not null,
  prompt_version text not null,
  quality_flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (paper_id)
);

create table if not exists paper_images (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references papers(id) on delete cascade,
  image_url text,
  prompt text not null,
  model_name text not null,
  status text not null default 'pending',
  moderation_notes text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (paper_id)
);

create table if not exists ingest_jobs (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null references topics(id) on delete cascade,
  source text not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  status text not null,
  items_seen integer not null default 0,
  items_inserted integer not null default 0,
  items_updated integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_papers_published_at on papers (published_at desc);
create index if not exists idx_papers_expires_at on papers (expires_at);
create index if not exists idx_snapshots_expires_at on paper_source_snapshots (expires_at);
