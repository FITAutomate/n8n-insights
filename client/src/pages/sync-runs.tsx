import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Clock, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { N8nInventorySyncRun } from "@shared/schema";

export default function SyncRunsPage() {
  const { data: runs, isLoading, error } = useQuery<N8nInventorySyncRun[]>({
    queryKey: ["/api/sync-runs"],
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-sync-runs-title">Sync Runs</h1>
        <p className="text-muted-foreground mt-1">
          {runs ? `Last ${runs.length} inventory sync runs` : "Loading..."}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-destructive">
          Failed to load sync runs: {(error as Error).message}
        </div>
      ) : runs && runs.length > 0 ? (
        <div className="space-y-3">
          {runs.map((run) => (
            <SyncRunCard key={run.id} run={run} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No sync runs found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SyncRunCard({ run }: { run: N8nInventorySyncRun }) {
  const [errorOpen, setErrorOpen] = useState(false);
  const hasErrors = run.errors_jsonb && (
    Array.isArray(run.errors_jsonb) ? run.errors_jsonb.length > 0 : Object.keys(run.errors_jsonb).length > 0
  );

  return (
    <Card data-testid={`card-sync-run-${run.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <StatusIcon status={run.status} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={run.status} />
                <span className="font-mono text-xs text-muted-foreground">{run.id?.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatDate(run.started_at)}</span>
                {run.finished_at && (
                  <>
                    <span className="mx-1">to</span>
                    <span>{formatDate(run.finished_at)}</span>
                    <span className="ml-1">({duration(run.started_at, run.finished_at)})</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm shrink-0">
            <Stat label="Seen" value={run.workflows_seen} />
            <Stat label="Changed" value={run.workflows_changed} />
            <Stat label="Snapshots" value={run.snapshots_inserted} />
          </div>
        </div>

        {hasErrors && (
          <Collapsible open={errorOpen} onOpenChange={setErrorOpen}>
            <CollapsibleTrigger asChild>
              <button
                className="flex items-center gap-1 mt-3 text-xs text-destructive"
                data-testid={`button-toggle-errors-${run.id}`}
              >
                <AlertCircle className="w-3 h-3" />
                <span>View Errors</span>
                {errorOpen ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs font-mono max-h-48">
                {JSON.stringify(run.errors_jsonb, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === "success" || s === "completed") {
    return <div className="w-2 h-2 rounded-full bg-status-online shrink-0 mt-1.5" />;
  }
  if (s === "running" || s === "in_progress") {
    return <div className="w-2 h-2 rounded-full bg-status-away shrink-0 mt-1.5 animate-pulse" />;
  }
  if (s === "error" || s === "failed") {
    return <div className="w-2 h-2 rounded-full bg-status-busy shrink-0 mt-1.5" />;
  }
  return <div className="w-2 h-2 rounded-full bg-status-offline shrink-0 mt-1.5" />;
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  if (s === "success" || s === "completed") variant = "default";
  if (s === "error" || s === "failed") variant = "destructive";

  return (
    <Badge variant={variant} data-testid={`badge-sync-status-${status}`}>
      {status}
    </Badge>
  );
}

function Stat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value ?? "—"}</p>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function duration(start: string, end: string): string {
  try {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem}s`;
  } catch {
    return "—";
  }
}
