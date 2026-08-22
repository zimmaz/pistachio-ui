import { SEVERITY_LABEL, type Severity } from '@/data'

const ORDER: Severity[] = ['critical', 'high', 'medium', 'low']

interface Props {
  counts: Record<Severity, number>
  total?: number
  /** Emits a filter when a band is chosen. */
  onSelect?: (severity: Severity) => void
  selected?: Severity | null
  unit: string
}

/**
 * A single segmented bar plus a readout. Answers "how bad, and how much of it"
 * without a gauge, a donut or a five-card row.
 */
export function SeverityDistribution({ counts, total, onSelect, selected, unit }: Props) {
  const sum = total ?? ORDER.reduce((acc, key) => acc + counts[key], 0)

  return (
    <div className="sevDist">
      <div className="sevDist__bar" role="img" aria-label={distributionLabel(counts, sum, unit)}>
        {ORDER.map((severity) => {
          const count = counts[severity]
          if (count === 0) return null
          return (
            <span
              key={severity}
              className={`sevDist__seg sevDist__seg--${severity}${selected === severity ? ' is-selected' : ''}`}
              style={{ flexGrow: count }}
            />
          )
        })}
      </div>

      <ul className="sevDist__rows">
        {ORDER.map((severity) => {
          const count = counts[severity]
          const share = sum === 0 ? 0 : Math.round((count / sum) * 100)
          const cls = `sevDist__row${selected === severity ? ' is-selected' : ''}`
          const inner = (
            <>
              <span className={`sevDist__swatch sevDist__swatch--${severity}`} aria-hidden="true" />
              <span className="sevDist__name">{SEVERITY_LABEL[severity]}</span>
              <span className="sevDist__count">{count}</span>
              <span className="sevDist__share">{share}%</span>
            </>
          )
          return (
            <li key={severity}>
              {onSelect ? (
                <button
                  type="button"
                  className={cls}
                  aria-pressed={selected === severity}
                  onClick={() => onSelect(severity)}
                >
                  {inner}
                </button>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function distributionLabel(counts: Record<Severity, number>, sum: number, unit: string) {
  const parts = ORDER.map((s) => `${counts[s]} ${SEVERITY_LABEL[s].toLowerCase()}`).join(', ')
  return `${sum} ${unit}: ${parts}`
}

/** Horizontal coverage meter used for evidence coverage and control state. */
export function CoverageMeter({
  value,
  label,
  caption,
}: {
  value: number
  label: string
  caption?: string
}) {
  return (
    <div className="coverage">
      <div className="coverage__top">
        <span className="coverage__label">{label}</span>
        <span className="coverage__value">{value}%</span>
      </div>
      <div
        className="coverage__track"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <span className="coverage__fill" style={{ inlineSize: `${value}%` }} />
      </div>
      {caption ? <p className="coverage__caption">{caption}</p> : null}
    </div>
  )
}
