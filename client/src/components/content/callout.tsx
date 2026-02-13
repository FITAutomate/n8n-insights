import { useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, CircleCheckBig, PencilLine, TriangleAlert } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type CalloutVariant = "note" | "success" | "warning" | "danger";

interface CalloutProps {
  title: string;
  children: ReactNode;
  variant?: CalloutVariant;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const variantStyles: Record<CalloutVariant, string> = {
  note: "border-fit-blue/35 bg-fit-blue/10",
  success: "border-fit-green/45 bg-fit-green/10",
  warning: "border-amber-500/50 bg-amber-500/10",
  danger: "border-red-500/50 bg-red-500/10",
};

function VariantIcon({ variant }: { variant: CalloutVariant }) {
  if (variant === "success") return <CircleCheckBig className="h-4 w-4 text-fit-green" />;
  if (variant === "warning") return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  if (variant === "danger") return <TriangleAlert className="h-4 w-4 text-red-400" />;
  return <PencilLine className="h-4 w-4 text-fit-blue dark:text-fit-green" />;
}

export function Callout({
  title,
  children,
  variant = "note",
  collapsible = false,
  defaultOpen = true,
}: CalloutProps) {
  const [open, setOpen] = useState(defaultOpen);
  const cardTone = variantStyles[variant];

  if (!collapsible) {
    return (
      <section className={`overflow-hidden rounded-xl border ${cardTone}`}>
        <header className="flex items-center gap-2 border-b border-fit-blue/25 px-4 py-3">
          <VariantIcon variant={variant} />
          <h4 className="text-base font-semibold">{title}</h4>
        </header>
        <div className="px-4 py-4 text-sm leading-7 text-foreground/95">{children}</div>
      </section>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className={`overflow-hidden rounded-xl border ${cardTone}`}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-fit-blue/10"
            data-testid={`button-callout-${title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="flex items-center gap-2">
              <VariantIcon variant={variant} />
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
