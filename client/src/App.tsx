import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppShell } from "@/components/layout/app-shell";
import NotFound from "@/pages/not-found";
import HealthPage from "@/pages/health";
import WorkflowsPage from "@/pages/workflows";
import WorkflowDetailPage from "@/pages/workflow-detail";
import SyncRunsPage from "@/pages/sync-runs";
import ReliabilityPage from "@/pages/reliability";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/health" />
      </Route>
      <Route path="/health" component={HealthPage} />
      <Route path="/workflows" component={WorkflowsPage} />
      <Route path="/workflows/:workflowId">
        {(params) => <WorkflowDetailPage workflowId={params.workflowId} />}
      </Route>
      <Route path="/sync-runs" component={SyncRunsPage} />
      <Route path="/reliability" component={ReliabilityPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <AppShell>
              <Router />
            </AppShell>
          </div> 
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
