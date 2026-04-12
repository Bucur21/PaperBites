alter table users
  add column if not exists has_publications boolean not null default false;

alter table users
  add column if not exists author_profile_urls jsonb not null default '[]'::jsonb;
