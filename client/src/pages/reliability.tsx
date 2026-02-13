import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-reliability-title">Reliability</h1>
        <p className="text-muted-foreground mt-1">Daily sync reliability by trigger source</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">inventory_sync_runs_daily</CardTitle>
          <CardDescription>View-backed daily reliability rollup</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={`${row.day}-${row.trigger_source}-${idx}`} data-testid={`row-reliability-${idx}`}>
                    <TableCell>{formatDay(row.day)}</TableCell>
                    <TableCell>{row.trigger_source || "unknown"}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.runs_total ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.runs_success ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.runs_error ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.workflows_seen ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.workflows_changed ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.snapshots_inserted ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">No daily reliability data found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
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
