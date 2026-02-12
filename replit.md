# Workflow Registry

## Overview
A front-end dashboard that connects to an external Supabase database to display n8n workflow data. It provides health monitoring, workflow browsing, and sync run tracking. Uses FIT Automate brand design system.

## Architecture
- **Frontend**: React + Vite + Tailwind + Shadcn UI + Wouter routing + TanStack Query
- **Backend**: Express.js API routes that proxy to Supabase
- **Database**: External Supabase (PostgreSQL) in `n8n_inventory` schema - not the built-in Replit DB
- **No auth** - running in dev mode

## Pages
- `/health` - System health check showing table connectivity and row counts
- `/workflows` - Table listing of all workflows with search
- `/workflows/[id]` - Workflow detail with recent snapshots and JSON viewer
- `/sync-runs` - Latest inventory sync runs with expandable error details

## Supabase Tables (n8n_inventory schema)
Tables live in the `n8n_inventory` schema (NOT public). Table names do NOT have `n8n_` prefix:
- `workflows` - Main workflow registry
- `workflow_snapshots` - Point-in-time workflow captures
- `workflow_nodes` - Individual workflow nodes
- `workflow_connections` - Node connections
- `inventory_sync_runs` - Sync operation history

## Supabase Configuration
- Client configured with `db: { schema: "n8n_inventory" }` in `server/supabase.ts`
- PostgREST exposed via `ALTER ROLE authenticator SET pgrst.db_schemas = 'public, n8n_inventory'`
- Schema permissions granted to anon, authenticated, service_role

## Environment Variables
- `SUPABASE_URL` (required) - Supabase project URL
- `SUPABASE_ANON_KEY` (required) - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` (optional) - Service role key for elevated access

## Key Files
- `server/supabase.ts` - Server-side Supabase client (service role key never exposed to browser)
- `server/routes.ts` - API endpoints (/api/health, /api/workflows, /api/sync-runs)
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/pages/` - All page components
- `shared/schema.ts` - TypeScript interfaces for data types

## Running
The app runs via `npm run dev` which starts Express + Vite on port 5000.
Visit `/health` first to verify database connectivity, then `/workflows`.
