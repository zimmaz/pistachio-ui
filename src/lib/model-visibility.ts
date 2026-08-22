import type { ModelObjectState } from '@/data/types'
import { isVersionAfter } from './model-version'

export type Versioned = {
  addedInVersion?: string
  proposedInVersion?: string
  proposalId?: string
}

export function isProposedForVersion(object: Versioned, currentVersion: string) {
  return Boolean(object.proposedInVersion && isVersionAfter(object.proposedInVersion, currentVersion))
}

/** @deprecated Use isProposedForVersion */
export const isProposedFor = isProposedForVersion

export function isApprovedForVersion(object: Versioned, currentVersion: string) {
  return !isProposedForVersion(object, currentVersion)
}

export function objectState(object: Versioned, currentVersion: string): ModelObjectState {
  if (isProposedForVersion(object, currentVersion)) return 'proposed'
  return 'approved'
}

export function isAuthoritative(object: Versioned, currentVersion: string) {
  return objectState(object, currentVersion) === 'approved'
}

export function isModelObjectVisible(object: Versioned, currentVersion: string, showProposed: boolean) {
  return showProposed || isApprovedForVersion(object, currentVersion)
}

export function visibleObjects<T extends Versioned>(items: T[], currentVersion: string, showProposed: boolean) {
  return items.filter((item) => isModelObjectVisible(item, currentVersion, showProposed))
}

/**
 * Hide nested ids that resolve to proposed objects when the authoritative model is showing.
 * Unknown ids are dropped so a proposed flow cannot leak through a stale crossing list.
 */
export function filterVisibleRelations(
  ids: readonly string[],
  resolve: (id: string) => Versioned | undefined,
  currentVersion: string,
  showProposed: boolean,
): string[] {
  return ids.filter((id) => {
    const related = resolve(id)
    if (!related) return false
    return isModelObjectVisible(related, currentVersion, showProposed)
  })
}

export function visibleRelated<T extends Versioned>(
  items: T[],
  currentVersion: string,
  showProposed: boolean,
): T[] {
  return visibleObjects(items, currentVersion, showProposed)
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
