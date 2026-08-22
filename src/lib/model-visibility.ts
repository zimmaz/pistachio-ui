import type { ModelObjectState } from '@/data/types'

type Versioned = {
  addedInVersion?: string
  proposedInVersion?: string
  proposalId?: string
}

export function isProposedFor(object: Versioned, currentVersion: string) {
  return Boolean(object.proposedInVersion && object.proposedInVersion > currentVersion)
}

export function objectState(object: Versioned, currentVersion: string): ModelObjectState {
  if (isProposedFor(object, currentVersion)) return 'proposed'
  return 'approved'
}

export function isAuthoritative(object: Versioned, currentVersion: string) {
  return objectState(object, currentVersion) === 'approved'
}

export function visibleObjects<T extends Versioned>(items: T[], currentVersion: string, showProposed: boolean) {
  return items.filter((item) => showProposed || isAuthoritative(item, currentVersion))
}

export const REVIEW_LABEL: Record<string, string> = {
  'Awaiting Review': 'Awaiting Review',
  'Awaiting Clarification': 'Awaiting Clarification',
  Approved: 'Approved',
  Rejected: 'Rejected',
}

export const RELATION_LABEL: Record<string, string> = {
  supports: 'supports',
  contradicts: 'contradicts',
  establishes: 'establishes',
  derived_from: 'derived from',
  introduced_by: 'introduced by',
  modified_by: 'modified by',
  affects: 'affects',
  motivates: 'motivates',
  verifies: 'verifies',
  invalidates: 'invalidates',
  participates_in: 'participates in',
}
