export interface N8nWorkflow {
  workflow_id: string;
  name: string;
  active: boolean;
  is_archived: boolean;
  updated_at: string;
  node_count: number;
  last_seen_at: string;
  tags?: string[];
  latest_snapshot_id?: string | null;
  latest_snapshot_captured_at?: string | null;
  latest_definition_hash?: string | null;
  tag_count?: number;
  created_at?: string;
  first_seen_at?: string;
  soft_deleted_at?: string | null;
}

export interface N8nWorkflowSnapshot {
  id: string;
  workflow_id: string;
  captured_at: string;
  workflow_jsonb?: any;
  definition_hash?: string;
  version_id?: string;
  version_counter?: number;
  has_webhook_trigger?: boolean;
  webhook_path?: string;
  sync_run_id?: string;
  execution_stats?: any;
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
  workflows_unchanged?: number;
  snapshots_inserted?: number;
  duration_seconds?: number;
  errors_count?: number;
  errors_json?: any;
  trigger_source?: string;
  notes?: string | null;
  created_at?: string;
}

export interface TableHealth {
  name: string;
  status: "ok" | "error";
  count: number | null;
  error?: string;
}

export interface ViewHealth {
  name: string;
  status: "ok" | "error";
  count: number | null;
  error?: string;
}

export interface HealthCheckResponse {
  tables: TableHealth[];
  views: ViewHealth[];
  envStatus: {
    environment?: "dev" | "demo" | "prod";
    availableEnvironments?: {
      dev: boolean;
      demo: boolean;
      prod: boolean;
    };
    supabaseUrl: boolean;
    supabaseAnonKey: boolean;
    supabaseServiceRoleKey: boolean;
  };
}

export interface N8nInventorySyncRunDaily {
  day: string;
  trigger_source: string;
  runs_total: number;
  runs_success: number;
  runs_error: number;
  workflows_seen: number;
  workflows_changed: number;
  snapshots_inserted: number;
  errors_count: number;
}

export type SnippetType = "code" | "diagram" | "notes";

export interface ContentSnippet {
  id: string;
  title: string;
  type: SnippetType;
  language?: string;
  source?: string;
  body: string;
  tags?: string[];
  updatedAt?: string;
}
