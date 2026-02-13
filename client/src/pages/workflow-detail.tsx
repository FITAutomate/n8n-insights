import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  Archive,
  Camera,
  Check,
  Copy,
  WrapText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import type { N8nWorkflow, N8nWorkflowSnapshot } from "@shared/schema";

interface WorkflowDetailData {
  workflow: N8nWorkflow;
  snapshots: N8nWorkflowSnapshot[];
  snapshotError?: string;
}

export default function WorkflowDetailPage({ workflowId }: { workflowId: string }) {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [wrapJson, setWrapJson] = useState(false);

  const { data, isLoading, error } = useQuery<WorkflowDetailData>({
    queryKey: ["/api/workflows", workflowId],
  });

  useEffect(() => {
    if (!data?.snapshots?.length) return;
    setSelectedSnapshotId((prev) => prev ?? data.snapshots[0].id);
  }, [data]);

  const selectedSnapshot = useMemo(() => {
    if (!data?.snapshots?.length) return null;
    return data.snapshots.find((s) => s.id === selectedSnapshotId) ?? data.snapshots[0];
  }, [data, selectedSnapshotId]);

  if (isLoading) {
    return (
      <div className="fit-page space-y-6">
        <Skeleton className="h-10 w-64" />
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
      <div className="fit-page space-y-4">
        <Link href="/workflows">
          <Button variant="ghost" size="sm" data-testid="button-back-workflows">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Workflows
          </Button>
        </Link>
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load workflow: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { workflow, snapshots } = data;

  return (
    <div className="fit-page space-y-6">
      <PageHeader
        title={workflow.name}
        description={`Workflow ID: ${workflow.workflow_id}`}
        actions={
          <Link href="/workflows">
            <Button variant="ghost" size="sm" data-testid="button-back-workflows">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
        }
      >
        <div className="mt-3 flex items-center gap-2">
          {workflow.is_archived && (
            <Badge variant="secondary">
              <Archive className="w-3 h-3 mr-1" />
              Archived
            </Badge>
          )}
          <Badge variant={workflow.active ? "default" : "secondary"} data-testid="badge-detail-status">
            {workflow.active ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline">{snapshots.length} snapshots</Badge>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DetailItem label="Node Count" value={workflow.node_count?.toString() ?? "-"} />
            <DetailItem label="Updated" value={formatDate(workflow.updated_at)} />
            <DetailItem label="Last Seen" value={formatDate(workflow.last_seen_at)} />
            <DetailItem label="Created" value={formatDate(workflow.created_at)} />
          </div>
          {(workflow.tags?.length ?? 0) > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Tags</span>
              {workflow.tags?.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Snapshots</CardTitle>
            <CardDescription>Select a snapshot to inspect details and JSON</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.snapshotError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                Snapshot query error: {data.snapshotError}
              </div>
            )}

            {snapshots.length > 0 ? (
              snapshots.map((snapshot) => {
                const isSelected = selectedSnapshot?.id === snapshot.id;
                return (
                  <button
                    key={snapshot.id}
                    type="button"
                    onClick={() => setSelectedSnapshotId(snapshot.id)}
                    className={[
                      "w-full rounded-md border px-3 py-2 text-left transition-colors",
                      isSelected
                        ? "border-fit-blue bg-fit-blue/5"
                        : "border-fit-blue/15 bg-white hover:bg-fit-silver/50",
                    ].join(" ")}
                    data-testid={`row-snapshot-${snapshot.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Camera className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{formatDate(snapshot.captured_at)}</span>
                      </div>
                      {isSelected && <Badge variant="secondary">Selected</Badge>}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{snapshot.id?.slice(0, 8)}</span>
                      {snapshot.version_counter != null && <span>v{snapshot.version_counter}</span>}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Camera className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No snapshots captured yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Snapshot Metadata</CardTitle>
              <CardDescription>
                {selectedSnapshot ? `Selected snapshot: ${selectedSnapshot.id}` : "No snapshot selected"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSnapshot ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetaItem label="Captured At" value={formatDate(selectedSnapshot.captured_at)} />
                  <MetaItem label="Snapshot ID" value={selectedSnapshot.id} mono />
                  <MetaItem label="Definition Hash" value={selectedSnapshot.definition_hash ?? "-"} mono />
                  <MetaItem label="Version ID" value={selectedSnapshot.version_id ?? "-"} mono />
                  <MetaItem label="Version Counter" value={selectedSnapshot.version_counter?.toString() ?? "-"} />
                  <MetaItem label="Sync Run ID" value={selectedSnapshot.sync_run_id ?? "-"} mono />
                  <MetaItem label="Has Webhook Trigger" value={selectedSnapshot.has_webhook_trigger ? "Yes" : "No"} />
                  <MetaItem label="Webhook Path" value={selectedSnapshot.webhook_path ?? "-"} mono />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a snapshot to view metadata.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-base">Workflow JSON</CardTitle>
                  <CardDescription>Ergonomic viewer for selected snapshot JSON payload</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setWrapJson((current) => !current)}
                    disabled={!selectedSnapshot?.workflow_jsonb}
                    data-testid="button-toggle-wrap-json"
                  >
                    <WrapText className="h-3.5 w-3.5 mr-1" />
                    {wrapJson ? "Unwrap" : "Wrap"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!selectedSnapshot?.workflow_jsonb) return;
                      await navigator.clipboard.writeText(JSON.stringify(selectedSnapshot.workflow_jsonb, null, 2));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    disabled={!selectedSnapshot?.workflow_jsonb}
                    data-testid="button-copy-json"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-w-0">
              {selectedSnapshot?.workflow_jsonb ? (
                <div
                  className="max-h-[34rem] overflow-auto rounded-md border border-fit-blue/15 bg-fit-navy"
                  data-testid="text-workflow-json"
                >
                  <pre
                    className={[
                      "w-fit min-w-full p-4 text-xs text-fit-silver",
                      wrapJson ? "whitespace-pre-wrap break-words" : "whitespace-pre",
                    ].join(" ")}
                  >
                    {JSON.stringify(selectedSnapshot.workflow_jsonb, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="rounded-md border border-fit-blue/15 bg-white p-4 text-sm text-muted-foreground">
                  No JSON payload available for this snapshot.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-fit-blue/15 bg-white p-3">
      <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">{label}</p>
      <p className={["mt-1 text-sm", mono ? "font-mono text-xs break-all" : ""].join(" ")}>{value}</p>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
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
