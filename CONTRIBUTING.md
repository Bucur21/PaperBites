# Contributing

Thanks for your interest in PaperBites.

## Before you start

- Read [`CONTENT_POLICY.md`](CONTENT_POLICY.md) for how we handle metadata, summaries, and outbound links.
- Do not commit secrets. Use `.env` locally; only `.env.example` belongs in the repo.

## Development

1. `npm install` at the repository root
2. `docker compose up -d` for Postgres (and Redis)
3. Copy `.env.example` to `.env`
4. `npm run typecheck` before opening a pull request

## Pull requests

- Keep changes focused and described in the PR text.
- Note if your change affects ingestion rate limits, database schema, or AI behavior.
