import type { EntityProvenance, EvidenceConfidence, ProvenanceEdge, ProvenanceNode } from './types'

export const PROVENANCE_RELATIONS: ProvenanceEdge[] = [
  { sourceId: 'EV-041', targetId: 'CMP-04', relation: 'introduced_by' },
  { sourceId: 'EV-041', targetId: 'DF-02', relation: 'introduced_by' },
  { sourceId: 'EV-041', targetId: 'DF-07', relation: 'introduced_by' },
  { sourceId: 'EV-041', targetId: 'TM-047', relation: 'supports' },
  { sourceId: 'EV-041', targetId: 'TM-048', relation: 'supports' },
  { sourceId: 'EV-041', targetId: 'FIND-107', relation: 'supports' },
  { sourceId: 'EV-041', targetId: 'FIND-109', relation: 'supports' },
  { sourceId: 'CMP-04', targetId: 'TB-01', relation: 'affects' },
  { sourceId: 'TB-01', targetId: 'TM-047', relation: 'motivates' },
  { sourceId: 'TM-047', targetId: 'FIND-107', relation: 'motivates' },
  { sourceId: 'TM-047', targetId: 'AP-03', relation: 'participates_in' },
  { sourceId: 'TM-048', targetId: 'FIND-109', relation: 'motivates' },
  { sourceId: 'EV-045', targetId: 'ASM-012', relation: 'establishes' },
  { sourceId: 'EV-044', targetId: 'ASM-012', relation: 'contradicts' },
  { sourceId: 'ASM-012', targetId: 'TM-049', relation: 'affects' },
  { sourceId: 'TM-049', targetId: 'AP-021', relation: 'participates_in' },
  { sourceId: 'EV-044', targetId: 'FIND-112', relation: 'supports' },
  { sourceId: 'EV-030', targetId: 'TM-003', relation: 'supports' },
  { sourceId: 'TM-003', targetId: 'FIND-103', relation: 'motivates' },
  { sourceId: 'FIND-103', targetId: 'EXC-021', relation: 'motivates' },
]

export const PROVENANCE_CHAINS: Record<string, ProvenanceNode[]> = {
  'FIND-107': [
    { id: 'EV-041', kind: 'Evidence', title: 'PR #182', subtitle: 'GitHub pull request', relationToNext: 'introduced_by' },
    { id: 'CMP-04', kind: 'Model Entity', title: 'Webhook Service', subtitle: 'Proposed architecture entity', relationToNext: 'motivates' },
    { id: 'TM-047', kind: 'Threat', title: 'TM-047', subtitle: 'Replay attack', relationToNext: 'motivates' },
    { id: 'FIND-107', kind: 'Finding', title: 'FIND-107', subtitle: 'Missing replay protection' },
  ],
  'FIND-109': [
    { id: 'EV-041', kind: 'Evidence', title: 'PR #182', subtitle: 'GitHub pull request', relationToNext: 'supports' },
    { id: 'TM-048', kind: 'Threat', title: 'TM-048', subtitle: 'Forged webhook event', relationToNext: 'motivates' },
    { id: 'FIND-109', kind: 'Finding', title: 'FIND-109', subtitle: 'Signature validation not demonstrated' },
  ],
  'FIND-112': [
    { id: 'EV-044', kind: 'Evidence', title: 'terraform/prod/sqs.tf', subtitle: 'Infrastructure', relationToNext: 'contradicts' },
    { id: 'ASM-012', kind: 'Assumption', title: 'ASM-012', subtitle: 'Approved producers only', relationToNext: 'affects' },
    { id: 'TM-049', kind: 'Threat', title: 'TM-049', subtitle: 'Unauthenticated queue producer', relationToNext: 'participates_in' },
    { id: 'AP-021', kind: 'Attack Path', title: 'AP-021', subtitle: 'Compromised developer → Production' },
  ],
  'FIND-112-support': [
    { id: 'EV-044', kind: 'Evidence', title: 'terraform/prod/sqs.tf', subtitle: 'Infrastructure', relationToNext: 'supports' },
    { id: 'FIND-112', kind: 'Finding', title: 'FIND-112', subtitle: 'Excessive queue producer permissions' },
  ],
  'FIND-103': [
    { id: 'EV-030', kind: 'Evidence', title: 'SEC-IAM-22', subtitle: 'Identity standard', relationToNext: 'supports' },
    { id: 'TM-003', kind: 'Threat', title: 'TM-003', subtitle: 'Privileged configuration change', relationToNext: 'motivates' },
    { id: 'FIND-103', kind: 'Finding', title: 'FIND-103', subtitle: 'Admin endpoint lacks phishing-resistant MFA', relationToNext: 'motivates' },
    { id: 'EXC-021', kind: 'Decision', title: 'EXC-021', subtitle: 'Temporary risk acceptance' },
  ],
  'REV-021': [
    { id: 'EV-041', kind: 'Evidence', title: 'PR #182', subtitle: 'GitHub pull request', relationToNext: 'introduced_by' },
    { id: 'CMP-04', kind: 'Model Entity', title: 'Webhook Service', subtitle: 'Proposed entity', relationToNext: 'motivates' },
    { id: 'TM-047', kind: 'Threat', title: 'TM-047', subtitle: 'Replay attack' },
  ],
  'ASM-012': [
    { id: 'EV-045', kind: 'Evidence', title: 'Architecture Sync — Aug 20', subtitle: 'establishes', relationToNext: 'establishes' },
    { id: 'ASM-012', kind: 'Assumption', title: 'ASM-012', subtitle: 'Approved producers only', relationToNext: 'contradicts' },
    { id: 'EV-044', kind: 'Evidence', title: 'terraform/prod/sqs.tf', subtitle: 'contradicts' },
  ],
}

export const ENTITY_PROVENANCE: Record<string, EntityProvenance> = {
  'CMP-04': {
    id: 'CMP-04',
    introducedBy: 'EV-041',
    confirmedBy: 'EV-039',
    modifiedBy: 'EV-038',
    lastVerified: '12 minutes ago',
    supportingEvidence: ['EV-041', 'EV-039', 'EV-006', 'EV-010'],
    conflictingEvidence: [],
    unverifiedClaims: 1,
  },
  'CMP-05': {
    id: 'CMP-05',
    introducedBy: 'EV-013',
    confirmedBy: 'EV-037',
    modifiedBy: 'EV-044',
    lastVerified: '2 days ago',
    supportingEvidence: ['EV-037', 'EV-013', 'EV-022'],
    conflictingEvidence: ['EV-044'],
    unverifiedClaims: 0,
  },
  'CMP-03': {
    id: 'CMP-03',
    introducedBy: 'EV-001',
    confirmedBy: 'EV-039',
    modifiedBy: 'EV-034',
    lastVerified: '2 hours ago',
    supportingEvidence: ['EV-001', 'EV-039', 'EV-034', 'EV-026'],
    conflictingEvidence: [],
    unverifiedClaims: 0,
  },
}

export const FINDING_CONFIDENCE: Record<string, EvidenceConfidence> = {
  'FIND-107': 'High',
  'FIND-109': 'Moderate',
  'FIND-112': 'High',
  'FIND-103': 'High',
  'FIND-102': 'High',
  'FIND-098': 'Moderate',
  'FIND-093': 'Conflicting',
  'FIND-094': 'Unverified',
}

export const EVIDENCE_USED_BY: Record<
  string,
  { entities: string[]; threats: string[]; findings: string[]; versions: string }
> = {
  'EV-041': {
    entities: ['CMP-04', 'DF-02', 'DF-07'],
    threats: ['TM-047', 'TM-048'],
    findings: ['FIND-107', 'FIND-109'],
    versions: 'v18 → proposed v19',
  },
  'EV-044': {
    entities: ['CMP-05'],
    threats: ['TM-049'],
    findings: ['FIND-112'],
    versions: 'v18 (assumption ASM-012 contradicted)',
  },
  'EV-045': {
    entities: ['CMP-05'],
    threats: ['TM-049'],
    findings: ['FIND-112'],
    versions: 'v17 recorded ASM-012',
  },
}

export function provenanceFor(id: string): ProvenanceNode[] {
  return PROVENANCE_CHAINS[id] ?? []
}

export function relationsFor(id: string): ProvenanceEdge[] {
  return PROVENANCE_RELATIONS.filter((edge) => edge.sourceId === id || edge.targetId === id)
}
