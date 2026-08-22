import { Ban, Check, MessageSquareText, Pencil, Undo2 } from 'lucide-react'
import { agentById, exceptionById, findingById, provenanceFor, reviewById, type ModelChangeItem } from '@/data'
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
  const revision = session.reviewRevision(review.id)
  const note = session.reviewNote(review.id)
  const clarification = session.reviewClarification(review.id)
  const agent = agentById.get(review.proposedByAgentId)
  const terminal = status === 'Approved' || status === 'Rejected'
  const awaitingClarification = status === 'Awaiting Clarification'
  const canDecide = status === 'Awaiting Review'
  const chain = review.provenance?.length ? review.provenance : provenanceFor(review.id)
  const groups = groupChanges(review.changes)
  const isRisk = review.type === 'Risk Decision'
  const decision = review.decisionId ? exceptionById.get(review.decisionId) : null
  const finding = review.findingIds[0] ? findingById.get(review.findingIds[0]) : null

  return (
    <Drawer
      open
      onClose={onClose}
      wide
      title={isRisk ? 'Risk acceptance request' : review.title}
      eyebrow={
        <>
          <span className="u-mono drawer__id">{review.decisionId ?? review.id}</span>
          <span className="chip">{review.type}</span>
          <StatusBadge status={status} />
          {revision === 'edited' && !terminal ? <span className="chip">Edited</span> : null}
        </>
      }
      footer={
        <>
          {awaitingClarification ? (
            <button className="btn btn--primary" onClick={() => session.returnToReview(review.id)}>
              <Undo2 size={13} aria-hidden="true" />
              Return to review
            </button>
          ) : (
            <>
              <button
                className="btn btn--danger"
                disabled={terminal}
                onClick={() => session.decideReview(review.id, 'Rejected', rejectedNote(review.type))}
              >
                <Ban size={13} aria-hidden="true" />
                Reject
              </button>
              {isRisk ? (
                <button
                  className="btn"
                  disabled={!canDecide}
                  onClick={() => session.requestClarification(review.id, 'Which compensating controls remain after launch?')}
                >
                  <MessageSquareText size={13} aria-hidden="true" />
                  Request changes
                </button>
              ) : (
                <>
                  <button
                    className="btn"
                    disabled={!canDecide}
                    onClick={() => session.requestClarification(review.id)}
                  >
                    <MessageSquareText size={13} aria-hidden="true" />
                    Request clarification
                  </button>
                  <button className="btn" disabled={!canDecide} onClick={() => session.editReview(review.id)}>
                    <Pencil size={13} aria-hidden="true" />
                    Edit before approval
                  </button>
                </>
              )}
              <button
                className="btn btn--primary"
                disabled={!canDecide}
                onClick={() =>
                  session.decideReview(
                    review.id,
                    'Approved',
                    review.producesVersion
                      ? `Approved by Dana Okoye, Security Architect. Current model is now ${review.producesVersion}. Findings remain open.`
                      : isRisk
                        ? 'Risk accepted. Approved by AppSec Director. Risk owner Payments Director.'
                        : 'Approved by Dana Okoye.',
                  )
                }
              >
                <Check size={13} aria-hidden="true" />
                {isRisk ? 'Approve risk' : review.producesVersion ? 'Approve model' : 'Approve'}
              </button>
            </>
          )}
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
        <Def label="Revision">{revision === 'edited' ? 'Edited by reviewer' : 'Original'}</Def>
        <Def label="Proposed by">{agent?.name ?? review.proposedByAgentId}</Def>
        <Def label="Source">
          <SourceChip id={review.sourceEvidenceId} />
        </Def>
      </div>

      {awaitingClarification && clarification ? (
        <Section title="Clarification requested">
          <div className="defs defs--split">
            <Def label="Requested from">{clarification.requestedFrom}</Def>
            <Def label="Requested by">{clarification.requestedBy}</Def>
          </div>
          <p className="prose">“{clarification.question}”</p>
        </Section>
      ) : null}

      {review.producesVersion ? (
        <div className="authorityStrip" role="status">
          <span>
            Current model <strong>{session.currentVersion}</strong>
          </span>
          <span>
            {status === 'Approved' ? 'Published as' : 'Would publish'} <strong>{review.producesVersion}</strong>
          </span>
          <span>Approving the model does not close findings.</span>
        </div>
      ) : null}

      {isRisk ? (
        <Section title="Risk acceptance">
          <div className="defs defs--split">
            <Def label="Finding">
              {finding ? <EntityRef id={finding.id} /> : null} {finding?.title}
            </Def>
            <Def label="Residual risk">{decision?.residual ?? finding?.severity ?? 'high'}</Def>
            <Def label="Risk owner">{decision?.riskOwner ?? 'Payments Director'}</Def>
            <Def label="Requested by">Payments Engineering</Def>
            <Def label="Required security approver">{decision?.securityApprover ?? 'AppSec Director'}</Def>
            <Def label="Expiration">{decision?.expires ?? '31 Oct 2026'}</Def>
          </div>
          <p className="prose">{decision?.justification ?? review.rationale}</p>
          <div className="def__label">Compensating controls</div>
          <ul className="prose">
            {(decision?.compensatingControls ?? ['Authorization volume anomaly detection']).map((control) => (
              <li key={control}>{control}</li>
            ))}
          </ul>
          <p className="prose u-muted">Agents can recommend risk treatment. Agents cannot accept organizational risk.</p>
        </Section>
      ) : (
        <Section title={review.producesVersion ? 'Proposed model changes' : 'Proposed change'}>
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
      )}

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

      {!isRisk && (review.riskFrom || review.securityImpact) ? (
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
      ) : null}
    </Drawer>
  )
}

function rejectedNote(type: string) {
  if (type === 'Risk Decision') return 'Risk acceptance rejected by AppSec Director.'
  return 'Rejected by Dana Okoye.'
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
