import type { Express, Request } from "express";
import { getSupabaseClient, isConfigured, getEnvStatus, parseInventoryEnv } from "../supabase";

const REQUIRED_TABLES = [
  "workflows",
  "workflow_snapshots",
  "workflow_nodes",
  "workflow_connections",
  "inventory_sync_runs",
];

const REQUIRED_VIEWS = [
  "workflows_with_latest_snapshot",
  "inventory_sync_runs_enriched",
  "inventory_sync_runs_daily",
];

function singleQueryParam(value: Request["query"][string]): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return undefined;
}

function parseLimit(value: string | undefined, fallback: number, max = 500): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parseDayWindow(day: string | undefined): { start: string; end: string } | null {
  if (!day) return null;
  const match = day.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const normalized = match[1];
  const start = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function registerInventoryRoutes(app: Express): void {
  app.get("/api/health", async (req, res) => {
    const environment = parseInventoryEnv(singleQueryParam(req.query.env));
    const envStatus = getEnvStatus(environment);
    const supabase = getSupabaseClient(environment);

    if (!isConfigured(environment) || !supabase) {
      return res.json({
        tables: REQUIRED_TABLES.map((name) => ({
          name,
          status: "error",
          count: null,
          error: "Supabase not configured",
        })),
        views: REQUIRED_VIEWS.map((name) => ({
          name,
          status: "error",
          count: null,
          error: "Supabase not configured",
        })),
        envStatus,
      });
    }
    const client = supabase;

    const tables = await Promise.all(
      REQUIRED_TABLES.map(async (name) => {
        try {
          const { count, error } = await client
            .from(name)
            .select("*", { count: "exact", head: true });

          if (error) {
            return { name, status: "error" as const, count: null, error: error.message };
          }
          return { name, status: "ok" as const, count: count ?? 0 };
        } catch (err: any) {
          return { name, status: "error" as const, count: null, error: err.message };
        }
      }),
    );

    const views = await Promise.all(
      REQUIRED_VIEWS.map(async (name) => {
        try {
          const { count, error } = await client
            .from(name)
            .select("*", { count: "exact", head: true });

          if (error) {
            return { name, status: "error" as const, count: null, error: error.message };
          }
          return { name, status: "ok" as const, count: count ?? 0 };
        } catch (err: any) {
          return { name, status: "error" as const, count: null, error: err.message };
        }
      }),
    );

    res.json({ tables, views, envStatus });
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

  app.get("/api/workflows", async (req, res) => {
    const environment = parseInventoryEnv(singleQueryParam(req.query.env));
    const supabase = getSupabaseClient(environment);

    if (!supabase) {
      return res.status(503).json({ message: "Supabase not configured" });
    }

    try {
      const q = singleQueryParam(req.query.q)?.trim();
      const tag = singleQueryParam(req.query.tag)?.trim();
      const active = parseBoolean(singleQueryParam(req.query.active));
      const includeSoftDeleted = parseBoolean(singleQueryParam(req.query.includeSoftDeleted)) ?? false;
      const limit = parseLimit(singleQueryParam(req.query.limit), 100, 500);

      let query = supabase
        .from("workflows_with_latest_snapshot")
        .select("*")
        .order("latest_snapshot_captured_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (q) {
        query = query.ilike("name", `%${q}%`);
      }
      if (tag) {
        query = query.contains("tags", [tag]);
      }
      if (typeof active === "boolean") {
        query = query.eq("active", active);
      }
      if (!includeSoftDeleted) {
        query = query.is("soft_deleted_at", null);
      }

      const { data, error } = await query;

      if (error) return res.status(500).json({ message: error.message });
      res.json(data ?? []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/workflows/:workflowId", async (req, res) => {
    const environment = parseInventoryEnv(singleQueryParam(req.query.env));
    const supabase = getSupabaseClient(environment);

    if (!supabase) {
      return res.status(503).json({ message: "Supabase not configured" });
    }

    const { workflowId } = req.params;

    try {
      const { data: workflow, error: wfError } = await supabase
        .from("workflows_with_latest_snapshot")
        .select("*")
        .eq("workflow_id", workflowId)
        .single();

      if (wfError) return res.status(404).json({ message: wfError.message });

      const { data: snapshots, error: snapError } = await supabase
        .from("workflow_snapshots")
        .select(`
          id:snapshot_id,
          workflow_id,
          captured_at,
          workflow_jsonb:workflow_json,
          definition_hash,
          version_id,
          version_counter,
          has_webhook_trigger,
          webhook_path,
          sync_run_id,
          execution_stats
        `)
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

  app.get("/api/sync-runs", async (req, res) => {
    const environment = parseInventoryEnv(singleQueryParam(req.query.env));
    const supabase = getSupabaseClient(environment);

    if (!supabase) {
      return res.status(503).json({ message: "Supabase not configured" });
    }

    try {
      const daily = parseBoolean(singleQueryParam(req.query.daily)) ?? false;
      const day = singleQueryParam(req.query.day)?.trim();
      const triggerSource = singleQueryParam(req.query.triggerSource)?.trim();
      const status = singleQueryParam(req.query.status)?.trim().toLowerCase();
      const limit = parseLimit(singleQueryParam(req.query.limit), daily ? 60 : 25, daily ? 365 : 200);

      if (daily) {
        let dailyQuery = supabase
          .from("inventory_sync_runs_daily")
          .select("*")
          .order("day", { ascending: false })
          .order("trigger_source", { ascending: true })
          .limit(limit);

        if (day) {
          dailyQuery = dailyQuery.eq("day", day);
        }
        if (triggerSource) {
          dailyQuery = dailyQuery.eq("trigger_source", triggerSource);
        }

        const { data, error } = await dailyQuery;

        if (error) return res.status(500).json({ message: error.message });
        return res.json(data ?? []);
      }

      let runsQuery = supabase
        .from("inventory_sync_runs_enriched")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);

      if (triggerSource) {
        runsQuery = runsQuery.eq("trigger_source", triggerSource);
      }

      if (status) {
        if (status === "success") {
          runsQuery = runsQuery.in("status", ["success", "completed"]);
        } else if (status === "error") {
          runsQuery = runsQuery.in("status", ["error", "failed"]);
        } else if (status === "running") {
          runsQuery = runsQuery.in("status", ["running", "in_progress"]);
        } else {
          runsQuery = runsQuery.eq("status", status);
        }
      }

      const dayWindow = parseDayWindow(day);
      if (dayWindow) {
        runsQuery = runsQuery
          .gte("started_at", dayWindow.start)
          .lt("started_at", dayWindow.end);
      }

      const { data, error } = await runsQuery;

      if (error) return res.status(500).json({ message: error.message });
      res.json(data ?? []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
}
