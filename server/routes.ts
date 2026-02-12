import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabase, isConfigured, getEnvStatus } from "./supabase";

const REQUIRED_TABLES = [
  "n8n_workflows",
  "n8n_workflow_snapshots",
  "n8n_workflow_nodes",
  "n8n_workflow_connections",
  "n8n_inventory_sync_runs",
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

    const results = await Promise.all(
      REQUIRED_TABLES.map(async (name) => {
        try {
          const { count, error } = await supabase
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
      })
    );

    res.json({ tables: results, envStatus });
  });

  app.get("/api/migrate/sql", (_req, res) => {
    const sql = `-- FIT Automate: Create required tables for Workflow Registry
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

CREATE TABLE IF NOT EXISTS n8n_workflows (
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

CREATE TABLE IF NOT EXISTS n8n_workflow_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES n8n_workflows(workflow_id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ DEFAULT now(),
  workflow_jsonb JSONB,
  node_count INTEGER,
  connection_count INTEGER
);

CREATE TABLE IF NOT EXISTS n8n_workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES n8n_workflows(workflow_id) ON DELETE CASCADE,
  node_name TEXT NOT NULL DEFAULT '',
  node_type TEXT NOT NULL DEFAULT '',
  position_x REAL,
  position_y REAL
);

CREATE TABLE IF NOT EXISTS n8n_workflow_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES n8n_workflows(workflow_id) ON DELETE CASCADE,
  source_node TEXT NOT NULL DEFAULT '',
  target_node TEXT NOT NULL DEFAULT '',
  source_output INTEGER DEFAULT 0,
  target_input INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS n8n_inventory_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  workflows_seen INTEGER DEFAULT 0,
  workflows_changed INTEGER DEFAULT 0,
  snapshots_inserted INTEGER DEFAULT 0,
  errors_jsonb JSONB
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_snapshots_workflow_id ON n8n_workflow_snapshots(workflow_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at ON n8n_workflow_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_workflow_id ON n8n_workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_connections_workflow_id ON n8n_workflow_connections(workflow_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_started_at ON n8n_inventory_sync_runs(started_at DESC);
`;
    res.json({ sql });
  });

  app.get("/api/workflows", async (_req, res) => {
    if (!supabase) {
      return res.status(503).json({ message: "Supabase not configured" });
    }

    try {
      const { data, error } = await supabase
        .from("n8n_workflows")
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
        .from("n8n_workflows")
        .select("*")
        .eq("workflow_id", workflowId)
        .single();

      if (wfError) return res.status(404).json({ message: wfError.message });

      const { data: snapshots, error: snapError } = await supabase
        .from("n8n_workflow_snapshots")
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
        .from("n8n_inventory_sync_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(25);

      if (error) return res.status(500).json({ message: error.message });
      res.json(data ?? []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
