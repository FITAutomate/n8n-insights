import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export interface N8nWorkflow {
  workflow_id: string;
  name: string;
  active: boolean;
  is_archived: boolean;
  updated_at: string;
  node_count: number;
  last_seen_at: string;
  tags?: string[];
  created_at?: string;
}

export interface N8nWorkflowSnapshot {
  id: string;
  workflow_id: string;
  captured_at: string;
  workflow_jsonb?: any;
  node_count?: number;
  connection_count?: number;
}

export interface N8nWorkflowNode {
  id: string;
  workflow_id: string;
  node_name: string;
  node_type: string;
  position_x?: number;
  position_y?: number;
}

export interface N8nWorkflowConnection {
  id: string;
  workflow_id: string;
  source_node: string;
  target_node: string;
  source_output?: number;
  target_input?: number;
}

export interface N8nInventorySyncRun {
  id: string;
  status: string;
  started_at: string;
  finished_at?: string;
  workflows_seen?: number;
  workflows_changed?: number;
  snapshots_inserted?: number;
  errors_jsonb?: any;
}

export interface TableHealth {
  name: string;
  status: "ok" | "error";
  count: number | null;
  error?: string;
}

export interface HealthCheckResponse {
  tables: TableHealth[];
  envStatus: {
    supabaseUrl: boolean;
    supabaseAnonKey: boolean;
    supabaseServiceRoleKey: boolean;
  };
}
