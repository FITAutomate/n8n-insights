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

First run:

1. Install dependencies: `npm install`
2. Copy env template: `Copy-Item .env.example .env` (PowerShell)
3. Set required variables in `.env`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional env selector overrides:
- `SUPABASE_URL_DEV`, `SUPABASE_SERVICE_ROLE_KEY_DEV`
- `SUPABASE_URL_PROD`, `SUPABASE_SERVICE_ROLE_KEY_PROD`

Optional:

- `SUPABASE_ANON_KEY` (health visibility and local tools)
- `SUPABASE_ACCESS_TOKEN` (for MCP helper script in `.cursor/`)
- `PORT` (defaults to `5000`)

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Start built app: `npm run start`
- Playwright MCP (headless): `npm run mcp:playwright`

## Troubleshooting

- If `npm run dev` ignores `.env` values (for example falls back to port `5000`), ensure `.env` contains `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- If you hit `Error: listen ENOTSUP ... 0.0.0.0:5000` on Windows/Node 24, pull latest changes from this branch; server startup has been updated to avoid unsupported socket options.
- If you hit `EADDRINUSE`, the selected `PORT` is already occupied; change `PORT` in `.env` (for example `4000`) and restart.
- PostCSS warning (`did not pass the from option`) is currently known and non-fatal in this setup.
- API logs are minimal by default. To enable deeper payload logging temporarily, set `API_LOG_MODE=verbose` in `.env` and restart `npm run dev`.
- Environment selector in the header persists to localStorage and sends `env=dev|prod` to `/api/*`; if env-specific Supabase vars are unset, both modes intentionally fall back to base dev config.
- Backend route changes require a full `npm run dev` restart in this setup (client HMR does not reload server route code).

## Pages

- `/health`
- `/workflows`
- `/workflows/:workflowId`
- `/sync-runs`
- `/reliability`

## Docs

- `docs/README.md`
- `docs/CHANGELOG.md`
- `docs/refactor-notes.md`
- `docs/diagrams/README.md`
- `n8n-insights.md` (milestone tracker / execution plan)

## Local MCP Setup

- This repo keeps MCP config local in `.cursor/mcp.json` (the `.cursor/` folder is git-ignored by design).
- Playwright MCP server entry (official package): `npx -y @playwright/mcp@latest`.
- If you need to run the server manually for diagnostics, use `npm run mcp:playwright`.
