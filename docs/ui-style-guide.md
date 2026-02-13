# UI Style Guide (Milestone 7.0 Freeze)

Purpose: define a stable baseline for layout and visual consistency before incremental redesign milestones.

## Token source of truth

- `design.json` is the design-token source.
- Runtime implementation maps tokens into CSS variables in `client/src/index.css`.
- Component token aliases now include card primitives:
  - base: `.fit-card`
  - variants: `.fit-card-feature`, `.fit-card-surface`, `.fit-card-cta`

## Foundations frozen in 7.0

- App shell:
  - Sticky top header + full-width content area (no hard `max-w` constraint)
  - FIT gradient-tinted page background
  - Sidebar remains functional; full nav redesign deferred to Milestone 7.2
- Page header standard:
  - All top-level pages use `PageHeader` (`title`, `description`, optional `actions`)
  - Typography: heading uses `font-heading` (Poppins)
- Table standard:
  - Shared frame component `DataTableFrame`
  - Sticky table headers, bordered card surface, consistent spacing

## Typography

- Heading font: `Poppins`
- Body font: `Open Sans`
- Defined via CSS variables:
  - `--font-heading`
  - `--font-sans`

## Color direction

- Primary: FIT blue (`#007CE8`)
- Accent: FIT green (`#1CD000`)
- Anchor/dark text: FIT navy (`#00003D`)
- Subtle backgrounds: FIT silver (`#F3F4F7`)

## Theme system (Milestone 7.8)

- Light/dark mode is user-toggleable from header.
- Mode persists in localStorage (`fit-insights-theme-mode`).
- Runtime applies `documentElement.dark` and uses token variables from `client/src/index.css`.

## Card tokens (Milestone 7.8 extension)

- Token keys live in `design.json` under `components.cards`.
- CSS variable mappings live in `client/src/index.css` (`--fit-card-*`).
- To restyle cards globally, edit `design.json` intent + mapped CSS variables once instead of changing page-level classes repeatedly.

## Milestone boundary

This guide freezes shell/header/table foundations only.
Detailed page IA, component density, drilldowns, and interactions continue in Milestones 7.1 to 7.6.

## Navigation (Milestone 7.2)

- Sidebar navigation is grouped by domain (`Core`, `Insights`, `System`).
- Navigation source is centralized in `client/src/config/navigation.ts`.
- Each item includes:
  - route
  - icon
  - short descriptor line for quick scanning
- New pages should be added to the config, not hardcoded in sidebar component logic.
