import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/lib/theme-mode";

export function ThemeSelector() {
  const [mode, setMode] = useState<ThemeMode>(() => getThemeMode());

  const onToggle = () => {
    const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
    setThemeMode(nextMode);
    setMode(nextMode);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 rounded-md border-fit-blue/30 bg-white px-2.5 text-fit-navy dark:border-fit-blue/35 dark:bg-fit-navy dark:text-fit-silver"
      onClick={onToggle}
      data-testid="button-theme-toggle"
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mode === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      <span className="ml-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
        {mode === "dark" ? "Dark" : "Light"}
      </span>
    </Button>
  );
}
