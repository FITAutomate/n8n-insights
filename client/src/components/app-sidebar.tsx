import { useLocation, Link } from "wouter";
import { Activity, GitBranch, RefreshCw, LineChart } from "lucide-react";
import logoPath from "@assets/logo_1770940301958.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Health Check", url: "/health", icon: Activity },
  { title: "Workflows", url: "/workflows", icon: GitBranch },
  { title: "Sync Runs", url: "/sync-runs", icon: RefreshCw },
  { title: "Reliability", url: "/reliability", icon: LineChart },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/health" data-testid="link-sidebar-home">
          <div className="flex flex-col gap-2 cursor-pointer">
            <img src={logoPath} alt="Forward IT Thinking" className="h-8 w-auto self-start" />
            <div className="flex flex-col items-center w-full">
              <span className="text-sm font-semibold text-sidebar-foreground">🚦 n8n Insights</span>
              <span className="text-xs text-sidebar-foreground/60">Workflow Registry</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || location.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
