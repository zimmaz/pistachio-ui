import type { ModelVersion, ModelSection } from './types'

export const PROJECT = {
  id: 'PRJ-PAY',
  name: 'Payments Platform',
  initials: 'PP',
  environment: 'Production',
  environments: ['Production', 'Staging', 'Sandbox'],
  owner: 'Payments Engineering',
  modelVersion: 'v18',
  previousVersion: 'v17',
  modelStatus: 'Current' as const,
  lastUpdatedLabel: '12 minutes ago',
  lastAnalyzedLabel: '12 minutes ago',
  today: 'Aug 22, 2026',
  evidenceCoverage: 84,
  tagline: 'Continuous threat model',
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
    createdLabel: '12 minutes ago',
    trigger: 'PR #182 — Add payment webhook',
    triggerEvidenceId: 'EV-041',
    publishedBy: 'Architecture Agent · validated by Threat Analysis Agent',
    diff: {
      added: ['Webhook Service (CMP-04)', 'Data flow DF-02 Internet → Webhook Service', 'Data flow DF-07 Webhook Service → Event Queue', 'Threat TM-041', 'Threat TM-046'],
      changed: ['TB-01 crossing count 2 → 3', 'Payment API residual risk Medium → High'],
      removed: [],
    },
  },
  {
    version: 'v17',
    createdLabel: '4 hours ago',
    trigger: 'Architecture Sync — Aug 22',
    triggerEvidenceId: 'EV-040',
    publishedBy: 'Meeting Intelligence Agent · reviewed by Dana Okoye',
    diff: {
      added: ['Assumption ASM-05', 'Assumption ASM-06', 'Threat TM-039'],
      changed: ['Event Worker retry semantics documented', 'PostgreSQL encryption assumption flagged unverified'],
      removed: [],
    },
  },
  {
    version: 'v16',
    createdLabel: '6 hours ago',
    trigger: 'terraform/prod/api.tf',
    triggerEvidenceId: 'EV-038',
    publishedBy: 'Architecture Agent',
    diff: {
      added: ['Control CTRL-31 WAF managed rule set'],
      changed: ['API Gateway TLS policy 1.2 → 1.3', 'Egress allowlist narrowed to 4 CIDRs'],
      removed: ['Legacy NAT route (decommissioned)'],
    },
  },
  {
    version: 'v15',
    createdLabel: 'Yesterday',
    trigger: 'Risk exception EXC-021 approved',
    triggerEvidenceId: 'EV-036',
    publishedBy: 'Dana Okoye',
    diff: {
      added: ['Risk exception EXC-021'],
      changed: ['FIND-064 status Open → Risk accepted'],
      removed: [],
    },
  },
  {
    version: 'v14',
    createdLabel: '3 days ago',
    trigger: 'openapi/payments-v3.yaml',
    triggerEvidenceId: 'EV-034',
    publishedBy: 'Architecture Agent',
    diff: {
      added: ['6 endpoints mapped to Payment API', 'Threat TM-036'],
      changed: ['Payment API authentication documented as OAuth2 client-credentials'],
      removed: [],
    },
  },
]
