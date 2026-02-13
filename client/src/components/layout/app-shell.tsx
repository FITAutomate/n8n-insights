import type { ReactNode } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { EnvironmentSelector } from "./environment-selector";
import { ThemeSelector } from "./theme-selector";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarInset className="fit-app-bg">
      <header className="fit-app-header">
        <div className="fit-app-header-inner">
          <div className="flex items-center gap-3">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div>
              <p className="font-heading text-sm tracking-[0.12em] text-fit-blue-deep uppercase dark:text-fit-blue">
                Forward IT Thinking
              </p>
              <h1 className="font-heading text-lg leading-tight text-fit-navy dark:text-fit-silver">
                <span className="mr-1.5" aria-hidden="true">🔦</span>
                <span>n8n Insights</span>
                <span className="ml-1.5 inline-block fit-emoji-flip" aria-hidden="true">🔦</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <EnvironmentSelector />
          </div>
        </div>
      </header>
      <main className="fit-app-main">{children}</main>
    </SidebarInset>
  );
}
