# Pistachio

Interactive frontend demo for **Pistachio** — continuous, AI-assisted threat modeling for the fictional *Payments Platform (Production)*.

The product loop the interface is built around:

```
Evidence → System understanding → Threat model → Findings → Decision → Updated model
```

Every screen is a view onto one stage of that loop, and every claim on screen carries a reference back to the evidence it came from.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run typecheck   # tsc --noEmit, strict
npm run build       # typecheck + production bundle
npm run preview     # serve the production bundle
```

Node 18+ is required (Vite 6).

## Stack

The repository was empty, so the stack was chosen to stay small and unopinionated:

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | React 18 + TypeScript (strict) | |
| Build | Vite 6 | |
| Routing | `react-router-dom` v6 | Filters, selections and open drawers live in the URL, so any state is linkable |
| Icons | `lucide-react` | One consistent icon system; no emoji |
| Styling | Plain CSS with custom properties | No utility framework, no CSS-in-JS runtime |

Four runtime dependencies in total. There is no backend: all state is client-side, and mutations (recording a decision, requesting a risk acceptance) are held in React state for the length of the session.

Backend developers: see [docs/BACKEND.md](docs/BACKEND.md) for the domain contract, suggested API surface, URL query params, and how to replace `src/data/` without rewriting the UI.

## Layout

```
tokens.css              design tokens — colour, type, space, radii, motion, z-index
src/
  styles/
    base.css            reset, typography, and the shared primitives (buttons,
                        badges, tables, callouts, form controls)
    shell.css           app shell: sidebar, top bar, overlays, responsive rules
    components.css      composed components: metrics, filters, timeline,
                        palette, assistant
    viz.css             severity distribution, coverage, architecture graph,
                        attack paths
    pages.css           page compositions and the Model three-region layout
  data/                 the entire demo dataset (see below)
  lib/
    brand.ts            the supplied pixel-art asset
    hooks.ts            dialog focus trap, dismissable popovers, shortcuts,
                        persisted preferences, scroll-spy
  components/           AppShell, Sidebar, TopBar, CommandPalette,
                        PistachioAssistant, ArchitectureGraph, AttackPath,
                        FindingDetail, EvidenceDetail, EntityDetails, …
  pages/                Overview, Model, Evidence, Findings, Agents
```

## Design system

Tokens live in `tokens.css` and nothing else declares a raw colour. Colours are OKLCH, derived from the pixel-art mark:

- **Surfaces** step from `--background` through `--surface-raised` in roughly 3% lightness increments, each tinted slightly green. Nothing is pure black.
- **Brand** (`--brand`, `--brand-emphasis`) is a controlled accent: selection, focus, active agents, the current model version, and key relationships. It is never used for severity.
- **Risk** keeps conventional semantics — crimson, red-orange, amber, muted green, blue-grey — harmonised into the forest palette. Severity is always carried by a shape and a word as well as a hue, so it never depends on colour alone.
- **Type** is a three-way split: Space Grotesk for display, Inter for UI, JetBrains Mono for every identifier, version, hash, endpoint and timestamp.
- **Space** is a 4pt scale; radii are deliberately tighter than consumer SaaS.

### The logo

The supplied lockup (`banner.png`) is a light-background asset: its wordmark is deep forest and would disappear on this shell. The nut is cropped out of the lockup with `background-position` and rendered with `image-rendering: pixelated`, so its pixels are never resampled, smoothed or redrawn. The wordmark beside it is real type. Pixel art appears only as brand: the sidebar mark and the assistant avatar. Charts, icons, borders and typography are not pixelated.

## Demo data

`src/data/` holds one internally consistent fictional project. Nothing is generated per-page, and the headline numbers are **derived** from the datasets rather than written down twice:

| | |
| --- | --- |
| Model version | session-aware: v18 until REV-021 is approved, then v19 |
| Evidence sources | derived from `src/data/evidence.ts` |
| Active threats / controls | derived from the currently visible model version |
| Open findings | derived from `src/data/findings.ts` |
| Evidence coverage | 84% |

The narrative spine is **PR #182**. It is evidence (`EV-041`) and a **proposal for v19**, not part of authoritative v18. Agents analyze it and create `REV-021`. Human approval publishes **v18 → v19**, which makes the Webhook Service, two data flows, `TM-047`, and `TM-048` authoritative. `FIND-107` / `FIND-109` remain open findings. The same records appear in the PR Review Agent's last run and in Ask Pistachio — and those answers change after approval.

`src/data/index.ts` derives the metrics, builds the id→entity lookups, and owns `entityLabel()` / `entityRoute()`, which is why any identifier rendered anywhere in the app is clickable and lands somewhere sensible.

## Interaction

- **⌘K / Ctrl+K** — command palette across threats, findings, evidence, components, controls, assets, attack paths and agents
- **⌘J / Ctrl+J** — Ask Pistachio panel, which opens beside the current page rather than replacing it
- Filters, sorting, selected rows, open drawers, the selected architecture node and the chosen attack path are all URL state
- Findings can be mitigated, marked invalid, or put through a risk-acceptance flow that requires an owner, a justification and a compensating control before it can *request* approval. No agent can approve anything.
- Sidebar collapse, compact density and reduced motion persist in `localStorage`

## Accessibility

Semantic landmarks and headings, a skip link, visible focus throughout, focus-trapped dialogs that restore focus on close, `aria-activedescendant` on the command palette, `aria-sort` on sortable columns, and severity/status encoded redundantly. `prefers-reduced-motion` is respected, and the same behaviour can be opted into from workspace preferences.

## Responsive

Designed for 1440px and up. At 1280px the Model context panel becomes an overlay; at 1120px the three-region layout stacks and the table of contents becomes a horizontal index; at 1024px the sidebar becomes an off-canvas drawer. Tables scroll horizontally rather than dropping columns. Mobile is not a target.
