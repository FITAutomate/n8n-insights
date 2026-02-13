# CHANGELOG

## 2026-02-13

- Hardened server Supabase initialization to require `SUPABASE_SERVICE_ROLE_KEY` (no anon fallback for server reads).
- Split inventory API routes into `server/routes/inventory.ts` and simplified `server/routes.ts` registration.
- Removed unused legacy auth storage scaffolding (`server/storage.ts`) and stale shared user schema exports.
- Tightened migration SQL guidance to grant `n8n_inventory` schema/table access to `authenticated` and `service_role` only.
- Added `.env.example` and expanded `.gitignore` to ignore `.env*` while keeping `.env.example`.
- Added `typecheck` and `lint` scripts; made `dev`/`start` use `cross-env` for cross-platform compatibility.
- Added documentation scaffold: `docs/README.md`, `docs/refactor-notes.md`, and `docs/diagrams/README.md`.
- Updated health page setup messaging to local `.env` workflow.
