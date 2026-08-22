# Frontend / domain contract

This document describes the **frontend/domain contract** and backend capabilities required by the Pistachio prototype. It is **not** the final backend architecture or database schema.

```
Frontend DTO
  ≠  Backend domain entity
  ≠  Database row
```

Some frontend properties are derived or presentational and must not automatically become persistence columns. Examples:

- display labels and relative timestamps (`12m ago`, `just now`)
- graph coordinates (`x`, `y` on components and trust boundaries)
- derived counts (`METRICS`, review-queue totals, `expiresInDays`)
- navigation URLs (`to`, `entityRoute`)
- UI-only status text and chips

The types in `src/data/types.ts` and the live session behaviour in `src/lib/model-session.tsx` are the current contract of record. Treat them as the product’s expected shapes, not as a table design.

The frontend is a working demo. It has no HTTP client, no auth, and no persistence. Domain seed data lives in `src/data/`. Session mutations (review decisions, model publication, finding lifecycle, risk acceptance) live in React state until a backend exists.

---

## Product rule

This is the most important backend requirement:

```
Evidence is observed.
Agents analyze evidence.
Agents create proposals.
Proposals enter human review.
Only approved proposals modify the authoritative model.
Approval creates a new model version.
Findings have a separate lifecycle.
Risk acceptance is a human governance action.
```

Agents propose. Humans approve. The model records accepted state.

Do not silently mutate the meaning of an already published version. The frontend story is:

```
v18
   ↓ approved model change (REV-021)
v19
```

v18 remains historical. v19 is a new current version. The backend may implement that with snapshots, events, temporal records, change sets, or another mechanism. This document does not prescribe one.

---

## First-class domain concepts

These are product concepts. They do **not** necessarily map one-to-one to database tables.

| Concept | Role | Typical id |
|---|---|---|
| Project | One application / environment | `PRJ-PAY` |
| Evidence | Immutable source material | `EV-041` |
| Model | The accepted system understanding | — |
| Model Version | Published snapshot of accepted state | `v18`, `v19` |
| Model Entity | Versioned object inside a model | `CMP-` `DF-` `TB-` `AST-` |
| Model Change / Proposal | Proposed delta awaiting review | REV-021 / PR #182 |
| Component | System node | `CMP-04` |
| Data Flow | Directed relationship between components | `DF-02` |
| Trust Boundary | Crossing constraint | `TB-01` |
| Asset | Valuable target | `AST-01` |
| Threat | Modelled attack possibility | `TM-047` |
| Attack Path | Walkable chain through the model | `AP-03` |
| Control | Mitigating measure | `CTRL-02` |
| Assumption | Claim the model currently depends on | `ASM-012` |
| Finding | Actionable operational concern | `FIND-107` |
| Mitigation | Planned or active treatment of a finding | — |
| Decision / Risk Acceptance | Human governance record | `EXC-021` |
| Review | Human workflow over a proposal | `REV-021` |
| Agent | Worker that analyzes and proposes | `AGT-01` |
| Agent Run | One execution of an agent | — |
| Provenance Relation | Typed `source → relation → target` edge | — |

IDs shown in the UI are stable, human-readable, and prefixed. Internally the backend may use UUIDs; the wire format the UI sees should keep the prefixes or also return a `displayId`.

---

## Authoritative model vs proposed changes

The frontend distinguishes:

```
Authoritative model     current published version
Proposed changes        objects attached to an unapproved proposal
Historical              previously published versions
```

Objects carry enough metadata for the UI to decide visibility:

```ts
proposedInVersion?: string
proposalId?: string
addedInVersion?: string
```

and conceptually:

```ts
type ModelObjectState = 'approved' | 'proposed' | 'removed' | 'superseded'
```

**Recursive visibility.** Filtering top-level lists is not enough. If an approved object references a proposed object, that relationship must be hidden from the authoritative view.

Example: `TB-01` is approved in v18. `DF-02` is proposed for v19. Authoritative v18 must show `TB-01` crossings without `DF-02`. With “Show proposed changes” on, `DF-02` may appear and must be labelled proposed. After REV-021 is approved, `DF-02` becomes a normal v19 crossing.

Frontend helper: `src/lib/model-visibility.ts` (`isModelObjectVisible`, `filterVisibleRelations`).

---

## Model versions

There is one runtime source of truth for the current version: the session’s `currentVersion` (`src/lib/model-session.tsx`). Seed arrays such as `MODEL_VERSIONS` and `CURRENT_VERSION` are **historical fixtures**, not current runtime state after the session starts.

Effective history is:

```
seed history (v15–v18)
  + session publication (v19 after REV-021)
  = modelHistory
```

Before approval:

```
v18   Current
v17
v16
…
```

After REV-021:

```
v19   Current
v18
v17
…
```

The UI may inspect a historical version while another version is current:

```
currentModelVersion = v19
selectedModelVersion = v18
```

A historical view must say it is historical. It must not be labelled current.

Version identifiers are numeric (`v9`, `v10`, `v18`). Compare them with `src/lib/model-version.ts`. Do not order them lexicographically.

---

## Reviews

Review is a first-class workflow, separate from content revision.

```ts
type ReviewStatus =
  | 'Awaiting Review'
  | 'Awaiting Clarification'
  | 'Approved'
  | 'Rejected'

type ReviewRevisionState = 'original' | 'edited'
```

Editing a proposal does **not** complete the review. The item stays `Awaiting Review` and is marked `edited`. Only `Approved` and `Rejected` leave the active queue. `Awaiting Clarification` remains visible in its own subsection.

Conceptual actions:

- approve proposal
- reject proposal
- request clarification
- return to review
- edit before approval

### Model-change approval

```
Model Proposal
   ↓ human approval
Published Model Version
```

Demo story:

```
REV-021
   ↓
v18 → v19
```

Approving a model proposal can make proposed components, data flows, trust-boundary changes, threats, and attack paths authoritative.

**Approving a model proposal does not automatically resolve, accept, or otherwise complete associated findings.**

```
PR #182
   ↓
model proposal approved
   ↓
v19 created
   ↓
TM-047 / TM-048 become authoritative
   ↓
FIND-107 remains In Review
FIND-109 remains Open
```

This is intentional.

---

## Findings

Findings are operational objects derived from model and evidence. They are not model entities.

Current frontend statuses (`src/data/findings.ts`):

```
Open
In Review
Mitigation Planned
Mitigating
Risk Acceptance Requested
Risk Accepted
Resolved
Invalid
```

Open for attention / counts:

```
Open | In Review | Mitigation Planned | Mitigating | Risk Acceptance Requested
```

Do not retain stale values from earlier iterations (`Needs review`, `Pending approval` as finding statuses, `Risk accepted` as a distinct spelling). Exception records may still use `Pending approval` for the decision object itself.

---

## Risk acceptance

Risk acceptance is a dedicated human governance decision, not a boolean on a finding and not a normal model-change review.

A request records:

- Finding
- Residual risk
- Risk owner
- Justification
- Compensating controls
- Expiration
- Required approver
- Human approval identity

Agents may recommend risk treatment. Agents may **not** approve risk, accept exceptions, or appear as `Approved by`.

The result is a Decision / Exception record (`EXC-*`, conceptually `GovernanceDecision` / `RiskException`). Approving risk sets the finding to `Risk Accepted`. Rejecting it returns the finding to `Open`.

Conceptual actions:

- request risk acceptance
- approve risk
- reject risk

---

## Authorization

The demo assumes the signed-in user may act. The backend must eventually enforce authority server-side for:

- approve model proposal
- reject proposal
- request / return clarification
- approve risk
- reject risk
- manage exception

Do not treat UI-only role labels as enforcement.

---

## Evidence

Evidence is the source material from which Pistachio derives security knowledge. It is observed, not inferred.

A record should ultimately have:

- identity
- source / type
- timestamps
- ingestion metadata
- content or a reference to content
- processing status
- provenance relationships

Exact storage will be decided in backend design.

Current frontend evidence statuses: `Analyzed | Needs review | Analyzing | Conflict`.

---

## Agents and agent runs

Agents are workers, not owners of authoritative state.

They may:

- ingest / analyze evidence
- extract system facts
- propose model changes
- propose threats
- propose findings
- identify contradictions
- suggest mitigations

They may not:

- publish an authoritative model without review
- accept organizational risk
- approve exceptions
- impersonate human reviewers

An **Agent Run** is one execution. The UI already thinks in terms of agent, trigger, input, observations, proposals, findings, status, and timestamp. A run must be traceable to its inputs and outputs for audit and provenance.

---

## Provenance

Provenance is a typed relationship graph, not only a linear chain.

```ts
{
  sourceId: string
  targetId: string
  relation: ProvenanceRelation
}

type ProvenanceRelation =
  | 'supports'
  | 'contradicts'
  | 'establishes'
  | 'derived_from'
  | 'introduced_by'
  | 'modified_by'
  | 'affects'
  | 'motivates'
  | 'verifies'
  | 'invalidates'
  | 'participates_in'
```

The frontend may render a selected path as a narrative. The backend should preserve the richer graph.

Examples:

```
PR #182  ── introduced_by ──>  Webhook Service
Webhook Service  ── affects / motivates ──>  TM-047
PR #182  ── supports ──>  FIND-107
```

```
Architecture Sync  ── establishes ──>  ASM-012
terraform/prod/sqs.tf  ── contradicts ──>  ASM-012
ASM-012  ── affects ──>  TM-049
TM-049  ── participates_in ──>  AP-021
terraform/prod/sqs.tf  ── supports ──>  FIND-112
```

A finding does not cause an attack path. Evidence and assumptions do.

---

## Server-authoritative state

Once a backend exists, the server is authoritative for:

- current model version
- proposal state
- review state
- finding lifecycle
- risk decisions
- approval identity
- model history

The frontend session store currently mocks these behaviours. It should become a client cache / read model, not the source of truth.

---

## Conceptual API

Do not lock the final backend to exact REST names. The UI will need resources and actions around:

```
projects
model / model versions / model proposals / comparison
evidence
threats / attack paths
findings
reviews
decisions / risk acceptance
agents / agent runs
provenance
```

Useful actions:

```
approve proposal
reject proposal
request clarification
request risk acceptance
approve risk
reject risk
view model version
compare model versions
trace provenance
```

Suggested read envelopes can follow the current frontend aggregates (`GET /projects/{id}/model` returning versioned collections). Graph layout coordinates are abstract grid units, not pixels.

Identifier routing used by the UI (`entityRoute` in `src/data/index.ts`):

| Prefix | Frontend route |
|---|---|
| `REV-*` | `/overview?review={id}` |
| `FIND-*` | `/findings?id={id}` |
| `EV-*` | `/evidence?id={id}` |
| `CMP-*` | `/model?entity={id}&view=architecture` |
| `TM-*` | `/model?entity={id}&view=document#threats` |
| `CTRL-*` | `/model?view=document#controls` |
| `AST-*` | `/model?view=document#assets` |
| `TB-*` | `/model?view=document#trust-boundaries` |
| `ASM-*` | `/model?view=document#assumptions` |
| `EXC-*` | `/model?view=document#risks` |
| `AP-*` | `/model?path={id}&view=paths` |
| `DF-*` | `/model?view=document#data-flows` |
| `AGT-*` | `/agents?id={id}` |

Assistant answers embed ids as `[[FIND-107]]`. Backend-generated assistant text should use that token form and remain session-aware of the current model version.

---

## URL contract

Filters, selections and drawers are in the query string. Deep links must keep working.

| Page | Query / hash | Meaning |
|---|---|---|
| `/overview` | `?review=REV-021` | Open review drawer |
| `/model` | `?view=document\|architecture\|paths\|changes` | Model views |
| `/model` | `?entity=CMP-03` | Select entity / context panel |
| `/model` | `?path=AP-01` | Selected attack path |
| `/model` | `?proposed=1` | Architecture overlay of proposed objects |
| `/model` | `?compare=v17` | Compare a historical version |
| `/model` | `#architecture` `#threats` `#risks` … | Section anchors |
| `/evidence` | `?id=EV-041` plus filters | Evidence |
| `/findings` | `?id=FIND-107` plus filters | Findings |
| `/agents` | `?id=AGT-01` | Expand that agent |

---

## Time

Send ISO timestamps (`detectedAt`, `analyzedAt`, `expires`). Display labels are derived. `expiresInDays` is derived.

---

## Events

The domain naturally emits events such as:

```
EvidenceAdded
AgentRunCompleted
ModelChangeProposed
ReviewRequested
ClarificationRequested
ModelProposalApproved
ModelVersionPublished
FindingCreated
FindingUpdated
RiskAcceptanceRequested
RiskAccepted
AssumptionContradicted
```

These are conceptual domain events. Transport (queue, bus, outbox, or none) is a later architecture decision.

---

## Consistency rules

1. An authoritative model view must never reveal a proposed object through a nested relationship.
2. If evidence introduces a component, that component exists on some model version and is either proposed or approved.
3. Finding `targetId`, `threats`, and `evidence` must resolve.
4. Decision `findingId` must resolve.
5. Review evidence, change ids, and finding ids must resolve.
6. Provenance `sourceId` / `targetId` must resolve.
7. Headline numbers are derived, never duplicated as a second source of truth.
8. No agent-approved residual risk.
9. Model publication does not complete findings.

---

## Enums (current frontend)

```
Severity:           critical | high | medium | low | info
FindingType:        Threat | Control Gap | Policy Violation | Architecture Change
                    | Unverified Assumption | Evidence Conflict | Risk Increase
FindingStatus:      Open | In Review | Mitigation Planned | Mitigating
                    | Risk Acceptance Requested | Risk Accepted | Resolved | Invalid
ReviewStatus:       Awaiting Review | Awaiting Clarification | Approved | Rejected
ReviewRevision:     original | edited
EvidenceType:       Architecture | Code | Pull Request | Meeting
                    | Infrastructure | Policy | Runtime
EvidenceStatus:     Analyzed | Needs review | Analyzing | Conflict
ComponentKind:      actor | service | gateway | store | queue
Exposure:           Internet-facing | Internal | Data layer | External
Threat category:    Spoofing | Tampering | Repudiation | Information Disclosure
                    | Denial of Service | Elevation of Privilege
Threat status:      Active | Mitigated | Accepted
Control status:     Implemented | Partial | Planned | Not implemented
Assumption status:  Verified | Unverified | Contradicted
AttackPath status:  Open | Partially mitigated | Mitigated
Exception status:   Approved | Pending approval | Expired
Decision type:      Mitigate | Accept Risk | Mark Invalid
Agent state:        Active | Idle | Paused
Model object state: approved | proposed | removed | superseded
```

If you add an enum value, add a badge tone in `src/components/Badges.tsx`.

---

## What this frontend will not do

- Ingest evidence, run agents, or publish versions except as a session mock of human approval
- Let an agent accept risk
- Delete the model or rewrite published history
- Act as a SIEM or vulnerability scanner

---

## File map

| You need | Read |
|---|---|
| Wire / DTO types | `src/data/types.ts` |
| Session / publication mock | `src/lib/model-session.tsx` |
| Visibility + relation filtering | `src/lib/model-visibility.ts` |
| Version ordering | `src/lib/model-version.ts` |
| Seed model / findings / evidence | `src/data/model.ts`, `findings.ts`, `evidence.ts`, `reviews.ts` |
| Provenance graph | `src/data/provenance.ts` |
| Assistant contract | `src/data/assistant.ts` |
| Routes | `src/App.tsx` |

The dataset in `src/data/` is one coherent fixture: Payments Platform / Production. Use it as the first contract test. If an API can serve that project and the existing pages render without a mapping layer, the integration matches the prototype.
