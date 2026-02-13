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
            <div className="flex items-center gap-2.5">
              <img
                src="/n8n-black.svg"
                alt="n8n Insights"
                className="h-10 w-auto sm:h-12 dark:hidden"
              />
              <img
                src="/n8n-white.svg"
                alt="n8n Insights"
                className="hidden h-10 w-auto sm:h-12 dark:block"
              />
              <span className="font-heading text-[1.65rem] font-semibold leading-none tracking-tight text-fit-navy dark:text-fit-silver sm:text-[2rem]">
                <span className="fit-emoji-flip inline-block">{"\uD83D\uDD26"}</span> Insights by FIT Automate {"\uD83D\uDD26"}
              </span>
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
