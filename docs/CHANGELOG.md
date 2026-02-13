# CHANGELOG

## 2026-02-13

- Changed API request logging to minimal output by default (method/path/status/duration + outcome) and added opt-in verbose mode via `API_LOG_MODE=verbose` with truncated payload logging.
- Migrated `/api/workflows` from base table reads to `n8n_inventory.workflows_with_latest_snapshot` with optional filters: `q`, `tag`, `active`, `includeSoftDeleted`, `limit`.
- Migrated `/api/sync-runs` default source to `n8n_inventory.inventory_sync_runs_enriched` and added `?daily=true` support via `n8n_inventory.inventory_sync_runs_daily`.
- Updated `/api/health` to validate and count required views (`workflows_with_latest_snapshot`, `inventory_sync_runs_enriched`, `inventory_sync_runs_daily`) in addition to required tables.
- Updated `/api/workflows/:workflowId` to source workflow metadata from `workflows_with_latest_snapshot`; snapshot details remain table-backed from `workflow_snapshots`.
- Updated UI pages to consume view-backed responses and added starter `/reliability` page using `inventory_sync_runs_daily`.
- Hardened server Supabase initialization to require `SUPABASE_SERVICE_ROLE_KEY` (no anon fallback for server reads).
- Split inventory API routes into `server/routes/inventory.ts` and simplified `server/routes.ts` registration.
- Removed unused legacy auth storage scaffolding (`server/storage.ts`) and stale shared user schema exports.
- Tightened migration SQL guidance to grant `n8n_inventory` schema/table access to `authenticated` and `service_role` only.
- Added `.env.example` and expanded `.gitignore` to ignore `.env*` while keeping `.env.example`.
- Added `typecheck` and `lint` scripts; made `dev`/`start` use `cross-env` for cross-platform compatibility.
- Added documentation scaffold: `docs/README.md`, `docs/refactor-notes.md`, and `docs/diagrams/README.md`.
- Updated health page setup messaging to local `.env` workflow.
