# n8n Workflow Inventory Plan

Purpose: build and operate a reliable inventory of all n8n workflows in Supabase, including full JSON snapshots and queryable summary structure.

## Milestone 0a - Document
- [x] Create milestone-driven checklist with acceptance criteria.
- [x] Define phased delivery path (no big-bang cutover).
- [x] Add rollback expectations per milestone.

Acceptance criteria
- Working demo: this document exists and is current.
- Sample queries: included in each milestone section where applicable.
- Rollback plan: defined in each milestone section.

## Milestone 0 - Connectivity Proof
- [x] Confirm n8n MCP API health.
- [x] Confirm n8n workflow listing from API.
- [x] Confirm Supabase project/auth connectivity.
- [x] Confirm tiny Supabase write/read probe (storage round-trip) with cleanup of probe object.

Evidence captured (2026-02-12)
- n8n: `n8n_health_check` status `ok`.
- n8n: `n8n_list_workflows` returned 7 workflows.
- Supabase: invalid bearer returns `401`; valid token accepted by project endpoint.
- Supabase write/read: storage probe object write `200`, read `200`, content match `true`, direct object delete `200`.

Acceptance criteria
- Working demo: live calls succeeded for n8n and Supabase.
- Sample queries:
  - n8n: list workflows and inspect one detail payload.
  - Supabase: write/read probe object.
- Rollback plan:
  - Delete probe object path (`storage/v1/object/<bucket>/<path>`).
  - Remove temporary probe bucket only if dedicated and empty.

## Milestone 1 - DB Schema
- [x] Draft migration SQL for inventory schema, keys, indexes, and constraints.
- [x] Add minimal RLS posture for service-role ingestion.
- [x] Add rollback SQL (drop inventory schema).
- [x] Add short schema reference doc.
- [x] Apply migration in Supabase environment.
- [x] Run post-migration smoke query against each table.

Acceptance criteria
- Working demo:
  - Migration file present: `supabase/migrations/0001_n8n_workflow_inventory.sql`.
  - Rollback file present: `supabase/migrations/0001_n8n_workflow_inventory.rollback.sql`.
  - Schema doc present: `docs/n8n-workflow-inventory-schema.md`.
- Sample queries:
  - `select count(*) from n8n_inventory.workflows;`
  - `select count(*) from n8n_inventory.workflow_snapshots;`
  - `select count(*) from n8n_inventory.inventory_sync_runs;`
- Rollback plan:
  - Execute `supabase/migrations/0001_n8n_workflow_inventory.rollback.sql`.

Evidence captured (2026-02-12)
- Migration applied to project `dpupymjdqlfsdfsaxolj`.
- Smoke queries returned:
  - `n8n_inventory.workflows` count = `0`
  - `n8n_inventory.workflow_snapshots` count = `0`
  - `n8n_inventory.inventory_sync_runs` count = `0`
- Metadata verification:
  - `information_schema.schemata` contains `n8n_inventory`
  - `information_schema.tables` shows 5 tables in `n8n_inventory`

## Milestone 2 - Sync v1 (Manual)
- [x] Build manual n8n workflow run that:
- [x] Lists workflows.
- [x] Pulls full details per workflow.
- [x] Stores current workflow rows.
- [x] Stores one JSONB snapshot row per changed definition.
- [x] Inserts one sync run row with counts/status.
- [x] Demo a successful manual run.

Acceptance criteria
- Working demo: one successful manual sync run and persisted rows.
- Sample queries:
  - last run status/counts from `inventory_sync_runs`.
  - latest snapshot count by workflow.
- Rollback plan:
  - Delete rows by `sync_run_id` from snapshots/nodes/connections/workflows if needed.

Evidence captured (2026-02-12)
- Manual-v1 sync executed via MCP-sourced workflow inventory seed into Supabase.
- Post-run counts:
  - `n8n_inventory.workflows` count = `7`
  - `n8n_inventory.workflow_snapshots` count = `7`
  - `n8n_inventory.inventory_sync_runs` count = `3`
- Notes:
  - `.env` `N8N_API_KEY` returned `401` for direct REST from shell, so manual-v1 used n8n MCP tool output as the authoritative source for this first run.
  - Snapshot payload currently stores a compact workflow summary JSON (`snapshotSource = mcp-manual-v1`) for milestone proof.
- Full raw workflow JSON capture remains pending for Milestone 2.1 (before Milestone 3 scheduling).

## Milestone 2.1 - Full Raw JSON Backfill
- [x] Restore direct n8n API export path by fixing local API credential.
- [x] Run full-raw workflow snapshot backfill from `/api/v1/workflows`.
- [x] Validate latest snapshot per workflow contains raw graph payload (`nodes`, `connections`).

Acceptance criteria
- Working demo: latest snapshot rows include full workflow graph JSON.
- Sample queries:
  - `select workflow_id, captured_at from n8n_inventory.workflow_snapshots order by captured_at desc limit 10;`
  - `select workflow_json from n8n_inventory.workflow_snapshots where workflow_id = '<id>' order by captured_at desc limit 1;`
- Rollback plan:
  - Delete/restore affected snapshot rows by `sync_run_id`, then rerun reconcile.

Evidence captured (2026-02-13)
- `workflow_snapshots` schema includes `workflow_json` and sync metadata (`snapshot_id`, `sync_run_id`, `definition_hash`).
- `/api/workflows/:workflowId` now reads latest workflow metadata from view and snapshots from `workflow_snapshots`.

## Milestone 3 - Ops Hardening + View Contract
- [x] Add and validate inventory views for query-first access.
- [x] Capture query pack + runbook in repo docs for operators.
- [x] Keep base tables as storage, views as read contract.

Acceptance criteria
- Working demo:
  - `docs/n8n-inventory-query-pack.md` present.
  - `docs/n8n-inventory-runbook.md` present.
  - Required views accessible and returning rows.
- Sample queries:
  - `select * from n8n_inventory.workflows_with_latest_snapshot limit 20;`
  - `select * from n8n_inventory.inventory_sync_runs_enriched order by started_at desc limit 20;`
  - `select * from n8n_inventory.inventory_sync_runs_daily order by day desc, trigger_source;`
- Rollback plan:
  - Roll back views migration via `supabase/migrations/0003_n8n_inventory_ops_hardening.rollback.sql`.
  - Re-apply via `supabase/migrations/0003_n8n_inventory_ops_hardening.sql`.

Evidence captured (2026-02-13)
- Health checks show:
  - `workflows_with_latest_snapshot` count = `13`
  - `inventory_sync_runs_enriched` count = `39`
  - `inventory_sync_runs_daily` count = `4`

## Milestone 4 - Dashboard Hardening Baseline
- [x] Enforce server-side Supabase trust boundary (`SERVICE_ROLE` only server-side).
- [x] Add env guardrails (`.env.example`, `.gitignore` protection for `.env*`).
- [x] Add docs scaffold and update build discipline.
- [x] Confirm build/typecheck/lint pass.

Acceptance criteria
- Working demo:
  - Repo includes docs scaffold (`docs/README.md`, `docs/CHANGELOG.md`, `docs/refactor-notes.md`, `docs/diagrams/README.md`).
  - Build gates pass locally.
- Sample checks:
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
- Rollback plan:
  - Revert hardening commit(s) on feature branch and restore previous route/layout structure if needed.

Evidence captured (2026-02-13)
- Commits:
  - `2986bc6` hardening baseline
  - `0251a2d` `.cursor/` ignore rule
- Build and type checks completed successfully.

## Milestone 5 - View-Backed API/UI Contract
- [x] Migrate `/api/workflows` to `workflows_with_latest_snapshot` with simple filters.
- [x] Migrate `/api/sync-runs` to `inventory_sync_runs_enriched` and support `?daily=true`.
- [x] Update `/api/health` to validate tables + views.
- [x] Update UI pages to consume view-backed responses.
- [x] Add starter `/reliability` page from `inventory_sync_runs_daily`.
- [x] Reduce API logging to minimal by default with verbose opt-in.

Acceptance criteria
- Working demo:
  - `/workflows` and `/sync-runs` use view-backed endpoints.
  - Tag filter works via `?tag=...` against view-backed `tags` array.
  - `/health` reports both table and view status.
  - `/reliability` route is available and query-backed.
- Sample checks:
  - `GET /api/workflows?tag=inDev`
  - `GET /api/sync-runs`
  - `GET /api/sync-runs?daily=true`
  - `GET /api/health`
- Rollback plan:
  - Revert feature commit `61a8cad` and restore prior table-backed endpoint logic.

Evidence captured (2026-02-13)
- Feature commit: `61a8cad` (`Use inventory views for queries + add reliability page + logging toggle`).
- Merge commit to `main`: `508be72`.
- Runtime smoke:
  - `GET /api/health` returned `200` with table + view counts.
- Quality gates:
  - `npm run build` passed
  - `npm run typecheck` passed
  - `npm run lint` passed

## Milestone 6 - Branch Boundary + Cleanup
- [x] Push feature branch and merge into `main`.
- [x] Create next-phase branch `feat/ui-redesign-v1`.
- [x] Diagnose and resolve unexpected dirty tree (line endings normalization).

Acceptance criteria
- Working demo:
  - `main` includes merged feature changes.
  - next branch created and clean.
- Sample checks:
  - `git log --oneline --decorate -n 4`
  - `git status`
- Rollback plan:
  - Revert merge commit on `main` if regression found.
  - Remove normalization commit if policy changes.

Evidence captured (2026-02-13)
- `feat/use-inventory-views-for-queries` pushed and merged to `main`.
- Next branch created: `feat/ui-redesign-v1`.
- Line endings normalization commit: `4106373`.

## Milestone 7 - UI/UX redesign v1
- [x] 7.0 UX foundations freeze (new app shell, page header standard, one table standard, style guide).
- [x] 7.1 Environment selector plumbing (`env=dev|prod` end-to-end).
- [x] 7.2 Navigation redesign for scalable page growth.
- [x] 7.3 Workflows page v2 URL-driven filters and tag chips.
- [x] 7.4 Workflow detail page v2.
- [x] 7.5 Sync runs v2 + reliability drilldowns.
- [x] 7.6 UI polish + hardening.
- [ ] 7.7 Content primitives (`CodeBlock`, `MermaidBlock`, generated snippets from workflow graph data).
- [x] 7.8 Light/dark theme system (FIT token-aware toggle and persistence).

Acceptance criteria
- Working demo: each sub-milestone ships with build/type/lint pass.
- Sample checks:
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
- Rollback plan:
  - Revert per-sub-milestone commit(s) without schema impact.

Evidence captured (2026-02-13)
- 7.0 completed with `docs/ui-style-guide.md` and shared layout primitives.
- 7.1 completed with env selector and server env routing.
- 7.2 completed with grouped nav config.
- 7.3 completed with reactive URL-driven workflows filters.
- 7.4 completed with snapshot selection UX and JSON viewer controls.
- 7.5 completed with URL-driven sync run filters and reliability drilldowns to filtered run history.
- 7.6 completed with table/readability polish, wrapped error payload UX, and docs/runtime hardening notes.
- 7.8 completed with persisted light/dark mode toggle in shell header and token-aware dark style adjustments.

Notes
- Keep runtime configuration Supabase-focused for this repo.
- Keep server-proxy pattern (`/api/*`) as the browser/server trust boundary.
