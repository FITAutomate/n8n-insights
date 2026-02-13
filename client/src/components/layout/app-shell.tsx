import type { ReactNode } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { EnvironmentSelector } from "./environment-selector";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarInset className="fit-app-bg">
      <header className="fit-app-header">
        <div className="fit-app-header-inner">
          <div className="flex items-center gap-3">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div>
              <p className="font-heading text-sm tracking-[0.12em] text-fit-blue-deep uppercase">
                Forward IT Thinking
              </p>
              <h1 className="font-heading text-lg leading-tight text-fit-navy">
                n8n Insights
              </h1>
            </div>
          </div>
          <EnvironmentSelector />
        </div>
      </header>
      <main className="fit-app-main">{children}</main>
    </SidebarInset>
  );
}
