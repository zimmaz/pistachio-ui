/** Numeric model versions (`v18`, `v19`). Do not compare these strings lexicographically. */

export function parseModelVersion(value: string): number | null {
  if (typeof value !== 'string') return null
  const match = value.trim().match(/^v(\d+)$/i)
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

/** Negative when `a` is older than `b`. Malformed values sort before valid ones. */
export function compareModelVersions(a: string, b: string): number {
  const left = parseModelVersion(a)
  const right = parseModelVersion(b)
  if (left === null && right === null) return 0
  if (left === null) return -1
  if (right === null) return 1
  return left - right
}

export function isVersionAfter(version: string, than: string): boolean {
  return compareModelVersions(version, than) > 0
}

export function isSameVersion(a: string, b: string): boolean {
  return compareModelVersions(a, b) === 0
}
