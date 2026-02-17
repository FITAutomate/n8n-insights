type JsonRecord = Record<string, unknown>;

type SnippetType = "code" | "diagram" | "notes";

interface GeneratedNode {
  id: string;
  name: string;
  type: string;
  disabled: boolean;
}

interface GeneratedEdge {
  source: string;
  target: string;
  type: string;
  sourceOutputIndex: number;
  targetInputIndex: number;
}

interface GeneratedSnippet {
  id: string;
  title: string;
  type: SnippetType;
  language?: string;
  source: string;
  body: string;
  tags: string[];
  updatedAt: string;
}

interface BuildGeneratedSnippetsInput {
  workflow: JsonRecord;
  snapshot: JsonRecord | null;
  fallbackNodes: JsonRecord[];
  fallbackConnections: JsonRecord[];
  initialWarnings?: string[];
}

interface GeneratedWorkflowSnippets {
  workflow: {
    workflow_id: string;
    name: string;
    tags: string[];
    node_count: number;
    latest_definition_hash?: string | null;
    latest_snapshot_id?: string | null;
    latest_snapshot_captured_at?: string | null;
  };
  metadata: {
    generatorVersion: string;
    generatedAt: string;
    snapshotId?: string | null;
    snapshotCapturedAt?: string | null;
    nodeCount: number;
    connectionCount: number;
    warnings: string[];
  };
  snippets: GeneratedSnippet[];
}

const GENERATOR_VERSION = "inventory-generator-v1";
const MAX_CODE_STEPS = 14;
const MAX_DIAGRAM_EDGES = 220;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function slugify(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized || "workflow";
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

function escapeMermaidLabel(value: string): string {
  return value
    .replace(/"/g, "'")
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .replace(/\r?\n/g, "\\n");
}

function shortNodeType(value: string): string {
  const pieces = value.split(".");
  return pieces[pieces.length - 1] || value;
}

function inferNodeFamily(value: string): "trigger" | "io" | "data" | "logic" | "ai" | "step" {
  const lowered = value.toLowerCase();
  if (lowered.includes("trigger")) return "trigger";
  if (lowered.includes("http") || lowered.includes("webhook") || lowered.includes("slack") || lowered.includes("email")) {
    return "io";
  }
  if (
    lowered.includes("postgres") ||
    lowered.includes("mysql") ||
    lowered.includes("mongo") ||
    lowered.includes("database") ||
    lowered.includes("supabase") ||
    lowered.includes("airtable")
  ) {
    return "data";
  }
  if (
    lowered.includes("if") ||
    lowered.includes("switch") ||
    lowered.includes("merge") ||
    lowered.includes("function") ||
    lowered.includes("code")
  ) {
    return "logic";
  }
  if (lowered.includes("openai") || lowered.includes("langchain") || lowered.includes("ai")) return "ai";
  return "step";
}

function uniqueBy<T>(items: T[], key: (value: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const itemKey = key(item);
    if (seen.has(itemKey)) continue;
    seen.add(itemKey);
    result.push(item);
  }

  return result;
}

function parseNodesFromWorkflowJson(workflowJson: JsonRecord | null): GeneratedNode[] {
  if (!workflowJson) return [];
  const rawNodes = workflowJson.nodes;
  if (!Array.isArray(rawNodes)) return [];

  const mapped: GeneratedNode[] = [];
  for (let index = 0; index < rawNodes.length; index += 1) {
    const nodeRecord = asRecord(rawNodes[index]);
    if (!nodeRecord) continue;
    const name = asString(nodeRecord.name) ?? `Step ${index + 1}`;
    const type = asString(nodeRecord.type) ?? "unknown";
    const id = asString(nodeRecord.id) ?? `${slugify(name)}_${index + 1}`;
    const disabled = nodeRecord.disabled === true;
    mapped.push({ id, name, type, disabled });
  }

  return uniqueBy(mapped, (node) => `${node.name}::${node.type}`);
}

function parseEdgesFromWorkflowJson(workflowJson: JsonRecord | null): GeneratedEdge[] {
  if (!workflowJson) return [];
  const rawConnections = asRecord(workflowJson.connections);
  if (!rawConnections) return [];

  const edges: GeneratedEdge[] = [];

  for (const [sourceNode, connectionKinds] of Object.entries(rawConnections)) {
    const connectionKindsRecord = asRecord(connectionKinds);
    if (!connectionKindsRecord) continue;

    for (const [kind, outputs] of Object.entries(connectionKindsRecord)) {
      if (!Array.isArray(outputs)) continue;

      outputs.forEach((targets, sourceOutputIndex) => {
        if (!Array.isArray(targets)) return;

        targets.forEach((target) => {
          const targetRecord = asRecord(target);
          if (!targetRecord) return;

          const targetNode = asString(targetRecord.node);
          if (!targetNode) return;

          edges.push({
            source: sourceNode,
            target: targetNode,
            type: asString(targetRecord.type) ?? kind,
            sourceOutputIndex,
            targetInputIndex: asNumber(targetRecord.index) ?? 0,
          });
        });
      });
    }
  }

  return uniqueBy(
    edges,
    (edge) => `${edge.source}->${edge.target}:${edge.type}:${edge.sourceOutputIndex}:${edge.targetInputIndex}`,
  );
}

function parseFallbackNodes(rows: JsonRecord[]): GeneratedNode[] {
  const mapped: GeneratedNode[] = rows.map((row, index) => {
    const name = asString(row.node_name) ?? asString(row.name) ?? `Step ${index + 1}`;
    const type = asString(row.node_type) ?? asString(row.type) ?? "unknown";
    const id = asString(row.node_id) ?? `${slugify(name)}_${index + 1}`;
    const disabled = row.disabled === true;
    return { id, name, type, disabled };
  });

  return uniqueBy(mapped, (node) => `${node.name}::${node.type}`);
}

function parseFallbackEdges(rows: JsonRecord[]): GeneratedEdge[] {
  const edges: GeneratedEdge[] = [];

  for (const row of rows) {
    const source = asString(row.source_node_name) ?? asString(row.source_node);
    const target = asString(row.target_node_name) ?? asString(row.target_node);
    if (!source || !target) continue;

    edges.push({
      source,
      target,
      type: asString(row.connection_type) ?? asString(row.type) ?? "main",
      sourceOutputIndex: asNumber(row.source_output_index) ?? asNumber(row.source_output) ?? 0,
      targetInputIndex: asNumber(row.target_input_index) ?? asNumber(row.target_input) ?? 0,
    });
  }

  return uniqueBy(
    edges,
    (edge) => `${edge.source}->${edge.target}:${edge.type}:${edge.sourceOutputIndex}:${edge.targetInputIndex}`,
  );
}

function ensureEdgeNodes(nodes: GeneratedNode[], edges: GeneratedEdge[], warnings: string[]) {
  const resultNodes = [...nodes];
  const known = new Set(resultNodes.map((node) => node.name));

  for (const edge of edges) {
    if (!known.has(edge.source)) {
      resultNodes.push({
        id: `synthetic_${slugify(edge.source)}`,
        name: edge.source,
        type: "unknown.synthetic",
        disabled: false,
      });
      known.add(edge.source);
    }

    if (!known.has(edge.target)) {
      resultNodes.push({
        id: `synthetic_${slugify(edge.target)}`,
        name: edge.target,
        type: "unknown.synthetic",
        disabled: false,
      });
      known.add(edge.target);
    }
  }

  if (resultNodes.length > nodes.length) {
    warnings.push(`Added ${resultNodes.length - nodes.length} synthetic node(s) referenced by connections.`);
  }

  return resultNodes;
}

function buildMermaid(workflowName: string, nodes: GeneratedNode[], edges: GeneratedEdge[], warnings: string[]): string {
  const lines: string[] = [
    "flowchart LR",
    "  classDef trigger fill:#E8F4FF,stroke:#007CE8,color:#00003D;",
    "  classDef io fill:#F5F8FF,stroke:#6B8DE3,color:#00003D;",
    "  classDef data fill:#ECFFF2,stroke:#1CD000,color:#00003D;",
    "  classDef logic fill:#FFF5E8,stroke:#F59E0B,color:#00003D;",
    "  classDef ai fill:#F6EEFF,stroke:#8B5CF6,color:#1E1B4B;",
    "  classDef step fill:#F3F4F7,stroke:#3B82F6,color:#00003D;",
  ];

  const nodeIdByName = new Map<string, string>();
  const familyIds: Record<string, string[]> = {
    trigger: [],
    io: [],
    data: [],
    logic: [],
    ai: [],
    step: [],
  };

  nodes.forEach((node, index) => {
    const mermaidId = `N${index + 1}`;
    nodeIdByName.set(node.name, mermaidId);

    const label = `${truncate(node.name, 42)}\\n${truncate(shortNodeType(node.type), 26)}`;
    lines.push(`  ${mermaidId}["${escapeMermaidLabel(label)}"]`);
    familyIds[inferNodeFamily(node.type)].push(mermaidId);
  });

  const displayedEdges = edges.slice(0, MAX_DIAGRAM_EDGES);
  displayedEdges.forEach((edge) => {
    const sourceId = nodeIdByName.get(edge.source);
    const targetId = nodeIdByName.get(edge.target);
    if (!sourceId || !targetId) return;

    if (edge.type && edge.type !== "main") {
      lines.push(`  ${sourceId} -->|${escapeMermaidLabel(edge.type)}| ${targetId}`);
      return;
    }
    lines.push(`  ${sourceId} --> ${targetId}`);
  });

  if (edges.length > MAX_DIAGRAM_EDGES) {
    warnings.push(`Diagram truncated to ${MAX_DIAGRAM_EDGES} edges (from ${edges.length}).`);
  }

  Object.entries(familyIds).forEach(([family, ids]) => {
    if (ids.length === 0) return;
    lines.push(`  class ${ids.join(",")} ${family};`);
  });

  lines.push(`  %% Generated for workflow: ${escapeMermaidLabel(workflowName)}`);

  return lines.join("\n");
}

function buildPythonSnippet(workflowId: string, workflowName: string, nodes: GeneratedNode[]): string {
  const functionName = `run_${slugify(workflowName).slice(0, 36)}`;
  const stepSample = nodes.slice(0, MAX_CODE_STEPS);

  const lines: string[] = [
    "from typing import Any, Dict, List",
    "",
    "",
    `def ${functionName}(context: Dict[str, Any]) -> Dict[str, Any]:`,
    '    """Auto-generated from n8n inventory snapshot data."""',
    `    workflow_id = ${JSON.stringify(workflowId)}`,
    "",
    "    steps: List[Dict[str, str]] = [",
    ...stepSample.map(
      (node) =>
        `        {"name": ${JSON.stringify(node.name)}, "type": ${JSON.stringify(shortNodeType(node.type))}},`,
    ),
    "    ]",
    "",
    "    for step in steps:",
    "        print(f\"[n8n-step] {step['name']} ({step['type']})\")",
    "",
    "    return {",
    '        "workflow_id": workflow_id,',
    '        "workflow_name": ' + JSON.stringify(workflowName) + ",",
    '        "steps_emitted": len(steps),',
    "    }",
  ];

  if (nodes.length > MAX_CODE_STEPS) {
    lines.push("", `# Truncated to ${MAX_CODE_STEPS} sampled steps from ${nodes.length} total nodes.`);
  }

  return lines.join("\n");
}

function buildTypeScriptSnippet(workflowId: string, workflowName: string, nodes: GeneratedNode[]): string {
  const functionName = `run${slugify(workflowName)
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 40) || "Workflow"}`;

  const stepSample = nodes.slice(0, MAX_CODE_STEPS);

  const lines: string[] = [
    "type WorkflowStep = { name: string; type: string };",
    "",
    `export async function ${functionName}(context: Record<string, unknown>) {`,
    `  const workflowId = ${JSON.stringify(workflowId)};`,
    "",
    "  const steps: WorkflowStep[] = [",
    ...stepSample.map(
      (node) =>
        `    { name: ${JSON.stringify(node.name)}, type: ${JSON.stringify(shortNodeType(node.type))} },`,
    ),
    "  ];",
    "",
    "  for (const step of steps) {",
    "    console.log(`[n8n-step] ${step.name} (${step.type})`);",
    "  }",
    "",
    "  return {",
    "    workflowId,",
    `    workflowName: ${JSON.stringify(workflowName)},`,
    "    stepsEmitted: steps.length,",
    "    contextKeys: Object.keys(context),",
    "  };",
    "}",
  ];

  if (nodes.length > MAX_CODE_STEPS) {
    lines.push("", `// Truncated to ${MAX_CODE_STEPS} sampled steps from ${nodes.length} total nodes.`);
  }

  return lines.join("\n");
}

function buildNotesSnippet(
  workflowId: string,
  workflowName: string,
  nodes: GeneratedNode[],
  edges: GeneratedEdge[],
  warnings: string[],
): string {
  const triggerNodes = nodes.filter((node) => inferNodeFamily(node.type) === "trigger").map((node) => node.name);
  const ioNodes = nodes.filter((node) => inferNodeFamily(node.type) === "io").map((node) => node.name);
  const disabledNodes = nodes.filter((node) => node.disabled).map((node) => node.name);

  const lines: string[] = [
    "### Workflow Summary",
    `- Workflow: ${workflowName}`,
    `- Workflow ID: \`${workflowId}\``,
    `- Nodes: ${nodes.length}`,
    `- Connections: ${edges.length}`,
    "",
    "### Trigger Nodes",
    ...(triggerNodes.length > 0 ? triggerNodes.map((name) => `- ${name}`) : ["- None detected"]),
    "",
    "### External I/O Candidates",
    ...(ioNodes.length > 0 ? ioNodes.slice(0, 8).map((name) => `- ${name}`) : ["- None detected"]),
    "",
    "### Disabled Nodes",
    ...(disabledNodes.length > 0 ? disabledNodes.map((name) => `- ${name}`) : ["- None"]),
  ];

  if (warnings.length > 0) {
    lines.push("", "### Generator Warnings", ...warnings.map((warning) => `- ${warning}`));
  }

  return lines.join("\n");
}

export function buildGeneratedSnippets(input: BuildGeneratedSnippetsInput): GeneratedWorkflowSnippets {
  const workflow = input.workflow;
  const snapshot = input.snapshot;
  const warnings = [...(input.initialWarnings ?? [])];

  const workflowId = asString(workflow.workflow_id) ?? "";
  const workflowName = (asString(workflow.name) ?? workflowId) || "Workflow";
  const workflowTags = toStringArray(workflow.tags);
  const baseTags = uniqueBy(["generated", "inventory", ...workflowTags], (value) => value);

  const workflowJson =
    asRecord(snapshot?.workflow_json) ??
    asRecord(snapshot?.workflow_jsonb);

  let nodes = parseNodesFromWorkflowJson(workflowJson);
  let edges = parseEdgesFromWorkflowJson(workflowJson);

  if (nodes.length === 0) {
    nodes = parseFallbackNodes(input.fallbackNodes);
    if (nodes.length > 0) {
      warnings.push("Used fallback node rows because snapshot JSON nodes were unavailable.");
    }
  }

  if (edges.length === 0) {
    edges = parseFallbackEdges(input.fallbackConnections);
    if (edges.length > 0) {
      warnings.push("Used fallback connection rows because snapshot JSON connections were unavailable.");
    }
  }

  nodes = ensureEdgeNodes(nodes, edges, warnings);

  const nodeCount = nodes.length;
  const connectionCount = edges.length;
  const latestSnapshotId = asString(workflow.latest_snapshot_id) ?? asString(snapshot?.snapshot_id) ?? asString(snapshot?.id);
  const snapshotCapturedAt = asString(workflow.latest_snapshot_captured_at) ?? asString(snapshot?.captured_at);
  const latestDefinitionHash = asString(workflow.latest_definition_hash) ?? asString(snapshot?.definition_hash);
  const generatedAt = new Date().toISOString();

  const mermaid = buildMermaid(workflowName, nodes, edges, warnings);
  const python = buildPythonSnippet(workflowId, workflowName, nodes);
  const typescript = buildTypeScriptSnippet(workflowId, workflowName, nodes);
  const notes = buildNotesSnippet(workflowId, workflowName, nodes, edges, warnings);

  const snippets: GeneratedSnippet[] = [
    {
      id: `${workflowId}-python`,
      title: `${workflowName} runner (Python)`,
      type: "code",
      language: "python",
      source: GENERATOR_VERSION,
      body: python,
      tags: [...baseTags, "python"],
      updatedAt: generatedAt,
    },
    {
      id: `${workflowId}-typescript`,
      title: `${workflowName} runner (TypeScript)`,
      type: "code",
      language: "typescript",
      source: GENERATOR_VERSION,
      body: typescript,
      tags: [...baseTags, "typescript"],
      updatedAt: generatedAt,
    },
    {
      id: `${workflowId}-diagram`,
      title: `${workflowName} flow diagram`,
      type: "diagram",
      language: "mermaid",
      source: GENERATOR_VERSION,
      body: mermaid,
      tags: [...baseTags, "diagram"],
      updatedAt: generatedAt,
    },
    {
      id: `${workflowId}-notes`,
      title: `${workflowName} generated notes`,
      type: "notes",
      language: "markdown",
      source: GENERATOR_VERSION,
      body: notes,
      tags: [...baseTags, "notes"],
      updatedAt: generatedAt,
    },
  ];

  return {
    workflow: {
      workflow_id: workflowId,
      name: workflowName,
      tags: workflowTags,
      node_count: asNumber(workflow.node_count) ?? nodeCount,
      latest_definition_hash: latestDefinitionHash,
      latest_snapshot_id: latestSnapshotId,
      latest_snapshot_captured_at: snapshotCapturedAt,
    },
    metadata: {
      generatorVersion: GENERATOR_VERSION,
      generatedAt,
      snapshotId: latestSnapshotId,
      snapshotCapturedAt,
      nodeCount,
      connectionCount,
      warnings,
    },
    snippets,
  };
}
