import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  GitBranch,
  Clock,
  Camera,
  ChevronDown,
  ChevronRight,
  Archive,
  Code,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { N8nWorkflow, N8nWorkflowSnapshot } from "@shared/schema";

interface WorkflowDetailData {
  workflow: N8nWorkflow;
  snapshots: N8nWorkflowSnapshot[];
  snapshotError?: string;
}

export default function WorkflowDetailPage({ workflowId }: { workflowId: string }) {
  const [jsonOpen, setJsonOpen] = useState(false);

  const { data, isLoading, error } = useQuery<WorkflowDetailData>({
    queryKey: ["/api/workflows", workflowId],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link href="/workflows">
          <Button variant="ghost" size="sm" data-testid="button-back-workflows">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Workflows
          </Button>
        </Link>
        <div className="mt-6 text-sm text-destructive">
          Failed to load workflow: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { workflow, snapshots } = data;
  const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/workflows">
          <Button variant="ghost" size="sm" data-testid="button-back-workflows">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 shrink-0">
                <GitBranch className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-xl truncate" data-testid="text-workflow-detail-name">
                  {workflow.name}
                </CardTitle>
                <CardDescription className="font-mono text-xs mt-1">
                  ID: {workflow.workflow_id}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {workflow.is_archived && (
                <Badge variant="secondary">
                  <Archive className="w-3 h-3 mr-1" />
                  Archived
                </Badge>
              )}
              <Badge variant={workflow.active ? "default" : "secondary"} data-testid="badge-detail-status">
                {workflow.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DetailItem label="Node Count" value={workflow.node_count?.toString() ?? "—"} />
            <DetailItem label="Updated" value={formatDate(workflow.updated_at)} />
            <DetailItem label="Last Seen" value={formatDate(workflow.last_seen_at)} />
            <DetailItem label="Created" value={formatDate(workflow.created_at)} />
          </div>
          {workflow.tags && workflow.tags.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Tags:</span>
              {workflow.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base">Recent Snapshots</CardTitle>
              <CardDescription>
                {snapshots.length > 0
                  ? `Latest ${snapshots.length} snapshot${snapshots.length > 1 ? "s" : ""}`
                  : "No snapshots found"}
              </CardDescription>
            </div>
            <Badge variant="outline">
              <Camera className="w-3 h-3 mr-1" />
              {snapshots.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.snapshotError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Snapshot query error: {data.snapshotError}
            </div>
          )}
          {snapshots.length > 0 ? (
            <div className="space-y-2">
              {snapshots.map((snap, idx) => (
                <div
                  key={snap.id}
                  className="flex items-center justify-between gap-4 rounded-md border px-4 py-3"
                  data-testid={`row-snapshot-${snap.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm">{formatDate(snap.captured_at)}</span>
                    {idx === 0 && <Badge variant="secondary">Latest</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                    {snap.node_count != null && <span>{snap.node_count} nodes</span>}
                    {snap.connection_count != null && <span>{snap.connection_count} connections</span>}
                    <span className="font-mono text-xs">{snap.id?.slice(0, 8)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Camera className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No snapshots captured yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {latestSnapshot?.workflow_jsonb && (
        <Card>
          <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center justify-between gap-2 w-full text-left"
                  data-testid="button-toggle-json"
                >
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-base">Workflow JSON</CardTitle>
                    <CardDescription className="ml-2">Latest snapshot data</CardDescription>
                  </div>
                  {jsonOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <pre
                  className="overflow-auto rounded-md bg-muted p-4 text-xs font-mono max-h-96"
                  data-testid="text-workflow-json"
                >
                  {JSON.stringify(latestSnapshot.workflow_jsonb, null, 2)}
                </pre>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}
