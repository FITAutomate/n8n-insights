import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { AlertCircle, RefreshCw, SlidersHorizontal } from "lucide-react";
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
import type { N8nInventorySyncRun } from "@shared/schema";

type RunStatusFilter = "all" | "success" | "error" | "running";

interface SyncRunFilters {
  day: string;
  triggerSource: string;
  status: RunStatusFilter;
}

function normalizeDay(value: string | null): string {
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function parseFilters(search: string): SyncRunFilters {
  const params = new URLSearchParams(search.replace(/^\?/, ""));
  const status = params.get("status");
  return {
    day: normalizeDay(params.get("day")),
    triggerSource: params.get("triggerSource") ?? "",
    status:
      status === "success" || status === "error" || status === "running"
        ? status
        : "all",
  };
}

function buildQuery(filters: SyncRunFilters): string {
  const query = new URLSearchParams();
  if (filters.day) query.set("day", filters.day);
  if (filters.triggerSource) query.set("triggerSource", filters.triggerSource);
  if (filters.status !== "all") query.set("status", filters.status);
  return query.toString();
}

function buildApiPath(filters: SyncRunFilters): string {
  const value = buildQuery(filters);
  return value ? `/api/sync-runs?${value}` : "/api/sync-runs";
}

function buildPagePath(filters: SyncRunFilters): string {
  const value = buildQuery(filters);
  return value ? `/sync-runs?${value}` : "/sync-runs";
}

export default function SyncRunsPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const filters = useMemo(() => parseFilters(search), [search]);
  const queryPath = buildApiPath(filters);

  const { data: rawRuns, isLoading, error } = useQuery<N8nInventorySyncRun[]>({
    queryKey: [queryPath],
  });

  const runs = useMemo(() => {
    const input = rawRuns ?? [];
    return input.filter((run) => {
      if (filters.day) {
        const runDay = normalizeDay(run.started_at ?? "");
        if (runDay !== filters.day) return false;
      }

      if (filters.triggerSource) {
        if ((run.trigger_source ?? "") !== filters.triggerSource) return false;
      }

      if (filters.status !== "all") {
        const status = (run.status ?? "").toLowerCase();
        if (filters.status === "success" && !["success", "completed"].includes(status)) return false;
        if (filters.status === "error" && !["error", "failed"].includes(status)) return false;
        if (filters.status === "running" && !["running", "in_progress"].includes(status)) return false;
      }

      return true;
    });
  }, [filters.day, filters.status, filters.triggerSource, rawRuns]);

  const triggerSources = useMemo(() => {
    const values = new Set<string>();
    (rawRuns ?? []).forEach((run) => {
      if (run.trigger_source) values.add(run.trigger_source);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rawRuns]);

  const applyFilters = (next: Partial<SyncRunFilters>) => {
    const merged: SyncRunFilters = { ...filters, ...next };
    navigate(buildPagePath(merged), { replace: false });
  };

  const hasActiveFilters = filters.day || filters.triggerSource || filters.status !== "all";

  return (
    <div className="fit-page space-y-6">
      <PageHeader
        title="Sync Runs"
        description={runs ? `${runs.length} inventory sync runs shown` : "Loading sync runs"}
      />

      <div className="rounded-md border border-fit-blue/20 bg-white/85 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] uppercase text-fit-blue-deep">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <Input
            type="date"
            value={filters.day}
            onChange={(event) => applyFilters({ day: event.target.value })}
            data-testid="input-sync-day"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Trigger</span>
            <FilterPill
              active={filters.triggerSource === ""}
              label="All"
              onClick={() => applyFilters({ triggerSource: "" })}
            />
            {triggerSources.map((value) => (
              <FilterPill
                key={value}
                active={filters.triggerSource === value}
                label={value}
                onClick={() => applyFilters({ triggerSource: value })}
              />
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate("/sync-runs", { replace: false })}>
            Clear
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Status</span>
          <FilterPill active={filters.status === "all"} label="All" onClick={() => applyFilters({ status: "all" })} />
          <FilterPill active={filters.status === "success"} label="Success" onClick={() => applyFilters({ status: "success" })} />
          <FilterPill active={filters.status === "error"} label="Error" onClick={() => applyFilters({ status: "error" })} />
          <FilterPill active={filters.status === "running"} label="Running" onClick={() => applyFilters({ status: "running" })} />
        </div>
      </div>

      <DataTableFrame
        title="Sync Run History"
        description="View-backed run history with URL-driven drilldown filters"
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-destructive">
            Failed to load sync runs: {(error as Error).message}
          </div>
        ) : runs && runs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Seen</TableHead>
                <TableHead className="text-right">Changed</TableHead>
                <TableHead className="text-right">Unchanged</TableHead>
                <TableHead className="text-right">Snapshots</TableHead>
                <TableHead className="text-right">Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id} data-testid={`row-sync-run-${run.id}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{formatDate(run.started_at)}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{run.id?.slice(0, 8)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-sm text-fit-blue-deep hover:underline"
                      onClick={() => applyFilters({ triggerSource: run.trigger_source ?? "" })}
                    >
                      {run.trigger_source || "unknown"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatDurationSeconds(run.duration_seconds)}</TableCell>
                  <TableCell className="text-right tabular-nums">{run.workflows_seen ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{run.workflows_changed ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{run.workflows_unchanged ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{run.snapshots_inserted ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{run.errors_count ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">
              {hasActiveFilters ? "No sync runs match your filters" : "No sync runs found"}
            </p>
          </div>
        )}
      </DataTableFrame>

      {runs && runs.some((run) => !!run.errors_json) && (
        <DataTableFrame title="Run Errors" description="Raw error payloads for debugging">
          <div className="divide-y divide-fit-blue/10">
            {runs
              .filter((run) => !!run.errors_json)
              .slice(0, 10)
              .map((run) => (
                <div key={`error-${run.id}`} className="p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    <span>{formatDate(run.started_at)}</span>
                    <span className="font-mono">{run.id}</span>
                  </div>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border border-fit-blue/15 bg-fit-silver p-3 text-xs font-mono">
                    {JSON.stringify(run.errors_json, null, 2)}
                  </pre>
                </div>
              ))}
          </div>
        </DataTableFrame>
      )}
    </div>
  );
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

function formatDurationSeconds(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${seconds}s`;
}
