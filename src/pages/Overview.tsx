import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  ATTENTION_FINDINGS,
  CURRENT_VERSION,
  METRICS,
  MODEL_ACTIVITY,
  OPEN_BY_SEVERITY,
  PREVIOUS_VERSION,
  PROJECT,
  RISK_POSTURE,
  THREATS_BY_RESIDUAL,
  SEVERITY_LABEL,
} from '@/data'
import { ActivityTimeline } from '@/components/ActivityTimeline'
import { ArchitectureGraph, GraphLegend } from '@/components/ArchitectureGraph'
import { SeverityBadge, StatusBadge } from '@/components/Badges'
import { Metric, MetricStrip } from '@/components/Metric'
import { NotificationList } from '@/components/NotificationPanel'
import { CoverageMeter, SeverityDistribution } from '@/components/SeverityBar'

/** The webhook path introduced by PR #182 — the one risky route worth marking. */
const RISKY_PATH = ['CMP-00', 'CMP-04', 'CMP-05', 'CMP-06']

export function Overview() {
  return (
    <div className="page">
      <header className="pageHead">
        <div>
          <h1 className="pageHead__title">{PROJECT.name}</h1>
          <p className="pageHead__lede">
            {PROJECT.tagline}, maintained from {METRICS.evidenceSources} evidence sources by{' '}
            {METRICS.activeAgents} agents.
          </p>
        </div>
        <div className="pageHead__facts">
          <div className="fact">
            <span className="fact__label">Last model update</span>
            <span className="fact__value">{PROJECT.lastUpdatedLabel}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Based on</span>
            <span className="fact__value">{METRICS.evidenceSources} evidence sources</span>
          </div>
          <div className="fact">
            <span className="fact__label">Model status</span>
            <span className="fact__value">
              <StatusBadge status={PROJECT.modelStatus} />
            </span>
          </div>
        </div>
      </header>

      <MetricStrip>
        <Metric
          label="Risk posture"
          value={RISK_POSTURE.label.toUpperCase()}
          note={RISK_POSTURE.note}
          tone={RISK_POSTURE.severity}
          emphasis
        />
        <Metric
          label="Open findings"
          value={METRICS.openFindings}
          note={`${METRICS.needsReview} need review`}
          to="/findings"
        />
        <Metric
          label="Critical"
          value={METRICS.criticalFindings}
          note="awaiting decision"
          tone="critical"
          to="/findings?severity=critical"
        />
        <Metric label="Active threats" value={METRICS.activeThreats} note={`across ${METRICS.components} components`} to="/model#threats" />
        <Metric
          label="Controls"
          value={METRICS.controls}
          note={`${METRICS.controlsImplemented} implemented`}
          to="/model#controls"
        />
        <Metric
          label="Evidence coverage"
          value={`${METRICS.evidenceCoverage}%`}
          note={`${100 - METRICS.evidenceCoverage}% unmapped`}
          to="/evidence"
        />
      </MetricStrip>

      <div className="grid grid--posture">
        <section className="panel" aria-labelledby="posture-title">
          <div className="panel__head">
            <h2 className="panel__title" id="posture-title">
              Threat posture
            </h2>
            <span className="panel__meta">Residual risk across {METRICS.activeThreats} active threats</span>
          </div>
          <div className="panel__body">
            <SeverityDistribution counts={THREATS_BY_RESIDUAL} unit="active threats" />
            <div className="divider divider--gutter" />
            <div className="postureSplit">
              <div>
                <div className="def__label">Open findings by severity</div>
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
              <CoverageMeter
                value={METRICS.evidenceCoverage}
                label="Evidence coverage"
                caption={`${METRICS.unverifiedAssumptions} assumptions unverified · ${METRICS.contradictedAssumptions} contradicted by evidence`}
              />
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="evolution-title">
          <div className="panel__head">
            <h2 className="panel__title" id="evolution-title">
              Model evolution
            </h2>
            <Link className="panel__meta panel__meta--link" to="/model">
              Open model
              <ArrowRight size={11} aria-hidden="true" />
            </Link>
          </div>
          <div className="panel__body">
            <div className="versionJump">
              <span className="versionJump__from">{PREVIOUS_VERSION.version}</span>
              <ArrowRight size={13} aria-hidden="true" />
              <span className="versionJump__to">{CURRENT_VERSION.version}</span>
              <span className="versionJump__when">{CURRENT_VERSION.createdLabel}</span>
            </div>
            <p className="versionTrigger">
              Created from <Link className="ref" to="/evidence?id=EV-041">EV-041</Link> {CURRENT_VERSION.trigger}
            </p>
            <ul className="diffList">
              {CURRENT_VERSION.diff.added.map((entry) => (
                <li key={entry} className="diffList__item diffList__item--add">
                  <span className="diffList__glyph">+</span>
                  {entry}
                </li>
              ))}
              {CURRENT_VERSION.diff.changed.map((entry) => (
                <li key={entry} className="diffList__item diffList__item--change">
                  <span className="diffList__glyph">~</span>
                  {entry}
                </li>
              ))}
              {CURRENT_VERSION.diff.removed.map((entry) => (
                <li key={entry} className="diffList__item diffList__item--remove">
                  <span className="diffList__glyph">−</span>
                  {entry}
                </li>
              ))}
            </ul>
            <p className="versionBy">{CURRENT_VERSION.publishedBy}</p>
          </div>
        </section>
      </div>

      <section className="panel" aria-labelledby="surface-title">
        <div className="panel__head">
          <h2 className="panel__title" id="surface-title">
            Attack surface
          </h2>
          <Link className="panel__meta panel__meta--link" to="/model#architecture">
            Open architecture
            <ArrowRight size={11} aria-hidden="true" />
          </Link>
        </div>
        <div className="panel__body surfaceBody">
          <div className="surfaceGraph">
            <ArchitectureGraph compact highlightPath={RISKY_PATH} newInVersion="v18" />
          </div>
          <aside className="surfaceNotes">
            <GraphLegend riskyLabel="Unprotected replay route" />
            <div className="divider" />
            <p className="surfaceNotes__text">
              The acquirer callback added in v18 crosses <Link className="ref" to="/model#trust-boundaries">TB-01</Link>{' '}
              and becomes a second producer on the event queue. The signature is verified; the replay window is not
              bounded.
            </p>
            <Link className="btn btn--block" to="/findings?id=FIND-107">
              Open FIND-107
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
            <dl className="surfaceStats">
              <div>
                <dt>Components</dt>
                <dd>{METRICS.components}</dd>
              </div>
              <div>
                <dt>Data flows</dt>
                <dd>{METRICS.dataFlows}</dd>
              </div>
              <div>
                <dt>Boundary crossings</dt>
                <dd>{METRICS.boundaryCrossings}</dd>
              </div>
              <div>
                <dt>Attack paths</dt>
                <dd>{METRICS.attackPaths}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <div className="grid grid--attention">
        <section className="panel" aria-labelledby="attention-title">
          <div className="panel__head">
            <h2 className="panel__title" id="attention-title">
              Needs attention
            </h2>
            <Link className="panel__meta panel__meta--link" to="/findings">
              All {METRICS.openFindings} open findings
              <ArrowRight size={11} aria-hidden="true" />
            </Link>
          </div>
          <ul className="attentionList">
            {ATTENTION_FINDINGS.map((finding) => (
              <li key={finding.id}>
                <Link className="attentionRow" to={`/findings?id=${finding.id}`}>
                  <span className="attentionRow__sev">
                    <SeverityBadge severity={finding.severity} />
                  </span>
                  <span className="attentionRow__main">
                    <span className="attentionRow__title">{finding.title}</span>
                    <span className="attentionRow__meta">
                      <span className="u-mono">{finding.id}</span>
                      <span aria-hidden="true">·</span>
                      {finding.target}
                      <span aria-hidden="true">·</span>
                      {finding.type}
                    </span>
                  </span>
                  <span className="attentionRow__when">Detected {finding.detectedLabel}</span>
                  <ArrowRight size={13} className="attentionRow__go" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="stack">
          <section className="panel" aria-labelledby="notif-title">
            <div className="panel__head">
              <h2 className="panel__title" id="notif-title">
                Attention queue
              </h2>
              <span className="panel__meta">{METRICS.needsReview} awaiting review</span>
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
              <ActivityTimeline events={MODEL_ACTIVITY.slice(0, 9)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
