import type { EntityProvenance, EvidenceConfidence, ProvenanceNode } from './types'

export const PROVENANCE_CHAINS: Record<string, ProvenanceNode[]> = {
  'FIND-107': [
    { id: 'EV-041', kind: 'Evidence', title: 'PR #182', subtitle: 'GitHub pull request' },
    { id: 'CMP-04', kind: 'Model Entity', title: 'POST /webhooks/acquirer detected', subtitle: 'Webhook Service' },
    { id: 'TB-01', kind: 'Model Entity', title: 'Crosses TB-01', subtitle: 'Internet → Production' },
    { id: 'TM-041', kind: 'Threat', title: 'TM-041', subtitle: 'Replay attack' },
    { id: 'FIND-107', kind: 'Finding', title: 'FIND-107', subtitle: 'Missing replay protection' },
  ],
  'FIND-109': [
    { id: 'EV-041', kind: 'Evidence', title: 'PR #182', subtitle: 'GitHub pull request' },
    { id: 'CMP-04', kind: 'Model Entity', title: 'Webhook Service', subtitle: 'Proposed architecture entity' },
    { id: 'TM-048', kind: 'Threat', title: 'TM-048', subtitle: 'Forged webhook event' },
    { id: 'FIND-109', kind: 'Finding', title: 'FIND-109', subtitle: 'Signature validation not demonstrated' },
  ],
  'FIND-112': [
    { id: 'EV-045', kind: 'Evidence', title: 'Architecture Sync — Aug 20', subtitle: 'Meeting transcript' },
    { id: 'ASM-012', kind: 'Assumption', title: 'ASM-012', subtitle: 'Approved producers only' },
    { id: 'EV-044', kind: 'Evidence', title: 'terraform/prod/sqs.tf', subtitle: 'Wildcard producer permission' },
    { id: 'FIND-112', kind: 'Finding', title: 'FIND-112', subtitle: 'Excessive queue producer permissions' },
    { id: 'AP-021', kind: 'Attack Path', title: 'AP-021', subtitle: 'Compromised developer → Production' },
  ],
  'FIND-103': [
    { id: 'EV-030', kind: 'Evidence', title: 'SEC-IAM-22', subtitle: 'Identity standard' },
    { id: 'CMP-03', kind: 'Model Entity', title: 'Payment API /admin', subtitle: 'Privileged route' },
    { id: 'TM-003', kind: 'Threat', title: 'TM-003', subtitle: 'Privileged configuration change' },
    { id: 'FIND-103', kind: 'Finding', title: 'FIND-103', subtitle: 'Admin endpoint lacks phishing-resistant MFA' },
  ],
  'REV-021': [
    { id: 'EV-041', kind: 'Evidence', title: 'PR #182', subtitle: 'GitHub pull request' },
    { id: 'CMP-04', kind: 'Model Entity', title: 'Webhook Service detected', subtitle: 'Proposed entity' },
    { id: 'TB-01', kind: 'Model Entity', title: 'External trust-boundary crossing', subtitle: 'TB-01' },
    { id: 'TM-041', kind: 'Threat', title: 'TM-041', subtitle: 'Replay attack' },
    { id: 'FIND-107', kind: 'Finding', title: 'FIND-107', subtitle: 'Missing replay protection' },
  ],
  'ASM-012': [
    { id: 'EV-045', kind: 'Evidence', title: 'Architecture Sync — Aug 20', subtitle: 'Meeting transcript' },
    { id: 'ASM-012', kind: 'Assumption', title: 'ASM-012', subtitle: 'Approved producers only' },
    { id: 'EV-044', kind: 'Evidence', title: 'terraform/prod/sqs.tf', subtitle: 'Contradicting infrastructure' },
    { id: 'FIND-112', kind: 'Finding', title: 'FIND-112', subtitle: 'Excessive queue producer permissions' },
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
  'CMP-00': {
    id: 'CMP-00',
    introducedBy: 'EV-041',
    confirmedBy: 'EV-006',
    lastVerified: '12 minutes ago',
    supportingEvidence: ['EV-041', 'EV-006'],
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
    entities: ['CMP-04', 'CMP-00', 'DF-02', 'DF-07'],
    threats: ['TM-041', 'TM-048'],
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
