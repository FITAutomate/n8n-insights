import type { LucideIcon } from "lucide-react";
import { Activity, GitBranch, LineChart, RefreshCw } from "lucide-react";

export interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    title: "Core",
    items: [
      {
        title: "Workflows",
        url: "/workflows",
        icon: GitBranch,
        description: "Inventory and tags",
      },
      {
        title: "Sync Runs",
        url: "/sync-runs",
        icon: RefreshCw,
        description: "Execution history",
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        title: "Reliability",
        url: "/reliability",
        icon: LineChart,
        description: "Daily rollups",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Health Check",
        url: "/health",
        icon: Activity,
        description: "Tables and views",
      },
    ],
  },
];
