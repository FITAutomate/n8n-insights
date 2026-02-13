import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, PencilLine } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CalloutProps {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function Callout({ title, children, collapsible = false, defaultOpen = true }: CalloutProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <section className="overflow-hidden rounded-xl border border-fit-blue/35 bg-fit-blue/10">
        <header className="flex items-center gap-2 border-b border-fit-blue/25 px-4 py-3">
          <PencilLine className="h-4 w-4 text-fit-blue dark:text-fit-green" />
          <h4 className="text-base font-semibold">{title}</h4>
        </header>
        <div className="px-4 py-4 text-sm leading-7 text-foreground/95">{children}</div>
      </section>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="overflow-hidden rounded-xl border border-fit-blue/35 bg-fit-blue/10">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-fit-blue/10"
            data-testid={`button-callout-${title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="flex items-center gap-2">
              <PencilLine className="h-4 w-4 text-fit-blue dark:text-fit-green" />
              <h4 className="text-base font-semibold">{title}</h4>
            </div>
            {open ? (
              <ChevronDown className="h-4 w-4 text-fit-blue" />
            ) : (
              <ChevronRight className="h-4 w-4 text-fit-blue" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-fit-blue/25 px-4 py-4 text-sm leading-7 text-foreground/95">
            {children}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
