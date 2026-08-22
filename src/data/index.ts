import { AGENTS, AGENT_ACTIVITY } from './agents'
import { MODEL_ACTIVITY, NOTIFICATIONS } from './activity'
import { EVIDENCE, EVIDENCE_SOURCES, EVIDENCE_TYPES } from './evidence'
import { FINDINGS, FINDING_STATUSES, FINDING_TYPES, OPEN_STATUSES } from './findings'
import {
  ASSETS,
  ASSUMPTIONS,
  ATTACK_PATHS,
  COMPONENTS,
  CONTROLS,
  DATA_FLOWS,
  RISK_EXCEPTIONS,
  THREATS,
  TRUST_BOUNDARIES,
} from './model'
import { CURRENT_USER, MODEL_COMPARISONS, MODEL_HEALTH, MODEL_SECTIONS, MODEL_VERSIONS, OTHER_PROJECTS, PROJECT, PROPOSED_VERSION } from './project'
import { ENTITY_PROVENANCE, FINDING_CONFIDENCE, EVIDENCE_USED_BY, provenanceFor } from './provenance'
import { REVIEWS, REVIEW_TYPES } from './reviews'
import type { Finding, Severity } from './types'

export * from './types'
export {
  AGENTS,
  AGENT_ACTIVITY,
  ASSETS,
  ASSUMPTIONS,
  ATTACK_PATHS,
  COMPONENTS,
  CONTROLS,
  CURRENT_USER,
  DATA_FLOWS,
  ENTITY_PROVENANCE,
  EVIDENCE,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
  EVIDENCE_USED_BY,
  FINDINGS,
  FINDING_CONFIDENCE,
  FINDING_STATUSES,
  FINDING_TYPES,
  MODEL_ACTIVITY,
  MODEL_COMPARISONS,
  MODEL_HEALTH,
  MODEL_SECTIONS,
  MODEL_VERSIONS,
  NOTIFICATIONS,
  OPEN_STATUSES,
  OTHER_PROJECTS,
  PROJECT,
  PROPOSED_VERSION,
  REVIEWS,
  REVIEW_TYPES,
  RISK_EXCEPTIONS,
  THREATS,
  TRUST_BOUNDARIES,
  provenanceFor,
}

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
}

export const isOpen = (f: Finding) => (OPEN_STATUSES as string[]).includes(f.status)

export const OPEN_FINDINGS = FINDINGS.filter(isOpen)

const countBySeverity = (items: { severity?: Severity; residual?: Severity }[]) => {
  const base: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  for (const item of items) {
    const key = item.severity ?? item.residual
    if (key) base[key] += 1
  }
  return base
}

export const OPEN_BY_SEVERITY = countBySeverity(OPEN_FINDINGS)
export const THREATS_BY_RESIDUAL = countBySeverity(THREATS)

const highestOpen = SEVERITY_ORDER.find((s) => OPEN_BY_SEVERITY[s] > 0) ?? 'low'

/** Posture is the highest open severity, escalated when several criticals stack. */
export const RISK_POSTURE: { label: string; severity: Severity; note: string } = {
  label: OPEN_BY_SEVERITY.critical >= 2 ? 'High' : SEVERITY_LABEL[highestOpen],
  severity: OPEN_BY_SEVERITY.critical >= 2 ? 'high' : highestOpen,
  note: `${OPEN_BY_SEVERITY.critical} critical · ${OPEN_BY_SEVERITY.high} high open`,
}

export const PROPOSED_COMPONENT_IDS = COMPONENTS.filter((c) => c.proposedInVersion === 'v19').map((c) => c.id)
export const PROPOSED_FLOW_IDS = DATA_FLOWS.filter((f) => f.proposedInVersion === 'v19').map((f) => f.id)
export const MODIFIED_FOR_PROPOSAL = ['TB-01', 'CMP-05']

export const STALE_EVIDENCE = EVIDENCE.filter((item) => {
  if (item.stale) return true
  const days = Number((item.analyzedLabel.match(/(\d+)d/) ?? [])[1] ?? 0)
  return days >= 20
})

export const METRICS = {
  openFindings: OPEN_FINDINGS.length,
  criticalFindings: OPEN_BY_SEVERITY.critical,
  activeThreats: THREATS.filter((t) => t.status === 'Active').length,
  controls: CONTROLS.length,
  controlsImplemented: CONTROLS.filter((c) => c.status === 'Implemented').length,
  evidenceSources: EVIDENCE.length,
  evidenceCoverage: PROJECT.evidenceCoverage,
  components: COMPONENTS.length,
  dataFlows: DATA_FLOWS.length,
  attackPaths: ATTACK_PATHS.length,
  unverifiedAssumptions: ASSUMPTIONS.filter((a) => a.status === 'Unverified').length,
  contradictedAssumptions: ASSUMPTIONS.filter((a) => a.status === 'Contradicted').length,
  needsReview: FINDINGS.filter((f) => f.status === 'Needs review' || f.status === 'In Review').length,
  pendingReviews: REVIEWS.filter((r) => r.status === 'Pending').length,
  pendingModelChanges: REVIEWS.filter((r) => r.type === 'Model Change' && r.status === 'Pending').length,
  activeAgents: AGENTS.filter((a) => a.state === 'Active').length,
  boundaryCrossings: DATA_FLOWS.filter((f) => f.crossesBoundary).length,
  acceptedRisks: RISK_EXCEPTIONS.filter((e) => e.status === 'Approved').length,
  staleEvidence: STALE_EVIDENCE.length,
}

/* ── Lookups ───────────────────────────────────────────────────────────── */

const index = <T extends { id: string }>(items: T[]) => new Map(items.map((i) => [i.id, i]))

export const componentById = index(COMPONENTS)
export const threatById = index(THREATS)
export const controlById = index(CONTROLS)
export const findingById = index(FINDINGS)
export const evidenceById = index(EVIDENCE)
export const agentById = index(AGENTS)
export const assetById = index(ASSETS)
export const assumptionById = index(ASSUMPTIONS)
export const boundaryById = index(TRUST_BOUNDARIES)
export const attackPathById = index(ATTACK_PATHS)
export const exceptionById = index(RISK_EXCEPTIONS)
export const flowById = index(DATA_FLOWS)
export const reviewById = index(REVIEWS)

/** Human name for any entity id used in prose, tables and assistant answers. */
export function entityLabel(id: string): string {
  return (
    componentById.get(id)?.name ??
    assetById.get(id)?.name ??
    boundaryById.get(id)?.name ??
    threatById.get(id)?.title ??
    controlById.get(id)?.name ??
    findingById.get(id)?.title ??
    evidenceById.get(id)?.name ??
    agentById.get(id)?.name ??
    attackPathById.get(id)?.name ??
    exceptionById.get(id)?.findingTitle ??
    assumptionById.get(id)?.statement ??
    flowById.get(id)?.data ??
    reviewById.get(id)?.title ??
    id
  )
}

/** Where a reference to an entity id should navigate. */
export function entityRoute(id: string): string {
  if (reviewById.has(id)) return `/overview?review=${id}`
  if (findingById.has(id)) return `/findings?id=${id}`
  if (evidenceById.has(id)) return `/evidence?id=${id}`
  if (componentById.has(id)) return `/model?entity=${id}&view=architecture`
  if (threatById.has(id)) return `/model?entity=${id}&view=document#threats`
  if (controlById.has(id)) return '/model?view=document#controls'
  if (assetById.has(id)) return '/model?view=document#assets'
  if (boundaryById.has(id)) return '/model?view=document#trust-boundaries'
  if (assumptionById.has(id)) return '/model?view=document#assumptions'
  if (exceptionById.has(id)) return '/model?view=document#risks'
  if (attackPathById.has(id)) return `/model?path=${id}&view=paths`
  if (flowById.has(id)) return '/model?view=document#data-flows'
  if (agentById.has(id)) return `/agents?id=${id}`
  return '/overview'
}

/** Findings ranked for the Overview "Needs attention" list. */
export const ATTENTION_FINDINGS = [...OPEN_FINDINGS]
  .sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    if (bySeverity !== 0) return bySeverity
    return b.detectedAt.localeCompare(a.detectedAt)
  })
  .slice(0, 5)

export const CURRENT_VERSION = MODEL_VERSIONS[0]
export const PREVIOUS_VERSION = MODEL_VERSIONS[1]

export const REVIEW_BREAKDOWN = {
  'Model Change': REVIEWS.filter((r) => r.type === 'Model Change').length,
  Findings: REVIEWS.filter((r) => r.type === 'New Finding' || r.type === 'Finding Update').length,
  'Risk Decision': REVIEWS.filter((r) => r.type === 'Risk Decision').length,
  Assumption: REVIEWS.filter((r) => r.type === 'Unverified Assumption' || r.type === 'Evidence Conflict').length,
}

export const SEARCHABLE = [
  ...REVIEWS.map((r) => ({ id: r.id, title: r.title, group: 'Review', to: `/overview?review=${r.id}` })),
  ...FINDINGS.map((f) => ({ id: f.id, title: f.title, group: 'Finding', to: `/findings?id=${f.id}` })),
  ...THREATS.map((t) => ({ id: t.id, title: t.title, group: 'Threat', to: `/model?entity=${t.id}&view=document#threats` })),
  ...COMPONENTS.map((c) => ({ id: c.id, title: c.name, group: 'Component', to: `/model?entity=${c.id}&view=architecture` })),
  ...EVIDENCE.map((e) => ({ id: e.id, title: e.name, group: 'Evidence', to: `/evidence?id=${e.id}` })),
  ...CONTROLS.map((c) => ({ id: c.id, title: c.name, group: 'Control', to: '/model?view=document#controls' })),
  ...ATTACK_PATHS.map((p) => ({ id: p.id, title: p.name, group: 'Attack path', to: `/model?path=${p.id}&view=paths` })),
  ...ASSETS.map((a) => ({ id: a.id, title: a.name, group: 'Asset', to: '/model?view=document#assets' })),
  ...ASSUMPTIONS.map((a) => ({ id: a.id, title: a.statement, group: 'Assumption', to: '/model?view=document#assumptions' })),
  ...RISK_EXCEPTIONS.map((e) => ({ id: e.id, title: e.findingTitle, group: 'Risk decision', to: '/model?view=document#risks' })),
  ...AGENTS.map((a) => ({ id: a.id, title: a.name, group: 'Agent', to: `/agents?id=${a.id}` })),
]
