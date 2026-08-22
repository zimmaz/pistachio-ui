# Backend integration guide

This document tells a backend developer how to replace the mocked frontend with a real API **without rewriting the product UI**.

The frontend is a working demo. It has no HTTP client, no auth, and no persistence. All domain data is imported from `src/data/`. Mutations (finding decisions, risk-acceptance requests) live in React state for the session only.

The types in `src/data/types.ts` are the contract of record. Treat them as the API schema until a generated client exists.

---

## Current architecture

```
Browser
  └── React 18 + Vite + react-router-dom
        ├── pages/          read mocks from @/data
        ├── components/     presentational; most are already API-shaped
        └── data/           static TypeScript modules (to be replaced)
```

There is no `src/api/`, no React Query, no store. Pages import named exports from `@/data` (`FINDINGS`, `METRICS`, `entityRoute()`, …).

```
src/data/
  types.ts        canonical domain types — keep these
  index.ts        derived metrics, id lookups, entityLabel / entityRoute
  project.ts      current project, user, model versions, TOC
  model.ts        components, flows, boundaries, assets, threats,
                  controls, assumptions, attack paths, exceptions
  findings.ts     findings + status / type enums
  evidence.ts     evidence sources
  agents.ts       agents + agent activity
  activity.ts     model activity + notifications
  assistant.ts    canned Ask Pistachio answers
```

**Integration rule:** keep `types.ts` and the page/component tree. Replace the static modules with a thin client that returns the same shapes. Do not invent a parallel frontend model.

---

## Product model

Pistachio is not a scanner. The loop the UI is built around:

```
Evidence → System understanding → Threat model → Findings → Decision → Updated model
```

Six concepts must stay first-class and cross-linked:

| Concept | What it is | Prefix | Example |
|---|---|---|---|
| Project | One application / environment | `PRJ-` | `PRJ-PAY` |
| Evidence | Something observed | `EV-` | `EV-041` |
| Model entity | Component, flow, boundary, asset, threat, control, assumption, path | `CMP-` `DF-` `TB-` `AST-` `TM-` `CTRL-` `ASM-` `AP-` | `CMP-04` |
| Finding | Something a human must decide | `FIND-` | `FIND-103` |
| Decision / exception | Human governance | `EXC-` | `EXC-021` |
| Agent | Automated worker that proposes, never approves | `AGT-` | `AGT-01` |

IDs are **stable, human-readable, and prefixed**. The UI renders them in JetBrains Mono and treats them as hyperlinks via `entityRoute(id)`. Do not switch to opaque UUIDs in the UI without also returning a `displayId`. Internally you may use UUIDs; the wire format the UI sees should keep the prefixes.

Every claim that appears on screen must be traceable to evidence. If the backend cannot name a source, the UI should not invent one.

---

## Identifier routing

`entityRoute()` in `src/data/index.ts` is how every `FIND-` / `EV-` / `CMP-` / … link is resolved. After wiring the API, this function must still work — either against a client-side index built from the loaded project, or against a cheap `GET /entities/{id}` that returns `{ id, kind, route }`.

| Prefix | Frontend route |
|---|---|
| `FIND-*` | `/findings?id={id}` |
| `EV-*` | `/evidence?id={id}` |
| `CMP-*` | `/model?entity={id}#architecture` |
| `TM-*` | `/model?entity={id}#threats` |
| `CTRL-*` | `/model#controls` |
| `AST-*` | `/model#assets` |
| `TB-*` | `/model#trust-boundaries` |
| `ASM-*` | `/model#assumptions` |
| `EXC-*` | `/model#risks` |
| `AP-*` | `/model?path={id}#attack-paths` |
| `DF-*` | `/model#data-flows` |
| `AGT-*` | `/agents?id={id}` |

Assistant answers embed ids as `[[FIND-103]]`. `RichText` turns those tokens into the same links. Backend-generated assistant text should use that token form.

---

## Suggested API surface

Scope everything by project (and environment). The demo’s current project is `PRJ-PAY` / `Production`.

Assume a prefix like `/v1`. Names below are suggestions; the **payloads** are not.

### Session / tenancy

```
GET  /me
GET  /projects
GET  /projects/{projectId}                         # includes environment, modelStatus, coverage
GET  /projects/{projectId}/environments
```

`GET /me` should return the `CURRENT_USER` shape (`name`, `initials`, `role`, `team`). The sidebar and risk-acceptance copy use this.

`GET /projects` should return the `OTHER_PROJECTS` shape. The project switcher is already rendered as selectable; only `PRJ-PAY` is wired.

### Model (read)

The Model page is a document over structured data. Prefer one aggregate for first paint, plus cheaper endpoints for lists.

```
GET  /projects/{id}/model                          # current published version
GET  /projects/{id}/model/versions                 # newest first — MODEL_VERSIONS
GET  /projects/{id}/model/versions/{version}       # v18, v17, …
GET  /projects/{id}/components
GET  /projects/{id}/data-flows
GET  /projects/{id}/trust-boundaries
GET  /projects/{id}/assets
GET  /projects/{id}/threats
GET  /projects/{id}/controls
GET  /projects/{id}/assumptions
GET  /projects/{id}/attack-paths
GET  /projects/{id}/exceptions
```

`GET /model` should be enough to render `/model` and the Overview architecture mini-map. Suggested envelope:

```ts
{
  project: Project
  version: ModelVersion          // current
  versions: ModelVersion[]       // history, newest first
  components: SystemComponent[]
  dataFlows: DataFlow[]
  trustBoundaries: TrustBoundary[]
  assets: Asset[]
  threats: Threat[]
  controls: Control[]
  assumptions: Assumption[]
  attackPaths: AttackPath[]
  exceptions: RiskException[]
  sections?: ModelSection[]      // optional; frontend has a default TOC
}
```

Architecture graph layout uses `SystemComponent.x` / `.y` and `TrustBoundary.y` in **abstract grid units**, not pixels. The frontend maps those to SVG. If the backend cannot yet compute layout, return coordinates; a later layout service can replace them. Do not send pixel positions.

`DataFlow.from` / `.to` are component ids. `crossesBoundary` is a `TB-*` id or `null`.

`Threat.target`, `Finding.targetId`, `Control.components`, `Asset.storedIn`, `Assumption.source` (evidence id), and `EvidenceSource.affectedEntities` are all ids. Keep them as ids, not denormalised names — the UI looks names up.

### Evidence

```
GET  /projects/{id}/evidence                       # list + filters
GET  /projects/{id}/evidence/{evidenceId}
```

List query params the Evidence page already uses (keep these names):

| Param | Meaning |
|---|---|
| `type` | `Architecture` \| `Code` \| `Pull Request` \| `Meeting` \| `Infrastructure` \| `Policy` \| `Runtime` |
| `source` | `GitHub` \| `Confluence` \| `Teams` \| `Datadog` \| `Pistachio` (extensible) |
| `status` | `Analyzed` \| `Needs review` \| `Analyzing` \| `Conflict` |
| `agent` | `AGT-*` |
| `entity` | affected model entity id |
| `q` | free text over id, name, format, author |
| `time` | frontend currently buckets client-side from `analyzedLabel`; prefer `analyzedAfter` / `analyzedBefore` ISO timestamps |

Each row is an `EvidenceSource`. Detail is the same object — there is no second shape. `detectedChanges` is a list of short delta strings (`+ …`, `~ …`, `- …`, `! …`). `modelChange` is `"v17 → v18"` or `null`.

### Findings

```
GET    /projects/{id}/findings
GET    /projects/{id}/findings/{findingId}
POST   /projects/{id}/findings/{findingId}/mitigate
POST   /projects/{id}/findings/{findingId}/invalidate
POST   /projects/{id}/findings/{findingId}/risk-acceptances
```

List query params already in the URL:

| Param | Meaning |
|---|---|
| `id` | open this finding’s drawer (deep link, not a filter) |
| `severity` | `critical` \| `high` \| `medium` \| `low` |
| `type` | `FindingType` |
| `component` | `CMP-*` |
| `status` | `FindingStatus` |
| `owner` | team name |
| `scope` | `open` (default) \| `all` |
| `q` | free text |

Open statuses (must stay in sync with `OPEN_STATUSES`):

```
Open | Needs review | Mitigating | Pending approval
```

Closed / settled:

```
Risk accepted | Resolved | Invalid
```

**Agents must not be able to call the decision endpoints.** Only a human principal. The UI copy and the product depend on this.

#### Mitigate

```http
POST /projects/{id}/findings/{findingId}/mitigate
{ "note"?: string }
```

Sets status to `Mitigating`. The finding stays **open** until a control is verified (a later `Resolved` transition). Do not auto-resolve.

#### Invalidate

```http
POST /projects/{id}/findings/{findingId}/invalidate
{ "note": string }
```

Sets status to `Invalid`. The underlying threat stays in the model.

#### Request risk acceptance

This is a **request**, not an approval.

```http
POST /projects/{id}/findings/{findingId}/risk-acceptances
{
  "riskOwner": "Payments Director",
  "justification": "…",          // min 20 chars in the current UI
  "compensatingControls": ["VPN-only access", "IP allowlist"],
  "expires": "2026-11-30",       // date
  "securityApprover": "AppSec Director"
}
```

Effects:

1. Create a `RiskException` with `status: "Pending approval"`.
2. Set the finding to `Pending approval`.
3. Do **not** set `Risk accepted` here.
4. Record `riskOwner`, `securityApprover`, controls, expiry, justification.

Approval is a separate privileged action (not in the demo UI):

```
POST /projects/{id}/exceptions/{exceptionId}/approve    # AppSec only
POST /projects/{id}/exceptions/{exceptionId}/reject
```

On approve: exception → `Approved`, finding → `Risk accepted`. On expiry: exception → `Expired`, finding reopens (`Open` or `Needs review`).

The modal currently hard-codes owner options and suggested controls. Those should come from:

```
GET /projects/{id}/risk-owners
GET /projects/{id}/compensating-control-suggestions
GET /projects/{id}/required-approver          # "AppSec Director"
```

### Agents

```
GET  /projects/{id}/agents
GET  /projects/{id}/agents/{agentId}
GET  /projects/{id}/agents/{agentId}/activity
GET  /projects/{id}/activity                   # model-wide timeline (Overview)
GET  /projects/{id}/notifications
```

An agent is a specialised worker attached to the project, not a marketplace listing. Required fields are the `Agent` interface. `proposalsAwaitingReview` is a count of **model proposals**, not findings.

Agents **propose** model changes and **create** findings. They never record `Risk accepted`, never approve exceptions, never invalidate findings.

### Overview / metrics

```
GET  /projects/{id}/overview
```

The frontend currently **derives** `METRICS` and `RISK_POSTURE` from the datasets. You may either:

1. Return the raw collections and let the client keep deriving (simplest, stays consistent), or
2. Return a computed overview payload.

If you compute server-side, use the same rules as `src/data/index.ts`:

- `openFindings` = findings in `OPEN_STATUSES`
- `criticalFindings` / severity breakdown = open findings only
- `activeThreats` = threats with `status === "Active"`
- `evidenceCoverage` = integer 0–100 (demo: `84`)
- `needsReview` = findings with `status === "Needs review"`
- Risk posture label = `High` when ≥ 2 open criticals, otherwise the highest open severity

`ATTENTION_FINDINGS` is the top 5 open findings by severity, then recency.

`MODEL_ACTIVITY` is a timeline of `ActivityEvent`. Keep `kind` as `model | finding | evidence | agent | decision`.

### Search

```
GET  /projects/{id}/search?q=
```

The command palette (`⌘K`) currently searches a flattened `SEARCHABLE` list. Response items:

```ts
{ id: string; title: string; group: string; to: string }
```

`group` values in use: `Finding`, `Threat`, `Component`, `Evidence`, `Control`, `Attack path`, `Asset`, `Risk decision`, `Agent`.

`to` must be a frontend route from the table above, not an API path.

### Ask Pistachio

```
POST /projects/{id}/assistant/ask
{ "question": string, "context"?: { path: string, entityId?: string } }
```

Response should be an array of `AssistantBlock` from `src/data/assistant.ts`:

```ts
{ kind: 'text'; text: string }
{ kind: 'ordered'; items: string[] }          // items may contain [[ID]] tokens
{ kind: 'findings'; ids: string[] }
{ kind: 'path'; attackPathId: string }
{ kind: 'sources'; refs: string[] }           // required on every answer
```

Rules the UI already enforces visually and the backend must honour:

- Every answer ends with `sources`. No unsourced claims.
- Cite model entities with `[[EV-041]]` / `[[FIND-103]]` in `text` / `ordered` items.
- Suggested prompts are listed in `SUGGESTED_PROMPTS`; the backend can return its own list.

Do not make chat a navigation destination. The panel is contextual (`⌘J`) and stays over the current page.

---

## Relative time vs absolute time

The demo stores both:

- `detectedAt` / `analyzedAt` — ISO-8601 (`2026-08-22T12:06:00Z`)
- `detectedLabel` / `analyzedLabel` / `lastUpdatedLabel` — display strings (`18m ago`)

**Send ISO timestamps.** The frontend should format labels. Until that change lands, you may send both; do not send *only* a label.

Same for `expires` on exceptions (ISO date) and `expiresInDays` (derived).

---

## URL contract (do not break)

Filters, selections and drawers are in the query string. Deep links must keep working.

| Page | Query / hash | Meaning |
|---|---|---|
| `/overview` | — | Command centre |
| `/model` | `?entity=CMP-03` | Select architecture / threat entity, open context panel |
| `/model` | `?path=AP-01` | Selected attack path |
| `/model` | `#architecture` `#threats` `#risks` … | Section anchors (`MODEL_SECTIONS`) |
| `/evidence` | `?id=EV-041` | Open evidence drawer |
| `/evidence` | `?type=` `?source=` `?status=` `?agent=` `?entity=` `?time=` `?q=` | Filters |
| `/findings` | `?id=FIND-103` | Open finding drawer |
| `/findings` | `?severity=` `?type=` `?component=` `?status=` `?owner=` `?scope=` `?q=` | Filters |
| `/agents` | `?id=AGT-01` | Expand that agent |

`scope=open` is the implicit default on Findings and is omitted from the URL when active.

---

## Frontend components and what they consume

These are the surfaces a backend change will hit. Props are already domain-shaped.

### Shell (no domain API required to start)

| Component | Role | Backend later |
|---|---|---|
| `AppShell` | Layout, ⌘K / ⌘J, sidebar collapse | — |
| `Sidebar` | Nav + findings count + Ask Pistachio | `METRICS.openFindings`, `GET /me` |
| `ProjectSwitcher` | Project list | `GET /projects` — currently cosmetic except current project |
| `TopBar` | Breadcrumb, model version, env select, notifications | `PROJECT`, `GET /notifications`. Env switch should load that environment’s model or show the existing “not published” notice |
| `CommandPalette` | ⌘K | `GET /search` |
| `PistachioAssistant` | ⌘J | `POST /assistant/ask` |
| `NotificationPanel` | Attention list | `GET /notifications` — each item has `to` (frontend route) + `actionLabel` |

### Domain views

| Component | Consumes | Notes |
|---|---|---|
| `Overview` | `PROJECT`, `METRICS`, `RISK_POSTURE`, `THREATS_BY_RESIDUAL`, `OPEN_BY_SEVERITY`, `ATTENTION_FINDINGS`, `MODEL_ACTIVITY`, `CURRENT_VERSION` | Architecture mini-map highlights the webhook path |
| `Model` | Full model collections + `MODEL_VERSIONS` | Version pager is local index into the versions array (0 = current) |
| `ArchitectureGraph` | `COMPONENTS`, `DATA_FLOWS`, `TRUST_BOUNDARIES` | Needs `x`/`y` on components and `y` on boundaries |
| `EntityDetails` | One entity id + lookups | Drawer for a selected `CMP-*` / `TM-*` |
| `AttackPathView` | One `AttackPath` | Steps are ordered; controls on a step have `effective: boolean` |
| `Evidence` / `EvidenceDetail` | `EVIDENCE`, `AGENTS`, `COMPONENTS` | Detail is a drawer over the same record |
| `Findings` / `FindingDetail` | `FINDINGS` + lookups | Decisions are the first write path |
| `RiskAcceptanceModal` | One `Finding` | Collects owner, justification, controls, expiry; **requests** approval |
| `Agents` / `ActivityTimeline` | `AGENTS`, `AGENT_ACTIVITY` | Expand-in-place, not a marketplace |
| `SeverityDistribution` / `CoverageMeter` | counts / percent | Overview only |
| `EntityRef` / `SourceReference` / `RichText` | ids only | Need `entityLabel` + `entityRoute` |
| `SeverityBadge` / `StatusBadge` | enums in `types.ts` | New status strings need a tone in `Badges.tsx` |

### Writes that exist in the UI today

| UI action | Today | Target API |
|---|---|---|
| Mitigate | `setState` → `Mitigating` | `POST …/mitigate` |
| Mark invalid | `setState` → `Invalid` | `POST …/invalidate` |
| Accept risk | modal → `Pending approval` | `POST …/risk-acceptances` |
| Project switch | visual only | `GET /projects/{id}` + route |
| Environment switch | notice, still shows Production | load that env or keep notice |
| Ask Pistachio | canned `assistant.ts` | `POST /assistant/ask` |

Everything else is read-only in the demo (evidence analysis, model publish, agent runs). Those are backend/agent jobs that should show up as new `EvidenceSource`, `ModelVersion`, `Finding`, and `ActivityEvent` records.

---

## Recommended integration sequence

Do this in order so the UI stays demoable at every step.

1. **Do not replace pages.** Add `src/api/client.ts` (fetch wrapper, auth header, base URL from `import.meta.env.VITE_API_BASE`).
2. **Keep `src/data/types.ts`.** If the API drifts, change the type and the UI together.
3. **Introduce a project loader** (React context or a query library) that fetches `GET /projects/{id}/model`, evidence, findings, agents, activity once and exposes the same names `index.ts` currently exports (`FINDINGS`, `componentById`, `METRICS`, …). Pages keep importing from `@/data` or from that context.
4. **Move derived values** (`METRICS`, `entityLabel`, `SEARCHABLE`) to functions of the loaded payload, not module-level constants.
5. **Wire writes** on Findings first — they are the only mutations the UI already performs.
6. **Replace assistant** canned answers last; the panel already renders `AssistantBlock[]`.
7. Leave relative-time formatting to the client; send ISO datetimes.

A mechanical first step that compiles:

- Change `src/data/index.ts` from `export const FINDINGS = …` to `export function useProjectData()` that returns the same fields.
- Point pages at the hook.
- Swap the hook’s source from static imports to `fetch`.

Until the API exists, keep the static modules as a fixture used when `VITE_API_BASE` is unset. That preserves the demo.

---

## Auth and tenancy

Not implemented. The UI assumes one signed-in user (Dana Okoye) and one project.

Minimum to go live:

- Cookie or bearer token on the API client.
- `GET /me` for the sidebar avatar.
- Project membership; 404/403 if the user cannot see `PRJ-PAY`.
- Environment as a first-class key: `(projectId, environment)` → one published model.
- Decision endpoints require a human identity; reject service / agent tokens.

---

## Consistency rules (non-negotiable)

The demo’s narrative spine is **PR #182 → EV-041 → CMP-04 Webhook Service → model v18 → FIND-107 / FIND-103**. Real data must be equally consistent:

1. If evidence introduces a component, that component exists on the current model version and appears in the version diff.
2. If a finding names `targetId: CMP-04`, that component exists.
3. If a finding lists `evidence: ["EV-041", …]`, those records exist and list the finding in `findings`.
4. If an agent’s `lastRunEvidenceId` is `EV-041`, that evidence’s `agentId` is that agent (or a documented hand-off).
5. Version diffs (`added` / `changed` / `removed`) describe the same entities the collections contain.
6. Headline numbers are derived, never hard-coded a second time.
7. No invented proof: no fake “trusted by”, no fake confidence gauges, no metrics the model cannot support.
8. **No agent-approved residual risk.**

---

## Enums (copy these)

```
Severity:           critical | high | medium | low | info
FindingType:        Threat | Control Gap | Policy Violation | Architecture Change
                    | Unverified Assumption | Evidence Conflict | Risk Increase
FindingStatus:      Open | Needs review | Mitigating | Pending approval
                    | Risk accepted | Resolved | Invalid
EvidenceType:       Architecture | Code | Pull Request | Meeting
                    | Infrastructure | Policy | Runtime
EvidenceStatus:     Analyzed | Needs review | Analyzing | Conflict
ComponentKind:      actor | service | gateway | store | queue
Exposure:           Internet-facing | Internal | Data layer | External
Zone:               external | edge | application | data
Threat category:    Spoofing | Tampering | Repudiation | Information Disclosure
                    | Denial of Service | Elevation of Privilege
Threat status:      Active | Mitigated | Accepted
Control family:     Identity | Network | Data | Detection | Application | Governance
Control status:     Implemented | Partial | Planned | Not implemented
Assumption status:  Verified | Unverified | Contradicted
AttackPath status:  Open | Partially mitigated | Mitigated
Exception status:   Approved | Pending approval | Expired
Agent state:        Active | Idle | Paused
Activity kind:      model | finding | evidence | agent | decision
Model status:       Current          (extend later: Stale | Computing)
```

If you add an enum value, add a badge tone in `src/components/Badges.tsx` or the UI will render it as neutral.

---

## What this frontend will not do

- Ingest evidence, run agents, or publish model versions — those are backend jobs.
- Approve risk. The UI can only **request** approval.
- Delete the model or rewrite history. New versions are append-only (`v18`, `v17`, …).
- Act as a SIEM or vuln scanner. Findings are broader than CVEs.

---

## File map for reviewers

| You need | Read |
|---|---|
| Wire types | `src/data/types.ts` |
| Derived metrics + id routing | `src/data/index.ts` |
| Example project graph | `src/data/model.ts`, `src/data/project.ts` |
| Example findings / evidence / agents | `src/data/findings.ts`, `evidence.ts`, `agents.ts` |
| Assistant block schema | `src/data/assistant.ts` |
| Finding writes | `src/pages/Findings.tsx`, `FindingDetail.tsx`, `RiskAcceptanceModal.tsx` |
| Graph layout fields | `src/components/ArchitectureGraph.tsx` |
| Routes | `src/App.tsx` |

The demo dataset in `src/data/` is a fixture of one coherent project. Use it as the first contract test: if your API can serve `PRJ-PAY` / Production / v18 and the existing pages render without mapping layers, the integration is right.
