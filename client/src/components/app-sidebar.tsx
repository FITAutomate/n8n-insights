import { useLocation, Link } from "wouter";
import logoPath from "@assets/logo_1770940301958.png";
import { NAVIGATION_SECTIONS } from "@/config/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/health" data-testid="link-sidebar-home">
          <div className="fit-sidebar-brand cursor-pointer">
            <img src={logoPath} alt="Forward IT Thinking" className="h-8 w-auto self-start" />
            <div className="flex flex-col">
              <span className="font-heading text-sm font-semibold text-sidebar-foreground">n8n Insights</span>
              <span className="text-[11px] tracking-[0.10em] uppercase text-sidebar-foreground/70">
                FIT Automate
              </span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {NAVIGATION_SECTIONS.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-[11px] tracking-[0.10em] uppercase">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = location === item.url || location.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="h-auto py-2.5">
                        <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                          <item.icon />
                          <div className="flex flex-col">
                            <span>{item.title}</span>
                            <span className="text-[11px] text-sidebar-foreground/65">{item.description}</span>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="px-3 py-2">
        <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-2">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-sidebar-foreground/80">
            Navigation v2
          </p>
          <p className="mt-1 text-[11px] text-sidebar-foreground/65">
            Grouped by domain for scalable page growth.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

