import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  METRICS,
  MODEL_HEALTH,
  OPEN_BY_SEVERITY,
  PROJECT,
  RISK_POSTURE,
  SEVERITY_LABEL,
  reviewById,
} from '@/data'
import { ActivityTimeline } from '@/components/ActivityTimeline'
import { ArchitectureGraph, GraphLegend } from '@/components/ArchitectureGraph'
import { SeverityBadge, StatusBadge } from '@/components/Badges'
import { NotificationList } from '@/components/NotificationPanel'
import { useModelSession } from '@/lib/model-session'

const RISKY_PATH = ['CMP-00', 'CMP-04', 'CMP-05', 'CMP-06']

export function Overview() {
  const session = useModelSession()
  const pending = session.pendingReviews
  const clarifying = session.clarificationReviews
  const primary = reviewById.get('REV-021')
  const primaryStatus = session.reviewStatus('REV-021')
  const modelPending = pending.filter((review) => review.type === 'Model Change').length
  const findingPending = pending.filter((review) => review.type === 'New Finding' || review.type === 'Finding Update').length
  const riskPending = pending.filter((review) => review.type === 'Risk Decision').length
  const assumptionPending = pending.filter(
    (review) => review.type === 'Unverified Assumption' || review.type === 'Evidence Conflict',
  ).length

  return (
    <div className="page">
      <header className="pageHead">
        <div>
          <h1 className="pageHead__title">{PROJECT.name}</h1>
          <p className="pageHead__lede">
            Agents propose. Humans approve. The model records the accepted state.
          </p>
        </div>
        <div className="pageHead__facts">
          <div className="fact">
            <span className="fact__label">Current model</span>
            <span className="fact__value fact__value--big">{session.currentVersion}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Pending proposals</span>
            <span className="fact__value">{session.pendingProposalCount}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Last approved</span>
            <span className="fact__value">{session.lastApprovedLabel}</span>
          </div>
        </div>
      </header>

      <section className="heroState" aria-labelledby="posture-hero">
        <div>
          <div className="def__label" id="posture-hero">
            Risk posture
          </div>
          <p className={`heroState__risk heroState__risk--${RISK_POSTURE.severity}`}>{RISK_POSTURE.label.toUpperCase()} RISK</p>
          <p className="heroState__line">
            <Link className="ref" to="/overview?review=REV-021">
              {pending.length} require review
            </Link>
            <span aria-hidden="true"> · </span>
            <Link className="ref" to="/findings">
              {METRICS.openFindings} open findings
            </Link>
            <span aria-hidden="true"> · </span>
            <Link className="ref" to="/findings?severity=critical">
              {METRICS.criticalFindings} critical
            </Link>
          </p>
        </div>
        <dl className="heroState__meta">
          <div>
            <dt>Model</dt>
            <dd>
              {session.currentVersion} <StatusBadge status="Current" />
            </dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd>{METRICS.evidenceSources} sources</dd>
          </div>
        </dl>
      </section>

      <section className="panel" aria-labelledby="review-title">
        <div className="panel__head">
          <h2 className="panel__title" id="review-title">
            Requires review
          </h2>
          <span className="panel__meta">{pending.length}</span>
        </div>
        {pending.length === 0 && clarifying.length === 0 ? (
          <div className="panel__body">
            <p className="prose">Nothing requires review.</p>
            <p className="prose u-muted">
              Current model {session.currentVersion}. Last reviewed {session.lastApprovedLabel}.
            </p>
          </div>
        ) : (
          <>
        <div className="reviewBreakdown">
          <span>Model Changes {modelPending}</span>
          <span>Findings {findingPending}</span>
          <span>Risk Decisions {riskPending}</span>
          <span>Assumptions {assumptionPending}</span>
        </div>
        <ul className="reviewQueue">
          {pending.map((review) => (
            <li key={review.id}>
              <Link className="reviewRow" to={`/overview?review=${review.id}`}>
                <span className="reviewRow__type">{review.type}</span>
                <span className="reviewRow__main">
                  <span className="reviewRow__title">{review.summary}</span>
                  <span className="reviewRow__meta">
                    <span className="u-mono">{review.id}</span>
                    <span aria-hidden="true"> · </span>
                    {review.proposedByAgentId === 'AGT-01'
                      ? 'PR Review Agent'
                      : review.proposedByAgentId === 'AGT-03'
                        ? 'Architecture Agent'
                        : review.proposedByAgentId === 'AGT-04'
                          ? 'Threat Analysis Agent'
                          : 'Proposed by agent'}
                    {review.revision === 'edited' ? ' · Edited' : ''}
                    {review.riskFrom && review.riskTo ? ` · ${review.riskFrom} → ${review.riskTo}` : ''}
                  </span>
                </span>
                <span className="reviewRow__when">{review.detectedLabel}</span>
                <span className="reviewRow__go">Review</span>
              </Link>
            </li>
          ))}
        </ul>
        {clarifying.length > 0 ? (
          <div className="reviewLead">
            <div className="reviewLead__kicker">
              Awaiting clarification <span>{clarifying.length}</span>
            </div>
            {clarifying.map((review) => (
              <Link key={review.id} className="reviewRow" to={`/overview?review=${review.id}`}>
                <span className="reviewRow__type">{review.id}</span>
                <span className="reviewRow__main">
                  <span className="reviewRow__title">{review.summary}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : null}
        {primary && primaryStatus === 'Awaiting Review' ? (
          <div className="reviewLead">
            <div className="reviewLead__kicker">
              Model change <span>{primary.detectedLabel}</span>
            </div>
            <p className="reviewLead__title">{primary.summary}</p>
            <p className="reviewLead__by">PR Review Agent</p>
            <ul className="diffList diffList--tiny">
              <li className="diffList__item diffList__item--add">1 component</li>
              <li className="diffList__item diffList__item--add">2 data flows</li>
              <li className="diffList__item diffList__item--add">2 threats</li>
            </ul>
            <p className="prose">Security impact Medium → High</p>
            <Link className="btn btn--primary" to="/overview?review=REV-021">
              Review
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        ) : primaryStatus === 'Approved' ? (
          <div className="callout callout--brand" role="status">
            <span>
              REV-021 approved. Current model is v19. FIND-107 and FIND-109 remain open for remediation.
            </span>
          </div>
        ) : null}
          </>
        )}
      </section>

      <section className="panel" aria-labelledby="changed-title">
        <div className="panel__head">
          <h2 className="panel__title" id="changed-title">
            What changed
          </h2>
          <Link className="panel__meta panel__meta--link" to="/model?view=changes">
            View model changes
            <ArrowRight size={11} aria-hidden="true" />
          </Link>
        </div>
        <div className="panel__body whatChanged">
          <div className="whatChanged__head">
            <Link className="ref" to="/evidence?id=EV-041">
              PR #182
            </Link>
            <span className="panel__meta">12 min ago</span>
          </div>
          <p className="prose">Introduced public payment webhook</p>
          <div className="whatChanged__grid">
            <div>
              <div className="def__label">Architecture</div>
              <ul className="diffList diffList--tiny">
                <li className="diffList__item diffList__item--add">Webhook Service</li>
                <li className="diffList__item diffList__item--add">2 data flows</li>
              </ul>
            </div>
            <div>
              <div className="def__label">Threat model</div>
              <ul className="diffList diffList--tiny">
                <li className="diffList__item diffList__item--add">2 threats</li>
                <li className="diffList__item diffList__item--add">findings stay open</li>
              </ul>
            </div>
            <div>
              <div className="def__label">Risk</div>
              <p className="prose">
                Medium → High
                {session.webhookApproved ? ' · accepted in v19' : ' · v18 → proposed v19'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="surface-title">
        <div className="panel__head">
          <h2 className="panel__title" id="surface-title">
            Current attack surface
          </h2>
          <Link className="panel__meta panel__meta--link" to="/model?view=architecture">
            Open architecture
            <ArrowRight size={11} aria-hidden="true" />
          </Link>
        </div>
        <div className="panel__body surfaceBody">
          <div className="surfaceGraph">
            <ArchitectureGraph
              compact
              highlightPath={RISKY_PATH}
              showProposed
              newInVersion="v19"
            />
          </div>
          <aside className="surfaceNotes">
            <GraphLegend riskyLabel="Unprotected replay route" proposed={!session.webhookApproved} />
            <div className="divider" />
            <p className="surfaceNotes__text">
              {session.webhookApproved
                ? 'v19 is current. The acquirer webhook is now an approved crossing of TB-01. FIND-107 remains open.'
                : 'The webhook path is a proposed change from PR #182. It is not part of approved model v18 until REV-021 is accepted.'}
            </p>
            <Link className="btn btn--block" to="/findings?id=FIND-107">
              Open FIND-107
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </section>

      <div className="grid grid--attention">
        <section className="panel" aria-labelledby="health-title">
          <div className="panel__head">
            <h2 className="panel__title" id="health-title">
              Model health
            </h2>
          </div>
          <div className="panel__body">
            <dl className="healthGrid">
              <Link className="healthCell" to="/evidence">
                <dt>Evidence freshness</dt>
                <dd>{MODEL_HEALTH.evidenceFreshness}</dd>
              </Link>
              <Link className="healthCell" to="/model?view=architecture">
                <dt>Architecture coverage</dt>
                <dd>{MODEL_HEALTH.architectureCoverage}%</dd>
              </Link>
              <Link className="healthCell" to="/model?view=document#controls">
                <dt>Control verification</dt>
                <dd>{MODEL_HEALTH.controlVerification}%</dd>
              </Link>
              <Link className="healthCell" to="/model?view=document#assumptions">
                <dt>Unverified assumptions</dt>
                <dd>{METRICS.unverifiedAssumptions}</dd>
              </Link>
              <Link className="healthCell" to="/overview?review=REV-027">
                <dt>Contradicted assumptions</dt>
                <dd>{METRICS.contradictedAssumptions}</dd>
              </Link>
              <Link className="healthCell" to="/evidence?status=stale">
                <dt>Stale evidence</dt>
                <dd>{METRICS.staleEvidence}</dd>
              </Link>
              <Link className="healthCell" to="/overview?review=REV-021">
                <dt>Pending model changes</dt>
                <dd>{session.pendingProposalCount}</dd>
              </Link>
            </dl>
            <div className="divider divider--gutter" />
            <ul className="miniCounts">
              {(['critical', 'high', 'medium', 'low'] as const).map((severity) => (
                <li key={severity}>
                  <Link to={`/findings?severity=${severity}`} className="miniCounts__item">
                    <SeverityBadge severity={severity} bare label={SEVERITY_LABEL[severity]} />
                    <span className="miniCounts__value">{OPEN_BY_SEVERITY[severity]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="stack">
          <section className="panel" aria-labelledby="notif-title">
            <div className="panel__head">
              <h2 className="panel__title" id="notif-title">
                Notifications
              </h2>
              <span className="panel__meta">{pending.length} awaiting review</span>
            </div>
            <NotificationList />
          </section>

          <section className="panel" aria-labelledby="activity-title">
            <div className="panel__head">
              <h2 className="panel__title" id="activity-title">
                Recent model activity
              </h2>
              <Link className="panel__meta panel__meta--link" to="/agents">
                Agent activity
                <ArrowRight size={11} aria-hidden="true" />
              </Link>
            </div>
            <div className="panel__body">
              <ActivityTimeline events={session.activity.slice(0, 8)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
