import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertTriangle, Database, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { HealthCheckResponse } from "@shared/schema";

export default function HealthPage() {
  const { data, isLoading, error } = useQuery<HealthCheckResponse>({
    queryKey: ["/api/health"],
    refetchInterval: 30000,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-health-title">System Health</h1>
        <p className="text-muted-foreground mt-1">Database connectivity and table status</p>
      </div>

      {data && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Environment Variables</CardTitle>
            <CardDescription>Supabase configuration status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <EnvBadge label="SUPABASE_URL" ok={data.envStatus.supabaseUrl} />
              <EnvBadge label="SUPABASE_ANON_KEY" ok={data.envStatus.supabaseAnonKey} />
              <EnvBadge label="SUPABASE_SERVICE_ROLE_KEY" ok={data.envStatus.supabaseServiceRoleKey} />
            </div>
            {(!data.envStatus.supabaseUrl || !data.envStatus.supabaseAnonKey) && (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Setup Required</p>
                  <p className="mt-1 text-muted-foreground">
                    Set the missing environment variables in Replit Secrets, then restart the application.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base">Table Status</CardTitle>
              <CardDescription>Row counts and connectivity for each table</CardDescription>
            </div>
            {data && (
              <StatusSummary tables={data.tables} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <XCircle className="w-4 h-4" />
              <span>Failed to fetch health data: {(error as Error).message}</span>
            </div>
          ) : data ? (
            <div className="space-y-2">
              {data.tables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center justify-between gap-4 rounded-md border px-4 py-3"
                  data-testid={`row-table-${table.name}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {table.status === "ok" ? (
                      <CheckCircle className="w-4 h-4 text-status-online shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    <div className="flex items-center gap-2 min-w-0">
                      <Database className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-sm truncate" data-testid={`text-table-name-${table.name}`}>{table.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {table.status === "ok" ? (
                      <Badge variant="secondary" data-testid={`badge-count-${table.name}`}>
                        {table.count?.toLocaleString()} rows
                      </Badge>
                    ) : (
                      <Badge variant="destructive" data-testid={`badge-error-${table.name}`}>
                        {table.error || "Error"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function EnvBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ? (
        <CheckCircle className="w-3.5 h-3.5 text-status-online" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-destructive" />
      )}
      <span className="text-sm font-mono">{label}</span>
    </div>
  );
}

function StatusSummary({ tables }: { tables: HealthCheckResponse["tables"] }) {
  const ok = tables.filter((t) => t.status === "ok").length;
  const total = tables.length;
  const allOk = ok === total;

  return (
    <Badge variant={allOk ? "secondary" : "destructive"} data-testid="badge-health-summary">
      {allOk ? (
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {ok}/{total} healthy
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {ok}/{total} healthy
        </span>
      )}
    </Badge>
  );
}
