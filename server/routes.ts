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
            .select("*", { count: "exact", head: true });

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
