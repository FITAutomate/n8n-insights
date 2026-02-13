# Refactor Notes

## 2026-02-13 hardening pass

- Moved inventory route definitions from `server/routes.ts` to `server/routes/inventory.ts`.
  - `server/routes.ts` now acts as route registration entrypoint only.
  - No API contract changes to existing `/api/*` endpoints.
- Removed `server/storage.ts` (unused legacy in-memory user storage scaffold).
- Removed legacy user table/schema exports from `shared/schema.ts` that were not used by this dashboard.

## Compatibility notes

- No framework changes.
- No route path changes.
- No DB migration files were generated in this pass.
