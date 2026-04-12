create extension if not exists citext;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on sessions (user_id);
create index if not exists idx_sessions_expires_at on sessions (expires_at);

create table if not exists user_topic_interests (
  user_id uuid not null references users(id) on delete cascade,
  topic_id text not null references topics (id) on delete cascade,
  primary key (user_id, topic_id)
);

create table if not exists user_saved_papers (
  user_id uuid not null references users (id) on delete cascade,
  paper_id uuid not null references papers (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, paper_id)
);

create index if not exists idx_user_saved_papers_user on user_saved_papers (user_id);

create table if not exists user_paper_likes (
  user_id uuid not null references users (id) on delete cascade,
  paper_id uuid not null references papers (id) on delete cascade,
  liked_at timestamptz not null default now(),
  primary key (user_id, paper_id)
);

create index if not exists idx_user_paper_likes_user on user_paper_likes (user_id);
