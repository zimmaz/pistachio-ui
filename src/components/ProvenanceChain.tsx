import { entityLabel, entityRoute, type ProvenanceKind, type ProvenanceNode } from '@/data'
import { RELATION_LABEL } from '@/lib/model-visibility'
import { Link } from 'react-router-dom'

const KIND_CLASS: Record<ProvenanceKind, string> = {
  Evidence: 'evidence',
  'Model Entity': 'entity',
  Assumption: 'assumption',
  Threat: 'threat',
  'Attack Path': 'path',
  Control: 'control',
  Finding: 'finding',
  Decision: 'decision',
}

export function ProvenanceChain({
  nodes,
  orientation = 'vertical',
}: {
  nodes: ProvenanceNode[]
  orientation?: 'vertical' | 'horizontal'
}) {
  if (nodes.length === 0) return null

  return (
    <ol className={`provChain provChain--${orientation}`}>
      {nodes.map((node, index) => (
        <li key={`${node.id}-${index}`} className="provChain__item">
          <Link
            className={`provNode provNode--${KIND_CLASS[node.kind]}`}
            to={entityRoute(node.id)}
            title={`${node.kind} · ${entityLabel(node.id)}`}
          >
            <span className="provNode__kind">{node.kind}</span>
            <span className="provNode__title">{node.title}</span>
            {node.subtitle ? <span className="provNode__sub">{node.subtitle}</span> : null}
          </Link>
          {index < nodes.length - 1 ? (
            <span className="provChain__arrow" aria-hidden="true">
              {node.relationToNext ? <span className="provChain__rel">{RELATION_LABEL[node.relationToNext]}</span> : null}
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  )
}

export function ConfidenceRow({
  confidence,
  supporting,
  conflicting,
}: {
  confidence: string
  supporting: number
  conflicting: number
}) {
  return (
    <dl className="confidenceRow">
      <div>
        <dt>Evidence confidence</dt>
        <dd>{confidence} confidence</dd>
      </div>
      <div>
        <dt>Supporting evidence</dt>
        <dd>
          {supporting} source{supporting === 1 ? '' : 's'}
        </dd>
      </div>
      <div>
        <dt>Conflicting evidence</dt>
        <dd>{conflicting === 0 ? 'None' : `${conflicting} source${conflicting === 1 ? '' : 's'}`}</dd>
      </div>
    </dl>
  )
}
