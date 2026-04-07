# Research Feed App

Web-first scientific research feed for biomechanics, AI in health, rehabilitation, wearables, and related topics.

## Workspace layout
- `apps/web`: Next.js feed UI.
- `services/api`: Fastify API for topics, feed items, paper details, and content policy.
- `services/ingest`: PubMed ingestion worker, deduplication, topic seeding, and retention jobs.
- `services/ai`: summary generation and optional image generation worker.
- `packages/shared`: shared topics, types, content policy, and sample data.
- `infra/sql`: Postgres schema.

## Quick start
1. Copy `.env.example` to `.env`.
2. Start Postgres and Redis with `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Seed topics with `npm run seed`.
5. Sync recent PubMed papers with `npm run ingest:sync`.
6. Generate summaries with `npm run ai:process`.
7. Start the API with `npm run dev:api`.
8. Start the web app with `npm run dev:web`.

## Notes
- If `DATABASE_URL` is not configured for the API or the web app cannot reach the API, the UI falls back to shared sample data so you can still iterate on the interface.
- `ENABLE_AI_IMAGES=false` by default because image generation should stay behind a feature flag until editorial review rules are settled.
- Content handling rules are documented in `CONTENT_POLICY.md`.
