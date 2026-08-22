import { Ban, Check, MessageSquareText, Pencil } from 'lucide-react'
import {
  agentById,
  provenanceFor,
  reviewById,
  type ModelChangeItem,
} from '@/data'
import { useModelSession } from '@/lib/model-session'
import { StatusBadge } from './Badges'
import { EntityRef, SourceChip } from './EntityRef'
import { Def, Drawer, Section } from './Overlay'
import { ProvenanceChain } from './ProvenanceChain'

const OP_GLYPH: Record<ModelChangeItem['op'], string> = {
  added: '+',
  modified: '~',
  removed: '−',
}

export function ReviewDetail({ reviewId, onClose }: { reviewId: string | null; onClose: () => void }) {
  const review = reviewId ? (reviewById.get(reviewId) ?? null) : null
  const session = useModelSession()
  if (!review) return null

  const status = session.reviewStatus(review.id)
  const note = session.reviewNote(review.id)
  const agent = agentById.get(review.proposedByAgentId)
  const settled = status !== 'Pending'
  const chain = review.provenance?.length ? review.provenance : provenanceFor(review.id)
  const groups = groupChanges(review.changes)

  return (
    <Drawer
      open
      onClose={onClose}
      wide
      title={review.title}
      eyebrow={
        <>
          <span className="u-mono drawer__id">{review.id}</span>
          <span className="chip">{review.type}</span>
          <StatusBadge status={status} />
        </>
      }
      footer={
        <>
          <button className="btn btn--danger" disabled={settled} onClick={() => session.decideReview(review.id, 'Rejected', 'Rejected by Dana Okoye.')}>
            <Ban size={13} aria-hidden="true" />
            Reject
          </button>
          <button
            className="btn"
            disabled={settled}
            onClick={() => session.decideReview(review.id, 'Clarification requested', 'Clarification requested by Dana Okoye.')}
          >
            <MessageSquareText size={13} aria-hidden="true" />
            Request clarification
          </button>
          <button
            className="btn"
            disabled={settled}
            onClick={() => session.decideReview(review.id, 'Edited', 'Edits recorded by Dana Okoye. Still awaiting approval.')}
          >
            <Pencil size={13} aria-hidden="true" />
            Edit before approval
          </button>
          <button
            className="btn btn--primary"
            disabled={settled}
            onClick={() =>
              session.decideReview(
                review.id,
                'Approved',
                review.producesVersion
                  ? `Approved by Dana Okoye. Current model is now ${review.producesVersion}.`
                  : 'Approved by Dana Okoye.',
              )
            }
          >
            <Check size={13} aria-hidden="true" />
            Approve changes
          </button>
        </>
      }
    >
      {note ? (
        <div className="callout callout--brand" role="status">
          <span>{note}</span>
        </div>
      ) : null}

      <div className="defs defs--split">
        <Def label="Status">
          <StatusBadge status={status} />
        </Def>
        <Def label="Proposed by">{agent?.name ?? review.proposedByAgentId}</Def>
        <Def label="Source">
          <SourceChip id={review.sourceEvidenceId} />
        </Def>
        <Def label="Detected">{review.detectedLabel}</Def>
      </div>

      {review.producesVersion ? (
        <div className="authorityStrip" role="status">
          <span>
            Current model <strong>{session.webhookApproved && review.id === 'REV-021' ? 'v19' : 'v18'}</strong>
          </span>
          <span>
            {status === 'Approved' ? 'Published as' : 'Would publish'} <strong>{review.producesVersion}</strong>
          </span>
          <span>Agents propose. Humans approve.</span>
        </div>
      ) : null}

      <Section title="Proposed model changes">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="changeGroup">
            <h4 className="def__label">{group}</h4>
            <ul className="diffList">
              {items.map((item) => (
                <li key={`${item.op}-${item.label}`} className={`diffList__item diffList__item--${tone(item.op)}`}>
                  <span className="diffList__glyph">{OP_GLYPH[item.op]}</span>
                  {item.id ? (
                    <>
                      <EntityRef id={item.id} /> {item.label.replace(item.id, '').trim()}
                    </>
                  ) : (
                    item.label
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="Why Pistachio proposed this">
        <p className="prose">{review.rationale}</p>
        {review.why ? <p className="prose u-muted">{review.why}</p> : null}
        {chain.length > 0 ? <ProvenanceChain nodes={chain} /> : null}
        <div className="sourceChipRow">
          {review.evidenceIds.map((id) => (
            <SourceChip key={id} id={id} />
          ))}
        </div>
      </Section>

      <Section title="Security impact">
        <div className="defs defs--split">
          {review.riskFrom && review.riskTo ? (
            <Def label="Risk posture">
              {review.riskFrom} → {review.riskTo}
            </Def>
          ) : null}
          {review.affectedAssets?.length ? (
            <Def label="Affected assets">
              {review.affectedAssets.map((id) => (
                <EntityRef key={id} id={id} />
              ))}
            </Def>
          ) : null}
          {review.attackPathDelta ? <Def label="Attack paths">{review.attackPathDelta}</Def> : null}
        </div>
        <p className="prose">{review.securityImpact}</p>
      </Section>
    </Drawer>
  )
}

function groupChanges(items: ModelChangeItem[]) {
  return items.reduce<Record<string, ModelChangeItem[]>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] ?? []), item]
    return acc
  }, {})
}

function tone(op: ModelChangeItem['op']) {
  if (op === 'added') return 'add'
  if (op === 'removed') return 'remove'
  return 'change'
}

