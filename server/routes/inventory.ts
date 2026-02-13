import type { Express } from "express";
import { supabase, isConfigured, getEnvStatus } from "../supabase";

const REQUIRED_TABLES = [
  "workflows",
  "workflow_snapshots",
  "workflow_nodes",
  "workflow_connections",
  "inventory_sync_runs",
];

export function registerInventoryRoutes(app: Express): void {
  app.get("/api/health", async (_req, res) => {
    const envStatus = getEnvStatus();

    if (!isConfigured() || !supabase) {
      return res.json({
        tables: REQUIRED_TABLES.map((name) => ({
          name,
          status: "error",
          count: null,
          error: "Supabase not configured",
        })),
        envStatus,
      });
    }
    const client = supabase;

    const results = await Promise.all(
      REQUIRED_TABLES.map(async (name) => {
        try {
          const { count, error } = await client
            .from(name)
            .select("*", { count: "exact" })
            .limit(1);

          if (error) {
            return { name, status: "error" as const, count: null, error: error.message };
          }
          return { name, status: "ok" as const, count: count ?? 0 };
        } catch (err: any) {
          return { name, status: "error" as const, count: null, error: err.message };
        }
      }),
    );

    res.json({ tables: results, envStatus });
  });

  app.get("/api/migrate/sql", (_req, res) => {
    const sql = `-- FIT Automate: Create required tables in n8n_inventory schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)

CREATE SCHEMA IF NOT EXISTS n8n_inventory;

CREATE TABLE IF NOT EXISTS n8n_inventory.workflows (
  workflow_id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  node_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS n8n_inventory.workflow_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES n8n_inventory.workflows(workflow_id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ DEFAULT now(),
  workflow_jsonb JSONB,
  node_count INTEGER,
  connection_count INTEGER
);

CREATE TABLE IF NOT EXISTS n8n_inventory.workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES n8n_inventory.workflows(workflow_id) ON DELETE CASCADE,
  node_name TEXT NOT NULL DEFAULT '',
  node_type TEXT NOT NULL DEFAULT '',
  position_x REAL,
  position_y REAL
);

CREATE TABLE IF NOT EXISTS n8n_inventory.workflow_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES n8n_inventory.workflows(workflow_id) ON DELETE CASCADE,
  source_node TEXT NOT NULL DEFAULT '',
  target_node TEXT NOT NULL DEFAULT '',
  source_output INTEGER DEFAULT 0,
  target_input INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS n8n_inventory.inventory_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  workflows_seen INTEGER DEFAULT 0,
  workflows_changed INTEGER DEFAULT 0,
  snapshots_inserted INTEGER DEFAULT 0,
  errors_jsonb JSONB
);

-- Grant API access for authenticated traffic and service role only.
GRANT USAGE ON SCHEMA n8n_inventory TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA n8n_inventory TO authenticated, service_role;

-- Expose schema to PostgREST
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, n8n_inventory';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
`;
    res.json({ sql });
  });

  app.get("/api/workflows", async (_req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: "Supabase not configured" });
    }

    try {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) return res.status(500).json({ message: error.message });
      res.json(data ?? []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/workflows/:workflowId", async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: "Supabase not configured" });
    }

    const { workflowId } = req.params;

    try {
      const { data: workflow, error: wfError } = await supabase
        .from("workflows")
        .select("*")
        .eq("workflow_id", workflowId)
        .single();

      if (wfError) return res.status(404).json({ message: wfError.message });

      const { data: snapshots, error: snapError } = await supabase
        .from("workflow_snapshots")
        .select("*")
        .eq("workflow_id", workflowId)
        .order("captured_at", { ascending: false })
        .limit(10);

      if (snapError) {
        return res.json({ workflow, snapshots: [], snapshotError: snapError.message });
      }

      res.json({ workflow, snapshots: snapshots ?? [] });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/sync-runs", async (_req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: "Supabase not configured" });
    }

    try {
      const { data, error } = await supabase
        .from("inventory_sync_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(25);

      if (error) return res.status(500).json({ message: error.message });
      res.json(data ?? []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
}
