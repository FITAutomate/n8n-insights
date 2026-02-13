import { PageHeader } from "@/components/layout/page-header";
import { ContentTabs } from "@/components/content/content-tabs";
import { CodeBlock } from "@/components/content/code-block";
import { MermaidBlock } from "@/components/content/mermaid-block";
import { Callout } from "@/components/content/callout";

const SAMPLE_PYTHON = `def sync_customers(api_client, workspace_id):
    """Pull the latest customers and push them into the automation workspace."""
    customers = api_client.fetch_customers()
    api_client.bulk_import(workspace_id, customers)`;

const SAMPLE_TYPESCRIPT = `async function pingHealth(url: string) {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(\`Health check failed: \${response.status}\`);
  }
  return response.json();
}`;

const SAMPLE_MERMAID = `flowchart TD
  A[Website Visitor / User] -->|Ask a question| B[AI Agent]
  B -->|Retrieval request| C[Pinecone Assistant Endpoint]
  C -->|Retrieves context| D[Pinecone Index]
  B -->|Answer + Citations| A`;

export default function SnippetsPage() {
  return (
    <div className="fit-page space-y-6">
      <PageHeader
        title="Content Snippets"
        description="Milestone 7.7 starter for code + Mermaid + notes blocks"
      />

      <ContentTabs
        code={
          <div className="grid gap-4">
            <CodeBlock title="Automation snippet (Python)" language="python" code={SAMPLE_PYTHON} />
            <CodeBlock title="Health helper (TypeScript)" language="typescript" code={SAMPLE_TYPESCRIPT} />
          </div>
        }
        diagram={<MermaidBlock title="Pinecone assistant flow (sample)" chart={SAMPLE_MERMAID} />}
        notes={
          <div className="space-y-4">
            <Callout title='!!! note "Road to 7.7 v2"'>
              <p>
                This static callout is the dashboard equivalent of a MkDocs-style{" "}
                <code>!!! note</code> block for persistent guidance and rollup context.
              </p>
            </Callout>

            <Callout title='!!! tip "Good candidate for demo content"' variant="success">
              <p>
                Use anonymized workflow names and stable fake counts so screenshots and demos stay consistent.
              </p>
            </Callout>

            <Callout title='??? note "Generation backlog (expand)"' collapsible defaultOpen={false}>
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
                <li>Generate Mermaid automatically from workflow nodes + connections.</li>
                <li>Generate starter Python/TypeScript snippets from common node patterns.</li>
                <li>Version snippets by workflow hash for change history.</li>
              </ul>
            </Callout>

            <Callout title='??? warning "Preview caveat"' variant="warning" collapsible defaultOpen={false}>
              <p>
                Mermaid rendering can fail on malformed graph text. Keep the fallback visible and log parse errors.
              </p>
            </Callout>
          </div>
        }
      />
    </div>
  );
}
