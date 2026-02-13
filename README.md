# n8n Insights (by FIT Automate)

Internal dev-only dashboard for Supabase-backed n8n workflow inventory.

## Stack

- Client: React + Vite + TypeScript + Tailwind
- Server: Express + TypeScript
- Data: Supabase (`n8n_inventory` schema)

## Architecture

- Browser calls server endpoints under `/api/*`.
- Express routes query Supabase using server environment variables.
- Shared response/data types live in `shared/schema.ts`.

## Required environment

Copy `.env.example` to `.env` and set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `SUPABASE_ANON_KEY` (health visibility and local tools)
- `SUPABASE_ACCESS_TOKEN` (for MCP helper script in `.cursor/`)
- `PORT` (defaults to `5000`)

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Start built app: `npm run start`

## Pages

- `/health`
- `/workflows`
- `/workflows/:workflowId`
- `/sync-runs`

## Docs

- `docs/README.md`
- `docs/CHANGELOG.md`
- `docs/refactor-notes.md`
- `docs/diagrams/README.md`
