import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ContentTabs } from "@/components/content/content-tabs";
import { CodeBlock } from "@/components/content/code-block";
import { MermaidBlock } from "@/components/content/mermaid-block";
import { Callout } from "@/components/content/callout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContentSnippet, GeneratedWorkflowSnippetsResponse, N8nWorkflow } from "@shared/schema";

function parseWorkflowId(search: string): string {
  const params = new URLSearchParams(search.replace(/^\?/, ""));
  return params.get("workflowId") ?? "";
}

function buildSnippetsUrl(workflowId: string): string {
  const query = new URLSearchParams();
  if (workflowId) query.set("workflowId", workflowId);
  const value = query.toString();
  return value ? `/snippets?${value}` : "/snippets";
}

function firstSnippet(snippets: ContentSnippet[] | undefined, type: ContentSnippet["type"]) {
  return (snippets ?? []).find((snippet) => snippet.type === type);
}

function snippetsByType(snippets: ContentSnippet[] | undefined, type: ContentSnippet["type"]) {
  return (snippets ?? []).filter((snippet) => snippet.type === type);
}

export default function SnippetsPage() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const search = useSearch();
  const workflowIdFromUrl = useMemo(() => parseWorkflowId(search), [search]);

  const {
    data: workflows,
    isLoading: workflowsLoading,
    error: workflowsError,
  } = useQuery<N8nWorkflow[]>({
    queryKey: ["/api/workflows?limit=250"],
  });

  const selectedWorkflowId = useMemo(() => {
    if (!workflows?.length) return "";
    if (workflowIdFromUrl && workflows.some((workflow) => workflow.workflow_id === workflowIdFromUrl)) {
      return workflowIdFromUrl;
    }
    return workflows[0].workflow_id;
  }, [workflows, workflowIdFromUrl]);

  useEffect(() => {
    if (!workflows?.length || !selectedWorkflowId) return;
    if (workflowIdFromUrl !== selectedWorkflowId) {
      navigate(buildSnippetsUrl(selectedWorkflowId), { replace: !workflowIdFromUrl });
    }
  }, [navigate, selectedWorkflowId, workflowIdFromUrl, workflows]);

  const snippetsPath = selectedWorkflowId
    ? `/api/workflows/${encodeURIComponent(selectedWorkflowId)}/snippets`
    : "";

  const {
    data: generated,
    isLoading: snippetsLoading,
    error: snippetsError,
  } = useQuery<GeneratedWorkflowSnippetsResponse>({
    queryKey: [snippetsPath],
    enabled: Boolean(snippetsPath),
  });

  const codeSnippets = useMemo(
    () => snippetsByType(generated?.snippets, "code"),
    [generated?.snippets],
  );
  const diagramSnippet = useMemo(
    () => firstSnippet(generated?.snippets, "diagram"),
    [generated?.snippets],
  );
  const notesSnippet = useMemo(
    () => firstSnippet(generated?.snippets, "notes"),
    [generated?.snippets],
  );

  return (
    <div className="fit-page space-y-6">
      <PageHeader
        title="Content Snippets"
        description={
          generated?.workflow
            ? `Generated from ${generated.workflow.name}`
            : "Generate code, diagrams, and notes from workflow inventory"
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries()}
            data-testid="button-refresh-snippets"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Workflow</p>
              {workflowsLoading ? (
                <Skeleton className="h-9 w-full max-w-xl" />
              ) : workflowsError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Failed to load workflows: {(workflowsError as Error).message}
                </div>
              ) : workflows && workflows.length > 0 ? (
                <Select
                  value={selectedWorkflowId}
                  onValueChange={(nextWorkflowId) => navigate(buildSnippetsUrl(nextWorkflowId), { replace: false })}
                >
                  <SelectTrigger className="max-w-xl" data-testid="select-snippet-workflow">
                    <SelectValue placeholder="Select a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow.workflow_id} value={workflow.workflow_id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-md border border-fit-blue/20 bg-fit-silver px-3 py-2 text-sm text-muted-foreground">
                  No workflows available to generate snippets.
                </div>
              )}
            </div>

            {generated && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" data-testid="badge-snippet-node-count">
                  {generated.metadata.nodeCount} nodes
                </Badge>
                <Badge variant="secondary" data-testid="badge-snippet-connection-count">
                  {generated.metadata.connectionCount} edges
                </Badge>
                <Badge variant="outline" data-testid="badge-snippet-generator-version">
                  {generated.metadata.generatorVersion}
                </Badge>
              </div>
            )}
          </div>

          {generated?.metadata.warnings.length ? (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                {generated.metadata.warnings.length} generation warning(s)
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ContentTabs
        code={
          snippetsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
            </div>
          ) : snippetsError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Failed to generate snippets: {(snippetsError as Error).message}
            </div>
          ) : codeSnippets.length ? (
            <div className="grid gap-4">
              {codeSnippets.map((snippet) => (
                <CodeBlock
                  key={snippet.id}
                  title={snippet.title}
                  language={snippet.language ?? "text"}
                  code={snippet.body}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-fit-blue/20 bg-fit-silver p-4 text-sm text-muted-foreground">
              No code snippets were generated for this workflow.
            </div>
          )
        }
        diagram={
          snippetsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : snippetsError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Failed to generate diagram: {(snippetsError as Error).message}
            </div>
          ) : diagramSnippet ? (
            <MermaidBlock title={diagramSnippet.title} chart={diagramSnippet.body} />
          ) : (
            <div className="rounded-md border border-fit-blue/20 bg-fit-silver p-4 text-sm text-muted-foreground">
              No Mermaid diagram was generated for this workflow.
            </div>
          )
        }
        notes={
          snippetsLoading ? (
            <Skeleton className="h-44 w-full" />
          ) : snippetsError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Failed to generate notes: {(snippetsError as Error).message}
            </div>
          ) : generated ? (
            <div className="space-y-4">
              <Callout title="Generated summary" variant="success">
                <ul className="list-disc space-y-1 pl-5">
                  <li><strong>Workflow:</strong> {generated.workflow.name}</li>
                  <li><strong>Generated at:</strong> {formatDate(generated.metadata.generatedAt)}</li>
                  <li><strong>Snapshot:</strong> {generated.metadata.snapshotCapturedAt ? formatDate(generated.metadata.snapshotCapturedAt) : "N/A"}</li>
                </ul>
              </Callout>

              {generated.metadata.warnings.length > 0 && (
                <Callout title="Generation warnings" variant="warning" collapsible defaultOpen={false}>
                  <ul className="list-disc space-y-1 pl-5">
                    {generated.metadata.warnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>{warning}</li>
                    ))}
                  </ul>
                </Callout>
              )}

              <Callout title={notesSnippet?.title ?? "Generated notes"}>
                {notesSnippet ? (
                  <pre className="overflow-auto whitespace-pre-wrap rounded-md border border-fit-blue/20 bg-fit-navy/95 p-3 font-mono text-xs leading-relaxed text-fit-silver">
                    {notesSnippet.body}
                  </pre>
                ) : (
                  <p>No generated notes for this workflow.</p>
                )}
              </Callout>

              <Callout title="Milestone 8B status" variant="note">
                <p className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-fit-blue" />
                  Snippets are now generated server-side from inventory snapshots and fallback node/connection rows.
                </p>
              </Callout>
            </div>
          ) : (
            <div className="rounded-md border border-fit-blue/20 bg-fit-silver p-4 text-sm text-muted-foreground">
              Select a workflow to generate notes.
            </div>
          )
        }
      />
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}
