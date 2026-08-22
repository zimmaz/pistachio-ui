import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Severity } from '@/data'

export interface MetricProps {
  label: string
  value: ReactNode
  note?: string
  tone?: Severity | 'brand' | 'plain'
  emphasis?: boolean
  to?: string
}

/**
 * One cell of the posture strip. Emphasis is carried by size and weight
 * rather than by giving every metric its own card.
 */
export function Metric({ label, value, note, tone = 'plain', emphasis = false, to }: MetricProps) {
  const body = (
    <>
      <span className="metric__label">{label}</span>
      <span className={`metric__value metric__value--${tone}${emphasis ? ' is-emphasis' : ''}`}>{value}</span>
      {note ? <span className="metric__note">{note}</span> : null}
    </>
  )

  if (to) {
    return (
      <Link className="metric metric--link" to={to}>
        {body}
      </Link>
    )
  }
  return <div className="metric">{body}</div>
}

export function MetricStrip({ children }: { children: ReactNode }) {
  return <div className="metricStrip">{children}</div>
}
