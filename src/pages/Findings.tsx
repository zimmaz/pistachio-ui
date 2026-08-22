import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'
import {
  COMPONENTS,
  FINDINGS,
  FINDING_STATUSES,
  FINDING_TYPES,
  METRICS,
  OPEN_BY_SEVERITY,
  SEVERITY_LABEL,
  SEVERITY_RANK,
  isOpen,
  type Finding,
  type Severity,
} from '@/data'
import { SeverityBadge, StatusBadge } from '@/components/Badges'
import { FilterBar } from '@/components/FilterBar'
import { FindingDetail, type Decision } from '@/components/FindingDetail'
import { RiskAcceptanceModal } from '@/components/RiskAcceptanceModal'
import { useModelSession } from '@/lib/model-session'

type SortKey = 'severity' | 'detectedAt' | 'id' | 'target'

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low']

export function Findings() {
  const [params, setParams] = useSearchParams()
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const [acceptFor, setAcceptFor] = useState<Finding | null>(null)
  const session = useModelSession()
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'severity', dir: 'asc' })

  const selectedId = params.get('id')
  const severity = params.get('severity') ?? ''
  const type = params.get('type') ?? ''
  const component = params.get('component') ?? ''
  const status = params.get('status') ?? ''
  const owner = params.get('owner') ?? ''
  const scope = params.get('scope') ?? 'open'
  const query = params.get('q') ?? ''

  const patch = (next: Record<string, string | null>) => {
    const merged = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '') merged.delete(key)
      else merged.set(key, value)
    }
    setParams(merged, { replace: true })
  }

  const statusOf = (finding: Finding) => decisions[finding.id]?.status ?? finding.status

  const rows = useMemo(() => {
    const filtered = FINDINGS.filter((finding) => {
      const effective = { ...finding, status: statusOf(finding) }
      if (scope === 'open' && !isOpen(effective)) return false
      if (severity && finding.severity !== severity) return false
      if (type && finding.type !== type) return false
      if (component && finding.targetId !== component) return false
      if (status && statusOf(finding) !== status) return false
      if (owner && finding.owner !== owner) return false
      if (query) {
        const needle = query.toLowerCase()
        const haystack = `${finding.id} ${finding.title} ${finding.target} ${finding.type} ${finding.source}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })

    const direction = sort.dir === 'asc' ? 1 : -1
    return filtered.sort((a, b) => {
      switch (sort.key) {
        case 'severity':
          return (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) * direction
        case 'detectedAt':
          return b.detectedAt.localeCompare(a.detectedAt) * direction
        case 'target':
          return a.target.localeCompare(b.target) * direction
        default:
          return a.id.localeCompare(b.id) * direction
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severity, type, component, status, owner, scope, query, sort, decisions])

  const selected = selectedId ? (FINDINGS.find((f) => f.id === selectedId) ?? null) : null
  const hasFilters = Boolean(severity || type || component || status || owner || query)

  const toggleSort = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  const sortState = (key: SortKey) => (sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none')

  const record = (finding: Finding, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [finding.id]: decision }))
    session.recordFinding(finding.id, decision)
  }

  const owners = Array.from(new Set(FINDINGS.map((f) => f.owner)))

  return (
    <div className="page">
      <header className="pageHead">
        <div>
          <h1 className="pageHead__title">Findings</h1>
          <p className="pageHead__lede">
            Everything in the model that requires a human decision — not only vulnerabilities.
          </p>
        </div>
        <div className="pageHead__facts severityCounts">
          <div className="fact">
            <span className="fact__label">Open</span>
            <span className="fact__value fact__value--big">{METRICS.openFindings}</span>
          </div>
          {SEVERITIES.map((level) => (
            <button
              key={level}
              type="button"
              className={`sevCount${severity === level ? ' is-active' : ''}`}
              aria-pressed={severity === level}
              onClick={() => patch({ severity: severity === level ? null : level, scope: 'open' })}
            >
              <span className="sevCount__value">{OPEN_BY_SEVERITY[level]}</span>
              <SeverityBadge severity={level} bare label={SEVERITY_LABEL[level]} />
            </button>
          ))}
        </div>
      </header>

      <FilterBar
        segments={[
          { label: 'Open', value: 'open', count: METRICS.openFindings },
          { label: 'All findings', value: 'all', count: FINDINGS.length },
        ]}
        activeSegment={scope}
        onSegment={(value) => patch({ scope: value === 'open' ? null : value })}
        query={query}
        onQuery={(value) => patch({ q: value })}
        queryPlaceholder="Filter findings"
        groups={[
          { id: 'type', label: 'Type', options: FINDING_TYPES, value: type, onChange: (v) => patch({ type: v }) },
          {
            id: 'component',
            label: 'Component',
            options: COMPONENTS.map((c) => ({ value: c.id, label: c.name })),
            value: component,
            onChange: (v) => patch({ component: v }),
          },
          {
            id: 'status',
            label: 'Status',
            options: FINDING_STATUSES,
            value: status,
            onChange: (v) => patch({ status: v, scope: 'all' }),
          },
          { id: 'owner', label: 'Owner', options: owners, value: owner, onChange: (v) => patch({ owner: v }) },
        ]}
        canReset={hasFilters}
        onReset={() => setParams(new URLSearchParams(), { replace: true })}
        resultLabel={
          <>
            {rows.length} of {scope === 'open' ? METRICS.openFindings : FINDINGS.length}
          </>
        }
      />

      <div className="panel panel__body--tight">
        <div className="tableWrap">
          <table className="table">
            <caption className="u-visually-hidden">
              Findings for the Payments Platform, sorted by {sort.key}.
            </caption>
            <thead>
              <tr>
                <th className="is-sortable" aria-sort={sortState('id')} scope="col">
                  <button type="button" onClick={() => toggleSort('id')}>
                    ID
                    <SortGlyph active={sort.key === 'id'} dir={sort.dir} />
                  </button>
                </th>
                <th className="col-title" scope="col">
                  Finding
                </th>
                <th className="is-sortable" aria-sort={sortState('severity')} scope="col">
                  <button type="button" onClick={() => toggleSort('severity')}>
                    Severity
                    <SortGlyph active={sort.key === 'severity'} dir={sort.dir} />
                  </button>
                </th>
                <th scope="col">Type</th>
                <th className="is-sortable" aria-sort={sortState('target')} scope="col">
                  <button type="button" onClick={() => toggleSort('target')}>
                    Target
                    <SortGlyph active={sort.key === 'target'} dir={sort.dir} />
                  </button>
                </th>
                <th scope="col">Source</th>
                <th scope="col">Status</th>
                <th className="is-sortable" aria-sort={sortState('detectedAt')} scope="col">
                  <button type="button" onClick={() => toggleSort('detectedAt')}>
                    Detected
                    <SortGlyph active={sort.key === 'detectedAt'} dir={sort.dir} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((finding) => (
                <tr
                  key={finding.id}
                  className={selectedId === finding.id ? 'is-selected' : undefined}
                  role="button"
                  tabIndex={0}
                  onClick={() => patch({ id: finding.id })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      patch({ id: finding.id })
                    }
                  }}
                  aria-pressed={selectedId === finding.id}
                  aria-label={`${finding.id}. ${finding.title}. ${SEVERITY_LABEL[finding.severity]}.`}
                >
                  <td className="cell-mono">{finding.id}</td>
                  <td className="cell-primary">{finding.title}</td>
                  <td>
                    <SeverityBadge severity={finding.severity} />
                  </td>
                  <td className="cell-nowrap">{finding.type}</td>
                  <td className="cell-nowrap">{finding.target}</td>
                  <td className="cell-nowrap">{finding.source}</td>
                  <td className="cell-nowrap">
                    <StatusBadge status={statusOf(finding)} />
                  </td>
                  <td className="cell-mono">{finding.detectedLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <p className="empty">No findings match these filters.</p> : null}
      </div>

      <FindingDetail
        finding={selected}
        decision={selected ? decisions[selected.id] : undefined}
        onClose={() => patch({ id: null })}
        onPlanMitigation={() =>
          selected &&
          record(selected, {
            status: 'Mitigation Planned',
            note: `Mitigation planned by Dana Okoye. Owner ${selected.remediationOwner ?? selected.owner}. Due ${selected.dueDate ?? 'unscheduled'}.`,
          })
        }
        onMitigate={() =>
          selected &&
          record(selected, {
            status: 'Mitigating',
            note: `Mitigation assigned to ${selected.remediationOwner ?? selected.owner} by Dana Okoye. The finding stays open until the control is verified.`,
          })
        }
        onAcceptRisk={() => setAcceptFor(selected)}
        onMarkInvalid={() =>
          selected &&
          record(selected, {
            status: 'Invalid',
            note: 'Marked invalid by Dana Okoye. The underlying threat stays in the model; only this finding is closed.',
          })
        }
        acceptedRisk={selected ? session.acceptedRisk(selected.id) : undefined}
      />

      <RiskAcceptanceModal
        key={acceptFor?.id ?? 'none'}
        finding={acceptFor}
        onClose={() => setAcceptFor(null)}
        onSubmit={(recordData) => {
          if (acceptFor) {
            session.recordAcceptedRisk(acceptFor.id, recordData)
            record(acceptFor, { status: 'Risk accepted', note: recordData.summary })
          }
          setAcceptFor(null)
        }}
      />
    </div>
  )
}

function SortGlyph({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return null
  return dir === 'asc' ? <ArrowUp size={11} aria-hidden="true" /> : <ArrowDown size={11} aria-hidden="true" />
}
