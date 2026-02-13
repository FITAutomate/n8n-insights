# V2 Roadmap

Purpose: track near-term UX and content capabilities after milestone-driven v2 redesign work.

## Confirmed milestones

- 7.0 UX foundations freeze (shell/header/table standard)
- 7.1 env selector plumbing (`dev` / `prod`)
- 7.2 scalable grouped navigation
- 7.3 workflows v2 URL-driven filters + tag chips
- 7.4 workflow detail v2
- 7.5 sync runs + reliability drilldowns
- 7.6 UI polish + hardening
- 7.7 content primitives for code/diagram pages
- 7.8 light/dark theme system
- 7.9 logo/header enhancement + snippet readability polish

Recommended execution order for remaining milestones: 7.6 -> 7.8 -> 7.7.

## 7.7 Content Primitives

Goal: support rendering reusable technical content blocks in the dashboard UX.

### Scope

- `CodeBlock` component:
  - formatted code surface
  - copy-to-clipboard
  - language label (`python`, `typescript`, etc.)
- `MermaidBlock` component:
  - client-side rendered Mermaid graphs
  - safe fallback when parse/render fails
- `ContentTabs` wrapper:
  - tabs for `Code`, `Diagram`, `Notes`
- `Snippet` data contract:
  - id, title, type, language, source, body, tags, updatedAt

Delivered starter:
- route: `/snippets`
- navigation entry under `Insights`
- sample Python/TypeScript snippets + Mermaid flow chart + notes panel

### Data automation ambition

Build technical snippets automatically from workflow inventory data:

- Source: `workflow_nodes`, `workflow_connections`, `workflow_snapshots`
- Candidate generator output:
  - Mermaid flowchart from nodes + edges
  - Python/TypeScript pseudo-snippet from common node patterns
  - human-readable notes from node metadata

This should be generated server-side and persisted as derived artifacts, not ad-hoc in browser code.

## Wish List

- Per-workflow "Generate Diagram" action on detail page.
- Namespace filters for generated content by team/domain.
- Versioned snippet history linked to `latest_definition_hash`.
- Export buttons: Markdown, Mermaid `.mmd`, Python `.py`, TypeScript `.ts`.
- Lightweight review queue before publishing generated snippets to shared docs.
