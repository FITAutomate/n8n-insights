import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const normalizedLanguage = language.trim().toLowerCase();

  const highlightedCode = useMemo(() => {
    const key = normalizedLanguage === "ts" ? "typescript" : normalizedLanguage;
    const grammar = Prism.languages[key] ?? Prism.languages.javascript ?? Prism.languages.clike;
    return Prism.highlight(code, grammar, key);
  }, [code, normalizedLanguage]);

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

      <pre className="fit-code-theme max-h-[30rem] overflow-auto whitespace-pre rounded-b-[inherit] bg-fit-navy p-4 text-xs text-fit-silver">
        <code
          className={`language-${normalizedLanguage}`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </section>
  );
}
