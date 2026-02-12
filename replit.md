# Workflow Registry

## Overview
A front-end dashboard that connects to an external Supabase database to display n8n workflow data. It provides health monitoring, workflow browsing, and sync run tracking.

## Architecture
- **Frontend**: React + Vite + Tailwind + Shadcn UI + Wouter routing + TanStack Query
- **Backend**: Express.js API routes that proxy to Supabase
- **Database**: External Supabase (PostgreSQL) - not the built-in Replit DB
- **No auth** - running in dev mode (comments indicate where to add auth later)

## Pages
- `/health` - System health check showing table connectivity and row counts
- `/workflows` - Table listing of all n8n_workflows with search
- `/workflows/[id]` - Workflow detail with recent snapshots and JSON viewer
- `/sync-runs` - Latest inventory sync runs with expandable error details

## Required Supabase Tables
- `n8n_workflows` - Main workflow registry
- `n8n_workflow_snapshots` - Point-in-time workflow captures
- `n8n_workflow_nodes` - Individual workflow nodes
- `n8n_workflow_connections` - Node connections
- `n8n_inventory_sync_runs` - Sync operation history

## Environment Variables
- `SUPABASE_URL` (required) - Supabase project URL
- `SUPABASE_ANON_KEY` (required) - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` (optional) - Service role key for elevated access

## Key Files
- `server/supabase.ts` - Server-side Supabase client (service role key never exposed to browser)
- `server/routes.ts` - API endpoints (/api/health, /api/workflows, /api/sync-runs)
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/pages/` - All page components

## Running
The app runs via `npm run dev` which starts Express + Vite on port 5000.
Visit `/health` first to verify database connectivity, then `/workflows`.
