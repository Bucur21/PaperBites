# PaperBites

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)](tsconfig.base.json)

**PaperBites** is a web-first, scroll-based feed of recent biomedical literature. It ingests papers from **PubMed**, stores metadata in **PostgreSQL**, and serves a **Next.js** UI with short summaries and direct links to PubMed and journal pages. Optional workers add AI summaries and (behind a flag) editorial-style images.

---

## Why this exists

Staying current with biomechanics, digital health, and clinical AI means scanning many new papers. PaperBites focuses on **fast scanning**: one screen, newest first, topic chips, and **source-first** links so readers always verify claims on the original article.

---

## Features

- **PubMed ingestion** — topic-based queries, deduplication, retention-friendly storage
- **REST API** — feed, topics, paper detail, content-policy metadata
- **Web app** — responsive feed and paper pages (`apps/web`)
- **AI enrichment** — summaries and optional image generation (configurable; see `.env.example`)
- **Monorepo** — shared types and topic definitions in `packages/shared`

Content and rights notes: [`CONTENT_POLICY.md`](CONTENT_POLICY.md).

---

## Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Web          | Next.js 15, React 19, Tailwind CSS  |
| API          | Fastify, Node.js                    |
| Data         | PostgreSQL                          |
| Ingestion    | NCBI E-utilities (PubMed)           |
| Infra (dev)  | Docker Compose (Postgres + Redis)   |

---

## Repository layout

```
apps/web           Next.js UI
services/api       Feed and metadata API
services/ingest    PubMed sync, seeding, retention
services/ai        Summary / image enrichment
packages/shared    Topics, types, sample data
infra/sql          Database schema
```

---

## Quick start

1. **Clone** the repository and open the project root.
2. Copy **`.env.example`** to **`.env`** and adjust `PUBMED_EMAIL` (and keys if you use them).
3. Start dependencies: `docker compose up -d`
4. Install: `npm install`
5. Seed topics: `npm run seed`
6. Sync papers: `npm run ingest:sync`
7. Enrich (optional): `npm run ai:process`
8. Run API: `npm run dev:api` (default `http://localhost:4000`)
9. Run web: `npm run dev:web` (default `http://localhost:3000`)

See **[`docs/GITHUB_ABOUT.md`](docs/GITHUB_ABOUT.md)** for copy-paste text to fill in the GitHub **About** section (description and topics).

---

## Environment

- **Never commit** `.env` — it is gitignored. Use `.env.example` as a template only.
- Without `DATABASE_URL`, the API can fall back to shared sample data so you can still develop the UI; use Docker + Postgres for the full pipeline.

---

## Scripts (root)

| Script            | Purpose              |
| ----------------- | -------------------- |
| `npm run dev:web` | Next.js dev server   |
| `npm run dev:api` | API dev server       |
| `npm run seed`    | Seed topic rows      |
| `npm run ingest:sync` | PubMed sync      |
| `npm run ai:process`  | AI enrichment    |
| `npm run typecheck`   | Typecheck all workspaces |

---

## License

[MIT](LICENSE)

---

## Contributing

Issues and pull requests are welcome. For larger changes, open an issue first so direction aligns with the thesis/product goals.
