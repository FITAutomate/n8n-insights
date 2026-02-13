import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, GitBranch, Archive, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { N8nWorkflow } from "@shared/schema";

export default function WorkflowsPage() {
  const [location] = useLocation();
  const queryString = location.includes("?")
    ? location.split("?")[1]
    : window.location.search.replace(/^\?/, "");
  const params = new URLSearchParams(queryString);
  const initialSearch = params.get("q") ?? "";
  const tagFilter = params.get("tag") ?? "";
  const activeFilter = params.get("active");
  const includeSoftDeleted = params.get("includeSoftDeleted") === "true";
  const [search, setSearch] = useState(initialSearch);
  const searchValue = search;
  const workflowQueryPath = (() => {
    const query = new URLSearchParams();
    if (tagFilter) query.set("tag", tagFilter);
    if (activeFilter) query.set("active", activeFilter);
    if (includeSoftDeleted) query.set("includeSoftDeleted", "true");
    if (searchValue.trim()) query.set("q", searchValue.trim());
    const value = query.toString();
    return value ? `/api/workflows?${value}` : "/api/workflows";
  })();

  const { data: workflows, isLoading, error } = useQuery<N8nWorkflow[]>({
    queryKey: [workflowQueryPath],
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-workflows-title">Workflows</h1>
          <p className="text-muted-foreground mt-1">
            {workflows ? `${workflows.length} workflows registered` : "Loading..."}
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by name..."
            value={searchValue}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-workflows"
          />
        </div>
      </div>
      {(tagFilter || activeFilter) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filters:</span>
          {tagFilter && <Badge variant="outline">tag={tagFilter}</Badge>}
          {activeFilter && <Badge variant="outline">active={activeFilter}</Badge>}
          <Link href="/workflows" className="underline">clear</Link>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-destructive">
              Failed to load workflows: {(error as Error).message}
            </div>
          ) : workflows && workflows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Nodes</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((wf) => (
                  <TableRow
                    key={wf.workflow_id}
                    className="cursor-pointer"
                    data-testid={`row-workflow-${wf.workflow_id}`}
                  >
                    <TableCell colSpan={6} className="p-0">
                      <Link
                        href={`/workflows/${wf.workflow_id}`}
                        className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center w-full"
                        data-testid={`link-workflow-${wf.workflow_id}`}
                      >
                        <span className="font-mono text-xs text-muted-foreground p-4">
                          {wf.workflow_id}
                        </span>
                        <span className="p-4">
                          <span className="flex items-center gap-2">
                            <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium" data-testid={`text-workflow-name-${wf.workflow_id}`}>{wf.name}</span>
                            {wf.is_archived && (
                              <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </span>
                        </span>
                        <span className="p-4">
                          <Badge
                            variant={wf.active ? "default" : "secondary"}
                            data-testid={`badge-status-${wf.workflow_id}`}
                          >
                            {wf.active ? "Active" : "Inactive"}
                          </Badge>
                        </span>
                        <span className="p-4 text-right tabular-nums">
                          {wf.node_count ?? "—"}
                        </span>
                        <span className="p-4 text-muted-foreground text-sm">
                          {formatDate(wf.updated_at)}
                        </span>
                        <span className="p-4 text-muted-foreground text-sm">
                          {formatDate(wf.last_seen_at)}
                        </span>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GitBranch className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">
                {searchValue ? "No workflows match your search" : "No workflows found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
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
