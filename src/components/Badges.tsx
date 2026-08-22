import { SEVERITY_LABEL, type Severity } from '@/data'

/**
 * Severity is carried by three signals at once — a shape, an uppercase word
 * and a hue — so it never depends on colour alone.
 */
export function SeverityBadge({
  severity,
  bare = false,
  label,
}: {
  severity: Severity
  bare?: boolean
  label?: string
}) {
  return (
    <span className={`sev sev--${severity}${bare ? ' sev--bare' : ''}`}>
      <span className="sev__glyph" aria-hidden="true" />
      {label ?? SEVERITY_LABEL[severity]}
    </span>
  )
}

type Tone = 'success' | 'warning' | 'info' | 'danger' | 'neutral'

const STATUS_TONE: Record<string, Tone> = {
  Open: 'danger',
  'Needs review': 'warning',
  Mitigating: 'info',
  'Risk accepted': 'neutral',
  Resolved: 'success',
  Invalid: 'neutral',
  Analyzed: 'success',
  Analyzing: 'info',
  Conflict: 'warning',
  Active: 'success',
  Idle: 'neutral',
  Paused: 'warning',
  Current: 'success',
  Approved: 'success',
  'Pending approval': 'warning',
  Expired: 'danger',
  Implemented: 'success',
  Partial: 'warning',
  Planned: 'info',
  'Not implemented': 'danger',
  Verified: 'success',
  Unverified: 'warning',
  Contradicted: 'danger',
  Mitigated: 'success',
  Accepted: 'neutral',
  'Partially mitigated': 'warning',
}

/** Status is a dot plus a word; the dot is hollow when nothing is settled. */
export function StatusBadge({ status, hollow }: { status: string; hollow?: boolean }) {
  const tone = STATUS_TONE[status] ?? 'neutral'
  const isHollow = hollow ?? tone === 'neutral'
  return (
    <span className={`status status--${tone}${isHollow ? ' status--hollow' : ''}`}>
      <span className="status__dot" aria-hidden="true" />
      {status}
    </span>
  )
}

export function Chip({ children, mono = false }: { children: React.ReactNode; mono?: boolean }) {
  return <span className={`chip${mono ? ' chip--mono' : ''}`}>{children}</span>
}
