# n8n Insights Docs

Internal documentation for `n8n Insights (by FIT Automate)`.

## Purpose

- Keep architecture, operational notes, and hardening decisions in one place.
- Track change history and structural refactors in append-only logs.

## Local Run

1. Copy `.env.example` to `.env` and fill required Supabase values.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
4. Build production bundle: `npm run build`

## App Pages

- `/health` - Supabase environment + table connectivity checks
- `/workflows` - workflow inventory list
- `/workflows/:workflowId` - workflow detail + recent snapshots
- `/sync-runs` - recent inventory sync run history

## Docs Index

- `docs/CHANGELOG.md` - append-only project change log (newest first)
- `docs/refactor-notes.md` - file moves, shims, and architecture refactors
- `docs/diagrams/README.md` - Mermaid diagram conventions and placement
