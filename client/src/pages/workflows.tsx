import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Archive, GitBranch, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { DataTableFrame } from "@/components/layout/data-table-frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { N8nWorkflow } from "@shared/schema";

type ActiveFilter = "all" | "true" | "false";

interface WorkflowFilters {
  q: string;
  tag: string;
  active: ActiveFilter;
  includeSoftDeleted: boolean;
}

function parseFilters(search: string): WorkflowFilters {
  const params = new URLSearchParams(search.replace(/^\?/, ""));

  return {
    q: params.get("q") ?? "",
    tag: params.get("tag") ?? "",
    active: params.get("active") === "true" || params.get("active") === "false"
      ? (params.get("active") as ActiveFilter)
      : "all",
    includeSoftDeleted: params.get("includeSoftDeleted") === "true",
  };
}

function buildQuery(filters: WorkflowFilters): string {
  const query = new URLSearchParams();
  if (filters.q.trim()) query.set("q", filters.q.trim());
  if (filters.tag) query.set("tag", filters.tag);
  if (filters.active !== "all") query.set("active", filters.active);
  if (filters.includeSoftDeleted) query.set("includeSoftDeleted", "true");
  return query.toString();
}

function buildWorkflowsApiPath(filters: WorkflowFilters): string {
  const value = buildQuery(filters);
  return value ? `/api/workflows?${value}` : "/api/workflows";
}

function buildWorkflowsUrl(filters: WorkflowFilters): string {
  const value = buildQuery(filters);
  return value ? `/workflows?${value}` : "/workflows";
}

export default function WorkflowsPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const filters = useMemo(() => parseFilters(search), [search]);
  const [searchDraft, setSearchDraft] = useState(filters.q);

  useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  const workflowQueryPath = buildWorkflowsApiPath(filters);

  const { data: workflows, isLoading, error } = useQuery<N8nWorkflow[]>({
    queryKey: [workflowQueryPath],
  });

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    (workflows ?? []).forEach((workflow) => {
      (workflow.tags ?? []).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [workflows]);

  const applyFilters = (next: Partial<WorkflowFilters>) => {
    const merged: WorkflowFilters = { ...filters, ...next };
    navigate(buildWorkflowsUrl(merged), { replace: false });
  };

  const resetFilters = () => {
    setSearchDraft("");
    navigate("/workflows", { replace: false });
  };

  const hasActiveFilters = filters.q || filters.tag || filters.active !== "all" || filters.includeSoftDeleted;

  return (
    <div className="fit-page space-y-6">
      <PageHeader
        title="Workflows"
        description={workflows ? `${workflows.length} workflows shown` : "Loading workflows"}
      />

      <div className="rounded-md border border-fit-blue/20 bg-white/85 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] uppercase text-fit-blue-deep">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search workflow name..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters({ q: searchDraft });
              }}
              className="pl-9"
              data-testid="input-search-workflows"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => applyFilters({ q: searchDraft })}>
              Apply
            </Button>
            <Button size="sm" variant="outline" onClick={resetFilters}>
              Clear
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Status</span>
          <FilterPill active={filters.active === "all"} label="All" onClick={() => applyFilters({ active: "all" })} />
          <FilterPill active={filters.active === "true"} label="Active" onClick={() => applyFilters({ active: "true" })} />
          <FilterPill active={filters.active === "false"} label="Inactive" onClick={() => applyFilters({ active: "false" })} />
          <FilterPill
            active={filters.includeSoftDeleted}
            label="Include Soft Deleted"
            onClick={() => applyFilters({ includeSoftDeleted: !filters.includeSoftDeleted })}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Tags</span>
          <FilterPill active={filters.tag === ""} label="All tags" onClick={() => applyFilters({ tag: "" })} />
          {availableTags.map((tag) => (
            <FilterPill key={tag} active={filters.tag === tag} label={tag} onClick={() => applyFilters({ tag })} />
          ))}
        </div>
      </div>

      <DataTableFrame title="Workflow Inventory" description="View-backed workflow catalog with latest snapshot context">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-40" />
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
                <TableHead className="w-[42%]">Workflow</TableHead>
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[14%] text-right">Nodes</TableHead>
                <TableHead className="w-[18%]">Updated</TableHead>
                <TableHead className="w-[24%]">Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((wf) => (
                <TableRow
                  key={wf.workflow_id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/workflows/${wf.workflow_id}`)}
                  data-testid={`row-workflow-${wf.workflow_id}`}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium" data-testid={`text-workflow-name-${wf.workflow_id}`}>
                        {wf.name}
                      </span>
                      {wf.is_archived && <Archive className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant={wf.active === true ? "default" : wf.active === false ? "secondary" : "outline"}
                      data-testid={`badge-status-${wf.workflow_id}`}
                    >
                      {wf.active === true ? "Active" : wf.active === false ? "Inactive" : "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right tabular-nums">{wf.node_count ?? "-"}</TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">{formatDate(wf.updated_at)}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(wf.tags ?? []).slice(0, 3).map((tag) => (
                        <Badge
                          key={`${wf.workflow_id}-${tag}`}
                          variant="outline"
                          className="text-[11px]"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            applyFilters({ tag });
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {(wf.tags?.length ?? 0) > 3 && (
                        <Badge variant="outline" className="text-[11px]">
                          +{(wf.tags?.length ?? 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <GitBranch className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">
              {hasActiveFilters ? "No workflows match your filters" : "No workflows found"}
            </p>
          </div>
        )}
      </DataTableFrame>
    </div>
  );
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-fit-blue bg-fit-blue text-white"
          : "border-fit-blue/25 bg-white text-fit-navy hover:bg-fit-silver",
      ].join(" ")}
    >
      {label}
    </button>
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
