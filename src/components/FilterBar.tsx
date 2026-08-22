import { Search, X } from 'lucide-react'
import type { ReactNode } from 'react'

export type FilterOption = string | { value: string; label: string }

export interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

function optionValue(option: FilterOption) {
  return typeof option === 'string' ? option : option.value
}

function optionLabel(option: FilterOption) {
  return typeof option === 'string' ? option : option.label
}

interface Props {
  /** Primary segmented filter, rendered as pills rather than a select. */
  segments?: { label: string; value: string; count?: number }[]
  activeSegment?: string
  onSegment?: (value: string) => void
  groups?: FilterGroup[]
  query?: string
  onQuery?: (value: string) => void
  queryPlaceholder?: string
  resultLabel?: ReactNode
  onReset?: () => void
  canReset?: boolean
}

export function FilterBar({
  segments,
  activeSegment,
  onSegment,
  groups = [],
  query,
  onQuery,
  queryPlaceholder = 'Filter…',
  resultLabel,
  onReset,
  canReset = false,
}: Props) {
  return (
    <div className="filterBar">
      {segments && onSegment ? (
        <div className="filterBar__segments" role="group" aria-label="Type filter">
          {segments.map((segment) => (
            <button
              key={segment.value}
              type="button"
              className={`filterPill${activeSegment === segment.value ? ' is-active' : ''}`}
              aria-pressed={activeSegment === segment.value}
              onClick={() => onSegment(segment.value)}
            >
              {segment.label}
              {segment.count !== undefined ? <span className="filterPill__count">{segment.count}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="filterBar__controls">
        {onQuery ? (
          <div className="filterSearch">
            <Search size={13} aria-hidden="true" />
            <input
              className="filterSearch__input"
              type="search"
              value={query}
              placeholder={queryPlaceholder}
              onChange={(event) => onQuery(event.target.value)}
              aria-label={queryPlaceholder}
            />
          </div>
        ) : null}

        {groups.map((group) => (
          <label key={group.id} className="filterSelect">
            <span className="u-visually-hidden">{group.label}</span>
            <select
              className="select"
              value={group.value}
              onChange={(event) => group.onChange(event.target.value)}
              aria-label={group.label}
            >
              <option value="">{group.label}</option>
              {group.options.map((option) => {
                const value = optionValue(option)
                return (
                  <option key={value} value={value}>
                    {optionLabel(option)}
                  </option>
                )
              })}
            </select>
          </label>
        ))}

        {canReset && onReset ? (
          <button type="button" className="btn btn--quiet" onClick={onReset}>
            <X size={13} aria-hidden="true" />
            Clear
          </button>
        ) : null}

        {resultLabel ? <span className="filterBar__result">{resultLabel}</span> : null}
      </div>
    </div>
  )
}
