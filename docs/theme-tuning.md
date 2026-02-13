# Theme Tuning (John Quick Guide)

Purpose: fast visual tuning without chasing styles across pages.

## Primary knobs

File: `client/src/index.css`

Dark mode global tokens:
- `--fit-dark-bg`: full app background (currently `#00449B`)
- `--fit-dark-surface`: card/header surface tint (currently `rgba(0, 68, 155, 0.85)`)
- `--fit-dark-surface-strong`: stronger top bar tint
- `--fit-dark-border`: card/header border contrast

Card token layer:
- `--fit-card-surface-bg`
- `--fit-card-surface-border`
- `--fit-card-shadow`
- `--fit-card-shadow-hover`

## Card variants

Use these classes when building sections:
- Base: `.fit-card`
- Feature card: `.fit-card-feature`
- Surface card: `.fit-card-surface`
- Gradient card: `.fit-card-cta`

## Suggested tweaks

If dark looks too flat:
1. Increase border contrast: raise `--fit-dark-border` alpha.
2. Increase card lift: adjust `--fit-card-shadow-hover`.

If dark looks too bright:
1. Lower surface opacity: reduce `--fit-dark-surface` alpha from `0.85` to `0.78`.
2. Reduce radial glow in `.dark .fit-app-bg`.

If dark looks too noisy:
1. Keep `--fit-dark-bg` fixed.
2. Remove one radial gradient layer from `.dark .fit-app-bg`.

## Safe workflow

1. Edit `client/src/index.css`.
2. Run `npm run dev` and visually check `/health`, `/workflows`, `/sync-runs`.
3. Run gates: `npm run build`, `npm run typecheck`, `npm run lint`.
4. If token intent changed, mirror the same values in `design.json`.
