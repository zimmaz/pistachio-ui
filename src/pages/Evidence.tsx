import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AGENTS,
  COMPONENTS,
  EVIDENCE,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
  METRICS,
  PROJECT,
  agentById,
} from '@/data'
import { StatusBadge } from '@/components/Badges'
import { EvidenceDetail } from '@/components/EvidenceDetail'
import { FilterBar } from '@/components/FilterBar'

const TIME_BUCKETS = ['Last hour', 'Last 24 hours', 'Last 7 days', 'Older'] as const

function bucketFor(label: string): (typeof TIME_BUCKETS)[number] {
  if (label.endsWith('m ago')) return 'Last hour'
  if (label.endsWith('h ago') || label === 'Yesterday') return 'Last 24 hours'
  const days = Number.parseInt(label, 10)
  if (label.endsWith('d ago') && Number.isFinite(days) && days <= 7) return 'Last 7 days'
  return 'Older'
}

export function Evidence() {
  const [params, setParams] = useSearchParams()

  const selectedId = params.get('id')
  const type = params.get('type') ?? 'All'
  const source = params.get('source') ?? ''
  const status = params.get('status') ?? ''
  const agent = params.get('agent') ?? ''
  const entity = params.get('entity') ?? ''
  const time = params.get('time') ?? ''
  const query = params.get('q') ?? ''

  const patch = (next: Record<string, string | null>) => {
    const merged = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '') merged.delete(key)
      else merged.set(key, value)
    }
    setParams(merged, { replace: true })
  }

  const rows = useMemo(
    () =>
      EVIDENCE.filter((item) => {
        if (type !== 'All' && item.type !== type) return false
        if (source && item.source !== source) return false
        if (status === 'stale') {
          const days = Number((item.analyzedLabel.match(/(\d+)d/) ?? [])[1] ?? 0)
          if (!item.stale && days < 20) return false
        } else if (status && item.status !== status) return false
        if (agent && item.agentId !== agent) return false
        if (entity && !item.affectedEntities.includes(entity)) return false
        if (time && bucketFor(item.analyzedLabel) !== time) return false
        if (query) {
          const needle = query.toLowerCase()
          if (!`${item.id} ${item.name} ${item.format} ${item.author}`.toLowerCase().includes(needle)) return false
        }
        return true
      }),
    [type, source, status, agent, entity, time, query],
  )

  const selected = selectedId ? (EVIDENCE.find((e) => e.id === selectedId) ?? null) : null
  const hasFilters = Boolean(source || status || agent || entity || time || query || type !== 'All')

  const countFor = (value: string) => (value === 'All' ? EVIDENCE.length : EVIDENCE.filter((e) => e.type === value).length)

  return (
    <div className="page">
      <header className="pageHead">
        <div>
          <h1 className="pageHead__title">Evidence</h1>
          <p className="pageHead__lede">
            Everything Pistachio has observed about the {PROJECT.name}, and the reason the model says what it says.
          </p>
        </div>
        <div className="pageHead__facts">
          <div className="fact">
            <span className="fact__label">Sources</span>
            <span className="fact__value fact__value--big">{METRICS.evidenceSources}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Last analyzed</span>
            <span className="fact__value">{PROJECT.lastAnalyzedLabel}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Coverage</span>
            <span className="fact__value">{METRICS.evidenceCoverage}% of the modelled surface</span>
          </div>
        </div>
      </header>

      <FilterBar
        segments={['All', ...EVIDENCE_TYPES].map((value) => ({
          label: value === 'Pull Request' ? 'Pull Requests' : value === 'Meeting' ? 'Meetings' : value === 'Policy' ? 'Policies' : value,
          value,
          count: countFor(value),
        }))}
        activeSegment={type}
        onSegment={(value) => patch({ type: value === 'All' ? null : value })}
        query={query}
        onQuery={(value) => patch({ q: value })}
        queryPlaceholder="Filter evidence"
        groups={[
          { id: 'source', label: 'Source', options: EVIDENCE_SOURCES, value: source, onChange: (v) => patch({ source: v }) },
          {
            id: 'time',
            label: 'Time',
            options: [...TIME_BUCKETS],
            value: time,
            onChange: (v) => patch({ time: v }),
          },
          {
            id: 'status',
            label: 'Status',
            options: ['Analyzed', 'Needs review', 'Analyzing', 'Conflict'],
            value: status,
            onChange: (v) => patch({ status: v }),
          },
          {
            id: 'agent',
            label: 'Agent',
            options: AGENTS.map((a) => ({ value: a.id, label: a.name })),
            value: agent,
            onChange: (v) => patch({ agent: v }),
          },
          {
            id: 'entity',
            label: 'Model entity',
            options: COMPONENTS.map((c) => ({ value: c.id, label: c.name })),
            value: entity,
            onChange: (v) => patch({ entity: v }),
          },
        ]}
        canReset={hasFilters}
        onReset={() => setParams(new URLSearchParams(), { replace: true })}
        resultLabel={
          <>
            {rows.length} of {EVIDENCE.length}
          </>
        }
      />

      <div className="panel panel__body--tight">
        <div className="tableWrap">
          <table className="table">
            <caption className="u-visually-hidden">Evidence sources analyzed for the Payments Platform.</caption>
            <thead>
              <tr>
                <th className="col-title" scope="col">
                  Evidence
                </th>
                <th scope="col">Type</th>
                <th scope="col">Source</th>
                <th scope="col">Analyzed by</th>
                <th scope="col">Last analyzed</th>
                <th scope="col" className="cell-num">
                  Model impact
                </th>
                <th scope="col" className="cell-num">
                  Findings
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr
                  key={item.id}
                  className={selectedId === item.id ? 'is-selected' : undefined}
                  role="button"
                  tabIndex={0}
                  onClick={() => patch({ id: item.id })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      patch({ id: item.id })
                    }
                  }}
                  aria-pressed={selectedId === item.id}
                  aria-label={`${item.id}. ${item.name}.`}
                >
                  <td className="cell-primary">
                    <span className="evidenceName">{item.name}</span>
                    <span className="evidenceFormat">{item.format}</span>
                  </td>
                  <td className="cell-nowrap">{item.type}</td>
                  <td className="cell-nowrap">{item.source}</td>
                  <td className="cell-nowrap u-muted">{agentById.get(item.agentId)?.name ?? '—'}</td>
                  <td className="cell-mono">{item.analyzedLabel}</td>
                  <td className="cell-num cell-mono">{item.entityImpact} entities</td>
                  <td className="cell-num cell-mono">{item.findings.length || '—'}</td>
                  <td className="cell-nowrap">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <p className="empty">No evidence matches these filters.</p> : null}
      </div>

      <EvidenceDetail evidence={selected} onClose={() => patch({ id: null })} />
    </div>
  )
}
