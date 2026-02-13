import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTableFrame } from "@/components/layout/data-table-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { N8nInventorySyncRunDaily } from "@shared/schema";

export default function ReliabilityPage() {
  const { data, isLoading, error } = useQuery<N8nInventorySyncRunDaily[]>({
    queryKey: ["/api/sync-runs?daily=true"],
  });

  const totals = useMemo(() => {
    const runs = (data ?? []).reduce((sum, row) => sum + (row.runs_total ?? 0), 0);
    const success = (data ?? []).reduce((sum, row) => sum + (row.runs_success ?? 0), 0);
    const errors = (data ?? []).reduce((sum, row) => sum + (row.runs_error ?? 0), 0);
    return { runs, success, errors };
  }, [data]);

  return (
    <div className="fit-page space-y-6">
      <PageHeader
        title="Reliability"
        description="Daily sync reliability by trigger source with run-level drilldowns"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Runs" value={totals.runs} />
        <SummaryCard label="Success" value={totals.success} />
        <SummaryCard label="Errors" value={totals.errors} />
      </div>

      <DataTableFrame
        title="Daily Reliability"
        description="Click counts to drill into filtered run history"
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-destructive">
            Failed to load reliability data: {(error as Error).message}
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead className="text-right">Runs</TableHead>
                <TableHead className="text-right">Success</TableHead>
                <TableHead className="text-right">Error</TableHead>
                <TableHead className="text-right">Seen</TableHead>
                <TableHead className="text-right">Changed</TableHead>
                <TableHead className="text-right">Snapshots</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={`${row.day}-${row.trigger_source}-${idx}`} data-testid={`row-reliability-${idx}`}>
                  <TableCell>{formatDay(row.day)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.trigger_source || "unknown"}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <DrilldownLink day={row.day} triggerSource={row.trigger_source} value={row.runs_total ?? 0} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <DrilldownLink
                      day={row.day}
                      triggerSource={row.trigger_source}
                      status="success"
                      value={row.runs_success ?? 0}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <DrilldownLink
                      day={row.day}
                      triggerSource={row.trigger_source}
                      status="error"
                      value={row.runs_error ?? 0}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.workflows_seen ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.workflows_changed ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.snapshots_inserted ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={buildSyncRunsHref({ day: row.day, triggerSource: row.trigger_source ?? "" })}
                      className="inline-flex items-center gap-1 text-sm text-fit-blue-deep hover:underline"
                    >
                      View runs
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No daily reliability data found</p>
          </div>
        )}
      </DataTableFrame>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-fit-blue/20 bg-white/85 p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-fit-navy">{value}</p>
    </div>
  );
}

function DrilldownLink({
  day,
  triggerSource,
  value,
  status,
}: {
  day: string;
  triggerSource: string;
  value: number;
  status?: "success" | "error";
}) {
  if (value <= 0) return <span>{value}</span>;

  return (
    <Link
      href={buildSyncRunsHref({ day, triggerSource, status })}
      className="text-fit-blue-deep hover:underline"
    >
      {value}
    </Link>
  );
}

function buildSyncRunsHref({
  day,
  triggerSource,
  status,
}: {
  day: string;
  triggerSource: string;
  status?: "success" | "error";
}) {
  const params = new URLSearchParams();
  if (day) params.set("day", day.slice(0, 10));
  if (triggerSource) params.set("triggerSource", triggerSource);
  if (status) params.set("status", status);
  return `/sync-runs?${params.toString()}`;
}

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
