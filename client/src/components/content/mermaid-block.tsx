import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

interface MermaidBlockProps {
  chart: string;
  title?: string;
}

export function MermaidBlock({ chart, title }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const id = useMemo(() => `mermaid-${Math.random().toString(36).slice(2, 10)}`, []);

  useEffect(() => {
    let mounted = true;

    const render = async () => {
      setLoading(true);
      setError("");
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
        });

        const { svg } = await mermaid.render(id, chart);
        if (mounted) setSvg(svg);
      } catch (err: any) {
        if (mounted) {
          setError(err?.message ?? "Failed to render Mermaid diagram");
          setSvg("");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void render();
    return () => {
      mounted = false;
    };
  }, [chart, id]);

  return (
    <section className="fit-card fit-card-surface p-0">
      <div className="border-b border-fit-blue/20 px-4 py-3 dark:border-white/10">
        {title && <h4 className="text-sm font-semibold">{title}</h4>}
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Mermaid</p>
      </div>

      <div className="overflow-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Rendering diagram...</p>
        ) : error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Mermaid render failed</span>
            </div>
            <pre className="overflow-auto whitespace-pre-wrap text-xs">{error}</pre>
          </div>
        ) : (
          <div
            className="min-w-[640px]"
            data-testid="mermaid-diagram"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </section>
  );
}
