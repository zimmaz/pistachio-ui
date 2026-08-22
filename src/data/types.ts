export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type FindingType =
  | 'Threat'
  | 'Control Gap'
  | 'Policy Violation'
  | 'Architecture Change'
  | 'Unverified Assumption'
  | 'Evidence Conflict'
  | 'Risk Increase'

export type FindingStatus =
  | 'Open'
  | 'Needs review'
  | 'Mitigating'
  | 'Pending approval'
  | 'Risk accepted'
  | 'Resolved'
  | 'Invalid'

export type EvidenceType =
  | 'Architecture'
  | 'Code'
  | 'Pull Request'
  | 'Meeting'
  | 'Infrastructure'
  | 'Policy'
  | 'Runtime'

export type EvidenceStatus = 'Analyzed' | 'Needs review' | 'Analyzing' | 'Conflict'

export type ComponentKind = 'actor' | 'service' | 'gateway' | 'store' | 'queue'

export type Exposure = 'Internet-facing' | 'Internal' | 'Data layer' | 'External'

export interface SystemComponent {
  id: string
  name: string
  kind: ComponentKind
  exposure: Exposure
  zone: 'external' | 'edge' | 'application' | 'data'
  authentication: string
  description: string
  dataHandled: string[]
  technologies: string[]
  addedInVersion: string
  /** Grid position within the architecture canvas, in abstract column/row units. */
  x: number
  y: number
}

export interface DataFlow {
  id: string
  from: string
  to: string
  protocol: string
  data: string
  crossesBoundary: string | null
  authenticated: boolean
  addedInVersion: string
  notes?: string
}

export interface TrustBoundary {
  id: string
  name: string
  description: string
  /** Vertical position of the boundary rule on the architecture canvas. */
  y: number
  crossings: string[]
}

export interface Asset {
  id: string
  name: string
  classification: 'Restricted' | 'Confidential' | 'Internal'
  description: string
  storedIn: string[]
  threats: number
}

export interface Threat {
  id: string
  title: string
  category: 'Spoofing' | 'Tampering' | 'Repudiation' | 'Information Disclosure' | 'Denial of Service' | 'Elevation of Privilege'
  target: string
  likelihood: 'Low' | 'Medium' | 'High'
  impact: 'Low' | 'Medium' | 'High'
  residual: Severity
  status: 'Active' | 'Mitigated' | 'Accepted'
  controls: string[]
  findings: string[]
  evidence: string[]
  assumptions?: string[]
  prerequisites?: string[]
  detail?: string
}

export interface Control {
  id: string
  name: string
  family: 'Identity' | 'Network' | 'Data' | 'Detection' | 'Application' | 'Governance'
  status: 'Implemented' | 'Partial' | 'Planned' | 'Not implemented'
  components: string[]
  verifiedBy: string
}

export interface Assumption {
  id: string
  statement: string
  status: 'Verified' | 'Unverified' | 'Contradicted'
  source: string
  owner: string
  relatedThreats: string[]
}

export interface AttackPathStep {
  order: number
  layer: 'Actor' | 'Technique' | 'Component' | 'Privilege' | 'Asset'
  label: string
  detail: string
  entityId?: string
  controls: { id: string; name: string; effective: boolean }[]
}

export interface AttackPath {
  id: string
  name: string
  severity: Severity
  target: string
  likelihood: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'Partially mitigated' | 'Mitigated'
  findings: string[]
  steps: AttackPathStep[]
}

export interface RiskException {
  id: string
  findingId: string
  findingTitle: string
  residual: Severity
  riskOwner: string
  securityApprover: string
  compensatingControls: string[]
  expires: string
  expiresInDays: number
  status: 'Approved' | 'Pending approval' | 'Expired'
  justification: string
  scopeNote?: string
}

export interface Finding {
  id: string
  title: string
  severity: Severity
  type: FindingType
  target: string
  targetId: string
  source: string
  sourceEvidenceId: string
  status: FindingStatus
  detectedAt: string
  detectedLabel: string
  detectedBy: string
  owner: string
  rationale: string
  attackPathId?: string
  mitigation: string
  controls: string[]
  threats: string[]
  evidence: string[]
  exceptionId?: string
}

export interface EvidenceSource {
  id: string
  name: string
  type: EvidenceType
  format: string
  source: string
  author: string
  analyzedAt: string
  analyzedLabel: string
  entityImpact: number
  findings: string[]
  status: EvidenceStatus
  agentId: string
  summary: string
  detectedChanges: string[]
  affectedEntities: string[]
  modelChange: string | null
}

export interface Agent {
  id: string
  name: string
  state: 'Active' | 'Idle' | 'Paused'
  responsibility: string
  inputs: string[]
  lastRunLabel: string
  lastRunTarget: string
  lastRunEvidenceId: string
  modelChanges: number
  findingsGenerated: string[]
  nextTrigger: string
  runsThisWeek: number
  proposalsAwaitingReview: number
}

export interface ActivityEvent {
  id: string
  at: string
  label: string
  text: string
  kind: 'model' | 'finding' | 'evidence' | 'agent' | 'decision'
  refs: { label: string; to: string }[]
  agentId?: string
}

export interface ModelVersion {
  version: string
  createdLabel: string
  trigger: string
  triggerEvidenceId: string
  diff: { added: string[]; changed: string[]; removed: string[] }
  publishedBy: string
}

export interface Notification {
  id: string
  text: string
  detail: string
  tone: 'critical' | 'warning' | 'info'
  to: string
  actionLabel: string
}

export interface ModelSection {
  id: string
  number: string
  title: string
}
