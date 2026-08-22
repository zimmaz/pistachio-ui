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
  | 'In Review'
  | 'Mitigation Planned'
  | 'Mitigating'
  | 'Risk Acceptance Requested'
  | 'Risk Accepted'
  | 'Resolved'
  | 'Invalid'

export type ModelObjectState = 'approved' | 'proposed' | 'removed' | 'superseded'

export type EvidenceType =
  | 'Architecture'
  | 'Code'
  | 'Pull Request'
  | 'Meeting'
  | 'Infrastructure'
  | 'Policy'
  | 'Runtime'

export type EvidenceStatus = 'Analyzed' | 'Needs review' | 'Analyzing' | 'Conflict'

export type EvidenceConfidence = 'High' | 'Moderate' | 'Low' | 'Conflicting' | 'Unverified'

export type ComponentKind = 'actor' | 'service' | 'gateway' | 'store' | 'queue'

export type Exposure = 'Internet-facing' | 'Internal' | 'Data layer' | 'External'

export type ReviewType =
  | 'Model Change'
  | 'New Finding'
  | 'Finding Update'
  | 'Risk Decision'
  | 'Unverified Assumption'
  | 'Evidence Conflict'
  | 'Control Change'

export type ReviewStatus = 'Awaiting Review' | 'Awaiting Clarification' | 'Approved' | 'Rejected'

export type ReviewRevisionState = 'original' | 'edited'

export type ProvenanceKind =
  | 'Evidence'
  | 'Model Entity'
  | 'Assumption'
  | 'Threat'
  | 'Attack Path'
  | 'Control'
  | 'Finding'
  | 'Decision'

export type ModelDeltaOp = 'added' | 'modified' | 'removed'

export type ActivityVerb = 'Observed' | 'Proposed' | 'Approved' | 'Rejected' | 'Waiting'

export type ProvenanceRelation =
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

export type DecisionType = 'Mitigate' | 'Accept Risk' | 'Mark Invalid'

export type RequiredAuthority = 'risk_acceptance' | 'model_publish'

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
  proposedInVersion?: string
  proposalId?: string
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
  proposedInVersion?: string
  proposalId?: string
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
  proposedInVersion?: string
  proposalId?: string
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
  establishedFrom?: string
  contradictedBy?: string
  impactNote?: string
  evidenceIds?: string[]
  relatedPathIds?: string[]
  relatedFindingIds?: string[]
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
  entryPoint?: string
  preconditions?: string[]
  evidence?: string[]
  proposedInVersion?: string
  proposalId?: string
  threatIds?: string[]
}

export interface GovernanceDecision {
  id: string
  type: DecisionType
  findingId: string
  riskOwner?: string
  requestedBy?: string
  approver?: string
  justification: string
  compensatingControls: string[]
  expires?: string
  reviewDate?: string
  status: 'Requested' | 'Approved' | 'Rejected'
  requiredAuthority?: RequiredAuthority
  requiredRole?: string
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
  reviewDate?: string
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
  remediationOwner?: string
  dueDate?: string
  lastConfirmed?: string
  ticket?: string
  confidence?: EvidenceConfidence
  proposedInVersion?: string
  proposalId?: string
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
  usedByThreats?: string[]
  usedByFindings?: string[]
  usedByAssumptions?: string[]
  stale?: boolean
}

export interface AgentAuthority {
  canAnalyze: boolean
  canCreateFindings: 'Yes' | 'Proposed only' | 'No'
  canModifyModel: boolean
  canAcceptRisk: boolean
}

export interface AgentMetrics {
  runs: number
  proposals: number
  accepted: number
  rejected: number
  pending: number
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
  trigger?: string
  authority?: AgentAuthority
  metrics30d?: AgentMetrics
}

export interface ActivityEvent {
  id: string
  at: string
  label: string
  text: string
  kind: 'model' | 'finding' | 'evidence' | 'agent' | 'decision'
  refs: { label: string; to: string }[]
  agentId?: string
  verb?: ActivityVerb
}

export interface ModelVersion {
  version: string
  createdLabel: string
  createdAt?: string
  trigger: string
  triggerEvidenceId: string
  diff: { added: string[]; changed: string[]; removed: string[] }
  publishedBy: string
  status?: 'Current' | 'Proposed' | 'Historical'
}

export interface ModelComparison {
  from: string
  to: string
  architecture: string[]
  threatsAdded: number
  threatsRemoved: number
  controlsAdded: number
  resolvedFindings: number
  newFindings: number
  riskFrom: string
  riskTo: string
}

export interface Notification {
  id: string
  text: string
  detail: string
  tone: 'critical' | 'warning' | 'info'
  to: string
  actionLabel: string
}

export interface FindingDecision {
  status: FindingStatus
  note: string
}

export interface ModelSection {
  id: string
  number: string
  title: string
}

export interface ProvenanceNode {
  id: string
  kind: ProvenanceKind
  title: string
  subtitle?: string
  relationToNext?: ProvenanceRelation
}

export interface ProvenanceEdge {
  sourceId: string
  targetId: string
  relation: ProvenanceRelation
}

export interface EntityProvenance {
  id: string
  introducedBy?: string
  confirmedBy?: string
  modifiedBy?: string
  lastVerified?: string
  supportingEvidence: string[]
  conflictingEvidence: string[]
  unverifiedClaims: number
}

export interface ModelChangeItem {
  op: ModelDeltaOp
  group: 'Architecture' | 'Threats' | 'Findings' | 'Trust boundaries' | 'Controls' | 'Assumptions'
  id?: string
  label: string
}

export interface ReviewClarification {
  question: string
  requestedFrom: string
  requestedBy: string
}

export interface Review {
  id: string
  type: ReviewType
  title: string
  summary: string
  status: ReviewStatus
  revision?: ReviewRevisionState
  proposedByAgentId: string
  sourceEvidenceId: string
  detectedLabel: string
  detectedAt: string
  securityImpact: string
  riskFrom?: string
  riskTo?: string
  affectedAssets?: string[]
  attackPathDelta?: string
  rationale: string
  evidenceIds: string[]
  requiredAuthority?: RequiredAuthority
  requiredRole?: string
  decisionId?: string
  clarification?: ReviewClarification
  findingIds: string[]
  changeIds?: string[]
  changes: ModelChangeItem[]
  why: string
  provenance?: ProvenanceNode[]
  producesVersion?: string
}
