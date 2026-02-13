import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  return (
    <section className="fit-card fit-card-surface p-0">
      <div className="flex items-center justify-between border-b border-fit-blue/20 px-4 py-3 dark:border-white/10">
        <div className="min-w-0">
          {title && <h4 className="truncate text-sm font-semibold">{title}</h4>}
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{language}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          data-testid={`button-copy-code-${language}`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>

      <pre className="max-h-[30rem] overflow-auto whitespace-pre rounded-b-[inherit] bg-fit-navy p-4 text-xs text-fit-silver">
        <code>{code}</code>
      </pre>
    </section>
  );
}
