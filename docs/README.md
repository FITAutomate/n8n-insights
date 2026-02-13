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

## MCP Tooling

- Supabase MCP and Playwright MCP are configured locally in `.cursor/mcp.json`.
- `.cursor/` is intentionally git-ignored; local MCP setup stays machine-local.
- Playwright MCP uses the official package: `@playwright/mcp` (manual run: `npm run mcp:playwright`).

## App Pages

- `/health` - Supabase environment + table connectivity checks
- `/workflows` - workflow inventory list
- `/workflows/:workflowId` - workflow detail + recent snapshots
- `/sync-runs` - recent inventory sync run history
- `/reliability` - daily sync reliability rollup from view data

## Docs Index

- `docs/CHANGELOG.md` - append-only project change log (newest first)
- `docs/refactor-notes.md` - file moves, shims, and architecture refactors
- `docs/diagrams/README.md` - Mermaid diagram conventions and placement
- `docs/ui-style-guide.md` - frozen UI foundations and token usage
- `docs/theme-tuning.md` - quick knobs for light/dark visual tuning
- `docs/v2-roadmap.md` - redesign backlog and 7.7 content primitives/wish list
- `n8n-insights.md` - milestone tracker and phased delivery status
