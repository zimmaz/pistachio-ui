import { useMemo } from 'react'
import { COMPONENTS, DATA_FLOWS, TRUST_BOUNDARIES, type DataFlow, type SystemComponent } from '@/data'

interface Props {
  selectedId?: string | null
  onSelect?: (id: string) => void
  /** Component ids, in order. Edges along the sequence are drawn as at-risk. */
  highlightPath?: string[]
  compact?: boolean
  /** Component ids added in the current model version, marked with a delta tick. */
  newInVersion?: string
  /** When false, proposed-v19 entities are omitted. */
  showProposed?: boolean
  /** Treat proposed entities as current (after REV-021 approval). */
  includeApprovedProposal?: boolean
}

const KIND_LABEL: Record<SystemComponent['kind'], string> = {
  actor: 'External actor',
  service: 'Service',
  gateway: 'Gateway',
  store: 'Data store',
  queue: 'Queue',
}

export function ArchitectureGraph({
  selectedId,
  onSelect,
  highlightPath = [],
  compact = false,
  newInVersion,
  showProposed = true,
  includeApprovedProposal = false,
}: Props) {
  const geo = compact
    ? { colUnit: 176, rowUnit: 62, originX: 34, originY: 30, nodeW: 132, nodeH: 34, pad: 26 }
    : { colUnit: 230, rowUnit: 88, originX: 40, originY: 42, nodeW: 152, nodeH: 46, pad: 34 }

  const cx = (x: number) => geo.originX + x * geo.colUnit
  const cy = (y: number) => geo.originY + y * geo.rowUnit

  const width = cx(2.72) + geo.nodeW / 2 + geo.pad
  const height = cy(4) + geo.nodeH / 2 + geo.pad

  const visibleComponents = useMemo(
    () =>
      COMPONENTS.filter((component) => {
        if (!component.proposedInVersion) return true
        return showProposed || includeApprovedProposal
      }),
    [showProposed, includeApprovedProposal],
  )

  const visibleFlows = useMemo(
    () =>
      DATA_FLOWS.filter((flow) => {
        if (!flow.proposedInVersion) return true
        return showProposed || includeApprovedProposal
      }),
    [showProposed, includeApprovedProposal],
  )

  const nodes = useMemo(
    () =>
      visibleComponents.map((component) => ({
        component,
        x: cx(component.x) - geo.nodeW / 2,
        y: cy(component.y) - geo.nodeH / 2,
        cx: cx(component.x),
        cy: cy(component.y),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [compact, visibleComponents],
  )

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.component.id, n])), [nodes])

  const highlightEdges = useMemo(() => {
    const set = new Set<string>()
    for (let i = 0; i < highlightPath.length - 1; i += 1) {
      set.add(`${highlightPath[i]}→${highlightPath[i + 1]}`)
    }
    return set
  }, [highlightPath])

  const parallelIndex = useMemo(() => {
    const groups = new Map<string, string[]>()
    for (const flow of visibleFlows) {
      const key = `${flow.from}→${flow.to}`
      groups.set(key, [...(groups.get(key) ?? []), flow.id])
    }
    const map = new Map<string, { index: number; total: number }>()
    for (const [, ids] of groups) {
      ids.forEach((id, index) => map.set(id, { index, total: ids.length }))
    }
    return map
  }, [visibleFlows])

  const edgePath = (flow: DataFlow) => {
    const a = nodeById.get(flow.from)
    const b = nodeById.get(flow.to)
    if (!a || !b) return null

    const spread = parallelIndex.get(flow.id) ?? { index: 0, total: 1 }
    const offset = (spread.index - (spread.total - 1) / 2) * 26

    const half = geo.nodeH / 2
    const halfW = geo.nodeW / 2

    if (a.component.x === b.component.x) {
      const x = a.cx + offset
      const y1 = a.cy + half
      const y2 = b.cy - half
      return `M ${x} ${y1} L ${x} ${y2}`
    }

    if (a.component.y === b.component.y) {
      const y = a.cy + offset
      const x1 = a.cx + (a.cx < b.cx ? halfW : -halfW)
      const x2 = b.cx + (a.cx < b.cx ? -halfW : halfW)
      return `M ${x1} ${y} L ${x2} ${y}`
    }

    const y1 = a.cy + half
    const y2 = b.cy - half
    const mid = (y1 + y2) / 2
    return `M ${a.cx} ${y1} L ${a.cx} ${mid} L ${b.cx} ${mid} L ${b.cx} ${y2}`
  }

  return (
    <svg
      className={`archGraph${compact ? ' archGraph--compact' : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-label="Payments Platform architecture and data flows"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="arw" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 7 4 L 0 7 z" fill="currentColor" />
        </marker>
      </defs>

      {TRUST_BOUNDARIES.map((boundary) => {
        const y = cy(boundary.y)
        return (
          <g key={boundary.id} className="archGraph__boundary">
            <line x1={10} y1={y} x2={width - 10} y2={y} />
            <text x={14} y={y - 6}>
              {boundary.id} · {boundary.name}
            </text>
          </g>
        )
      })}

      {visibleFlows.map((flow) => {
        const d = edgePath(flow)
        if (!d) return null
        const risky = highlightEdges.has(`${flow.from}→${flow.to}`)
        const proposed = Boolean(flow.proposedInVersion) && !includeApprovedProposal
        const isNew = newInVersion !== undefined && flow.addedInVersion === newInVersion
        return (
          <g
            key={flow.id}
            className={`archGraph__edge${risky ? ' is-risky' : ''}${isNew || proposed ? ' is-new' : ''}${proposed ? ' is-proposed' : ''}`}
          >
            <title>{`${flow.id} · ${flow.protocol} · ${flow.data}`}</title>
            <path d={d} markerEnd="url(#arw)" />
          </g>
        )
      })}

      {nodes.map(({ component, x, y }) => {
        const selected = selectedId === component.id
        const inPath = highlightPath.includes(component.id)
        const isNew = newInVersion !== undefined && component.addedInVersion === newInVersion
        const proposed = Boolean(component.proposedInVersion) && !includeApprovedProposal
        const modified = component.id === 'CMP-05' && (showProposed || includeApprovedProposal) && !includeApprovedProposal
        const interactive = Boolean(onSelect)

        return (
          <g
            key={component.id}
            className={[
              'archGraph__node',
              `archGraph__node--${component.kind}`,
              selected ? 'is-selected' : '',
              inPath ? 'is-inPath' : '',
              interactive ? 'is-interactive' : '',
              proposed ? 'is-proposed' : '',
              modified ? 'is-modified' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            transform={`translate(${x} ${y})`}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-pressed={interactive ? selected : undefined}
            onClick={interactive ? () => onSelect?.(component.id) : undefined}
            onKeyDown={
              interactive
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect?.(component.id)
                    }
                  }
                : undefined
            }
          >
            <title>{`${component.name} — ${KIND_LABEL[component.kind]}, ${component.exposure}`}</title>
            <rect className="archGraph__box" width={geo.nodeW} height={geo.nodeH} rx={3} />

            {component.kind === 'store' ? (
              <line className="archGraph__kindRule" x1={0} y1={9} x2={geo.nodeW} y2={9} />
            ) : null}
            {component.kind === 'queue' ? (
              <g className="archGraph__kindRule">
                <line x1={geo.nodeW - 10} y1={4} x2={geo.nodeW - 10} y2={geo.nodeH - 4} />
                <line x1={geo.nodeW - 16} y1={4} x2={geo.nodeW - 16} y2={geo.nodeH - 4} />
              </g>
            ) : null}

            {component.exposure === 'Internet-facing' ? (
              <rect className="archGraph__exposure" x={0} y={0} width={3} height={geo.nodeH} rx={1.5} />
            ) : null}

            <text className="archGraph__name" x={compact ? 10 : 13} y={compact ? 15 : 19}>
              {component.name}
            </text>
            {compact ? null : (
              <text className="archGraph__meta" x={13} y={34}>
                {component.id} · {KIND_LABEL[component.kind]}
              </text>
            )}

            {isNew || proposed ? (
              <text className="archGraph__new" x={geo.nodeW - 8} y={compact ? 15 : 19} textAnchor="end">
                {proposed ? '+' : 'NEW'}
              </text>
            ) : null}

            <rect
              className="archGraph__focus"
              width={geo.nodeW}
              height={geo.nodeH}
              rx={3}
              x={0}
              y={0}
              pointerEvents="none"
            />
          </g>
        )
      })}
    </svg>
  )
}

export function GraphLegend({
  riskyLabel,
  proposed = false,
}: {
  riskyLabel?: string
  proposed?: boolean
}) {
  return (
    <ul className="graphLegend">
      <li>
        <span className="graphLegend__swatch graphLegend__swatch--boundary" aria-hidden="true" />
        Trust boundary
      </li>
      <li>
        <span className="graphLegend__swatch graphLegend__swatch--exposed" aria-hidden="true" />
        Internet-facing
      </li>
      <li>
        <span className="graphLegend__swatch graphLegend__swatch--new" aria-hidden="true" />
        {proposed ? 'Proposed' : 'Added this version'}
      </li>
      {proposed ? (
        <li>
          <span className="graphLegend__swatch graphLegend__swatch--modified" aria-hidden="true" />
          Modified
        </li>
      ) : null}
      {riskyLabel ? (
        <li>
          <span className="graphLegend__swatch graphLegend__swatch--risky" aria-hidden="true" />
          {riskyLabel}
        </li>
      ) : null}
    </ul>
  )
}
