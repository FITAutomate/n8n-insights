import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getRuntimeEnv, normalizeRuntimeEnv, setRuntimeEnv, type RuntimeEnv } from "@/lib/runtime-env";

export function EnvironmentSelector() {
  const queryClient = useQueryClient();
  const [environment, setEnvironment] = useState<RuntimeEnv>(() => getRuntimeEnv());

  const options = useMemo(
    () => [
      { label: "Dev", value: "dev" as const },
      { label: "Prod", value: "prod" as const },
    ],
    [],
  );

  const onSelect = (value: RuntimeEnv) => {
    const normalized = normalizeRuntimeEnv(value);
    setRuntimeEnv(normalized);
    setEnvironment(normalized);
    queryClient.invalidateQueries();
  };

  return (
    <div className="flex items-center rounded-md border border-fit-blue/25 bg-white p-1 shadow-sm dark:border-fit-blue/35 dark:bg-fit-navy">
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={environment === option.value ? "default" : "ghost"}
          className="h-8 rounded-md px-3 text-xs font-semibold tracking-[0.08em] uppercase"
          onClick={() => onSelect(option.value)}
          data-testid={`button-env-${option.value}`}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
