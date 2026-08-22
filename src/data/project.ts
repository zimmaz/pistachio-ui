import type { ModelComparison, ModelSection, ModelVersion } from './types'

export const PROJECT = {
  id: 'PRJ-PAY',
  name: 'Payments Platform',
  initials: 'PP',
  environment: 'Production',
  environments: ['Production', 'Staging', 'Sandbox'],
  owner: 'Payments Engineering',
  modelVersion: 'v18',
  previousVersion: 'v17',
  proposedVersion: 'v19',
  modelStatus: 'Current' as const,
  lastUpdatedLabel: '2 hours ago',
  lastAnalyzedLabel: '12 minutes ago',
  today: 'Aug 22, 2026',
  evidenceCoverage: 84,
  architectureCoverage: 92,
  controlVerification: 76,
  evidenceFreshness: 'Good' as const,
  staleEvidence: 4,
  tagline: 'Continuous threat-model management',
} as const

export const OTHER_PROJECTS = [
  { id: 'PRJ-PAY', name: 'Payments Platform', environment: 'Production', modelVersion: 'v18', findings: 12 },
  { id: 'PRJ-IDN', name: 'Identity Service', environment: 'Production', modelVersion: 'v31', findings: 4 },
  { id: 'PRJ-LDG', name: 'Ledger Core', environment: 'Production', modelVersion: 'v9', findings: 7 },
  { id: 'PRJ-MER', name: 'Merchant Portal', environment: 'Staging', modelVersion: 'v3', findings: 2 },
]

export const CURRENT_USER = {
  name: 'Dana Okoye',
  initials: 'DO',
  role: 'Security Architect',
  team: 'AppSec',
}

export const MODEL_SECTIONS: ModelSection[] = [
  { id: 'system-overview', number: '1', title: 'System Overview' },
  { id: 'architecture', number: '2', title: 'Architecture' },
  { id: 'assets', number: '3', title: 'Assets' },
  { id: 'trust-boundaries', number: '4', title: 'Trust Boundaries' },
  { id: 'data-flows', number: '5', title: 'Data Flows' },
  { id: 'threats', number: '6', title: 'Threats' },
  { id: 'attack-paths', number: '7', title: 'Attack Paths' },
  { id: 'controls', number: '8', title: 'Security Controls' },
  { id: 'assumptions', number: '9', title: 'Assumptions' },
  { id: 'risks', number: '10', title: 'Risks & Decisions' },
]

export const MODEL_VERSIONS: ModelVersion[] = [
  {
    version: 'v18',
    createdLabel: 'Aug 22 12:07',
    createdAt: '2026-08-22T10:07:00Z',
    trigger: 'architecture-v4.drawio reconciled',
    triggerEvidenceId: 'EV-039',
    publishedBy: 'Dana Okoye',
    status: 'Current',
    diff: {
      added: ['Event Worker ownership documented', 'Control CTRL-33 drift detection bound to worker.tf'],
      changed: ['TB-01 crossings confirmed against the current diagram', 'FIND-093 raised as an evidence conflict'],
      removed: [],
    },
  },
  {
    version: 'v17',
    createdLabel: 'Aug 21 16:42',
    createdAt: '2026-08-21T16:42:00Z',
    trigger: 'Architecture Sync — Aug 22',
    triggerEvidenceId: 'EV-040',
    publishedBy: 'Dana Okoye',
    status: 'Historical',
    diff: {
      added: ['Assumption ASM-05', 'Assumption ASM-06', 'Threat TM-039'],
      changed: ['Event Worker retry semantics documented', 'PostgreSQL encryption assumption flagged unverified'],
      removed: [],
    },
  },
  {
    version: 'v16',
    createdLabel: 'Aug 20 09:18',
    createdAt: '2026-08-20T09:18:00Z',
    trigger: 'terraform/prod/api.tf',
    triggerEvidenceId: 'EV-038',
    publishedBy: 'Dana Okoye',
    status: 'Historical',
    diff: {
      added: ['Control CTRL-31 WAF managed rule set'],
      changed: ['API Gateway TLS policy 1.2 → 1.3', 'Egress allowlist narrowed to 4 CIDRs'],
      removed: ['Legacy NAT route (decommissioned)'],
    },
  },
  {
    version: 'v15',
    createdLabel: 'Aug 18 14:03',
    createdAt: '2026-08-18T14:03:00Z',
    trigger: 'Risk exception EXC-021 approved',
    triggerEvidenceId: 'EV-036',
    publishedBy: 'Dana Okoye',
    status: 'Historical',
    diff: {
      added: ['Risk exception EXC-021'],
      changed: ['FIND-064 status Open → Risk accepted'],
      removed: [],
    },
  },
]

export const PROPOSED_VERSION: ModelVersion = {
  version: 'v19',
  createdLabel: '12 minutes ago',
  createdAt: '2026-08-22T12:05:00Z',
  trigger: 'PR #182 — Add acquirer payment webhook',
  triggerEvidenceId: 'EV-041',
  publishedBy: 'Proposed by PR Review Agent · awaiting human approval',
  status: 'Proposed',
  diff: {
    added: [
      'Webhook Service (CMP-04)',
      'Data flow DF-02 Internet → Webhook Service',
      'Data flow DF-07 Webhook Service → Event Queue',
      'Threat TM-047 Replay attack',
      'Threat TM-048 Forged webhook event',
    ],
    changed: ['TB-01 crossing count 2 → 3', 'Risk posture Medium → High'],
    removed: [],
  },
}

export const MODEL_COMPARISONS: ModelComparison[] = [
  {
    from: 'v17',
    to: 'v18',
    architecture: ['~ Event Worker egress documented against worker.tf'],
    threatsAdded: 3,
    threatsRemoved: 1,
    controlsAdded: 2,
    resolvedFindings: 2,
    newFindings: 3,
    riskFrom: 'Medium',
    riskTo: 'Medium',
  },
]

export const MODEL_HEALTH = {
  evidenceFreshness: 'Good' as const,
  architectureCoverage: 92,
  controlVerification: 76,
  unverifiedAssumptions: 3,
  contradictedAssumptions: 3,
  staleEvidence: 4,
  pendingModelChanges: 3,
}
