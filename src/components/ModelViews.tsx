import { Link } from 'react-router-dom'
import {
  ATTACK_PATHS,
  COMPONENTS,
  CURRENT_VERSION,
  DATA_FLOWS,
  MODEL_COMPARISONS,
  MODEL_VERSIONS,
  PREVIOUS_VERSION,
  PROPOSED_VERSION,
  componentById,
  type AttackPath as AttackPathModel,
} from '@/data'
import { useModelSession } from '@/lib/model-session'
import { ArchitectureGraph, GraphLegend } from './ArchitectureGraph'
import { AttackPathView } from './AttackPath'
import { SeverityBadge, StatusBadge } from './Badges'
import { EntityRef, RefList, SourceChip } from './EntityRef'

const RISKY_PATH = ['CMP-00', 'CMP-04', 'CMP-05', 'CMP-06']

export function ArchitectureView({
  entity,
  onSelect,
  showProposed,
  onShowProposed,
}: {
  entity: string | null
  onSelect: (id: string | null) => void
  showProposed: boolean
  onShowProposed: (value: boolean) => void
}) {
  const session = useModelSession()
  const proposedOn = showProposed || session.webhookApproved

  return (
    <div className="modelView">
      <div className="modelView__toolbar">
        <p className="prose">
          Current model <strong>{session.currentVersion}</strong>
          {session.webhookApproved ? null : ' · proposed additions from PR #182 are hidden unless shown'}
        </p>
        {session.webhookApproved ? null : (
          <label className="toggle">
            <input type="checkbox" checked={showProposed} onChange={(event) => onShowProposed(event.target.checked)} />
            Show proposed changes
          </label>
        )}
      </div>

      <div className="graphFrame graphFrame--wide">
        <ArchitectureGraph
          selectedId={entity}
          onSelect={(id) => onSelect(id)}
          highlightPath={proposedOn ? RISKY_PATH : []}
          showProposed={showProposed}
          includeApprovedProposal={session.webhookApproved}
          newInVersion="v19"
        />
      </div>
      <div className="graphFrame__foot">
        <GraphLegend riskyLabel="Unprotected replay route" proposed={showProposed && !session.webhookApproved} />
        <span className="panel__meta">Select a node for provenance</span>
      </div>
    </div>
  )
}

export function AttackPathsView({
  path,
  onSelectPath,
}: {
  path: AttackPathModel
  onSelectPath: (id: string) => void
}) {
  return (
    <div className="pathExplorer">
      <aside className="pathExplorer__list" aria-label="Attack paths">
        <h3 className="def__label">Attack paths</h3>
        <ul>
          {ATTACK_PATHS.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                className={`pathPick${candidate.id === path.id ? ' is-active' : ''}`}
                onClick={() => onSelectPath(candidate.id)}
              >
                <span className="pathPick__id">{candidate.id}</span>
                <span className="pathPick__name">{candidate.name}</span>
                <SeverityBadge severity={candidate.severity} bare />
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="pathExplorer__main">
        <div className="pathBoard__meta">
          <div>
            <div className="def__label">Entry point</div>
            <div className="def__value">{path.entryPoint ?? path.steps[0]?.label}</div>
          </div>
          <div>
            <div className="def__label">Impacted asset</div>
            <div className="def__value">
              <EntityRef id={path.target} />
            </div>
          </div>
          <div>
            <div className="def__label">Linked findings</div>
            <div className="def__value">
              <RefList ids={path.findings} />
            </div>
          </div>
          <div>
            <div className="def__label">Status</div>
            <div className="def__value">
              <StatusBadge status={path.status} />
            </div>
          </div>
        </div>
        {path.preconditions?.length ? (
          <p className="prose">Preconditions: {path.preconditions.join(' · ')}</p>
        ) : null}
        <AttackPathView path={path} />
        {path.evidence?.length ? (
          <div className="sourceChipRow">
            {path.evidence.map((id) => (
              <SourceChip key={id} id={id} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ChangesView({
  compare,
  onCompare,
}: {
  compare: string | null
  onCompare: (version: string | null) => void
}) {
  const session = useModelSession()
  const comparison = MODEL_COMPARISONS.find((item) => item.from === compare && item.to === 'v18')
  const proposal = session.webhookApproved
    ? { ...PROPOSED_VERSION, status: 'Current' as const, publishedBy: 'Dana Okoye', createdLabel: 'just now' }
    : PROPOSED_VERSION

  return (
    <div className="changesView">
      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">Model changes</h2>
          <span className="panel__meta">
            {session.currentVersion} → {session.webhookApproved ? 'v19 current' : 'proposed v19'}
          </span>
        </div>
        <div className="panel__body">
          <div className="defs defs--split">
            <div>
              <div className="def__label">Triggered by</div>
              <div className="def__value">
                <SourceChip id={proposal.triggerEvidenceId} />
              </div>
            </div>
            <div>
              <div className="def__label">Status</div>
              <div className="def__value">
                <StatusBadge status={session.webhookApproved ? 'Approved' : 'Pending approval'} />
              </div>
            </div>
          </div>

          <h3 className="def__label">Summary</h3>
          <ul className="diffList">
            <li className="diffList__item diffList__item--add">
              <span className="diffList__glyph">+</span>1 component
            </li>
            <li className="diffList__item diffList__item--add">
              <span className="diffList__glyph">+</span>2 data flows
            </li>
            <li className="diffList__item diffList__item--add">
              <span className="diffList__glyph">+</span>2 threats
            </li>
            <li className="diffList__item diffList__item--add">
              <span className="diffList__glyph">+</span>2 findings
            </li>
            <li className="diffList__item diffList__item--change">
              <span className="diffList__glyph">~</span>1 trust boundary
            </li>
            <li className="diffList__item diffList__item--change">
              <span className="diffList__glyph">↑</span>risk posture Medium → High
            </li>
          </ul>

          <div className="changeColumns">
            <div>
              <h3 className="def__label">Architecture</h3>
              <ul className="diffList">
                <li className="diffList__item diffList__item--add">
                  <span className="diffList__glyph">+</span>
                  <EntityRef id="CMP-04" /> Webhook Service
                </li>
                <li className="diffList__item diffList__item--add">
                  <span className="diffList__glyph">+</span>
                  Internet → <EntityRef id="CMP-04" />
                </li>
                <li className="diffList__item diffList__item--add">
                  <span className="diffList__glyph">+</span>
                  <EntityRef id="CMP-04" /> → <EntityRef id="CMP-05" />
                </li>
              </ul>
            </div>
            <div>
              <h3 className="def__label">Threats</h3>
              <ul className="diffList">
                <li className="diffList__item diffList__item--add">
                  <span className="diffList__glyph">+</span>
                  <EntityRef id="TM-041" /> Replay attack
                </li>
                <li className="diffList__item diffList__item--add">
                  <span className="diffList__glyph">+</span>
                  <EntityRef id="TM-048" /> Forged webhook event
                </li>
              </ul>
            </div>
            <div>
              <h3 className="def__label">Findings</h3>
              <ul className="diffList">
                <li className="diffList__item diffList__item--add">
                  <span className="diffList__glyph">+</span>
                  <EntityRef id="FIND-107" /> Missing replay protection
                </li>
                <li className="diffList__item diffList__item--add">
                  <span className="diffList__glyph">+</span>
                  <EntityRef id="FIND-109" /> Signature not validated
                </li>
              </ul>
            </div>
          </div>

          <Link className="btn" to="/overview?review=REV-021">
            {session.webhookApproved ? 'Open REV-021 record' : 'Review proposed changes'}
          </Link>
        </div>
      </section>

      <div className="grid grid--posture">
        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Model history</h2>
          </div>
          <ol className="historyList">
            {session.webhookApproved ? (
              <li className="historyList__item is-current">
                <span className="u-mono">v19</span>
                <span>Current</span>
                <span>just now</span>
              </li>
            ) : null}
            {MODEL_VERSIONS.map((version, index) => (
              <li
                key={version.version}
                className={`historyList__item${index === 0 && !session.webhookApproved ? ' is-current' : ''}`}
              >
                <button type="button" onClick={() => onCompare(version.version === 'v18' ? 'v17' : version.version)}>
                  <span className="u-mono">{version.version}</span>
                  <span>{index === 0 && !session.webhookApproved ? 'Current' : version.status ?? ''}</span>
                  <span>{version.createdLabel}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Compare</h2>
            <span className="panel__meta">
              {PREVIOUS_VERSION.version} vs {CURRENT_VERSION.version}
            </span>
          </div>
          <div className="panel__body">
            <p className="prose">
              Security-relevant changes between approved versions — not a JSON diff.
            </p>
            {comparison ? (
              <dl className="compareGrid">
                <div>
                  <dt>Architecture</dt>
                  <dd>{comparison.architecture.join(' · ')}</dd>
                </div>
                <div>
                  <dt>Threats</dt>
                  <dd>
                    + {comparison.threatsAdded} · − {comparison.threatsRemoved}
                  </dd>
                </div>
                <div>
                  <dt>Controls</dt>
                  <dd>+ {comparison.controlsAdded}</dd>
                </div>
                <div>
                  <dt>Resolved findings</dt>
                  <dd>{comparison.resolvedFindings}</dd>
                </div>
                <div>
                  <dt>New findings</dt>
                  <dd>{comparison.newFindings}</dd>
                </div>
                <div>
                  <dt>Risk posture</dt>
                  <dd>
                    {comparison.riskFrom} → {comparison.riskTo}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="u-muted">Select a historical version to compare it with v18.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export function ProposedBanner() {
  const session = useModelSession()
  const webhook = COMPONENTS.filter((c) => c.proposedInVersion === 'v19')
  const flows = DATA_FLOWS.filter((f) => f.proposedInVersion === 'v19')
  if (session.webhookApproved || webhook.length === 0) return null
  return (
    <div className="callout callout--info" role="status">
      <span>
        Current model is v18. {webhook.length} components and {flows.length} data flows from PR #182 are proposed for
        v19 and are not authoritative.{' '}
        <Link className="ref" to="/overview?review=REV-021">
          Review REV-021
        </Link>
        .
      </span>
    </div>
  )
}

export function componentName(id: string) {
  return componentById.get(id)?.name ?? id
}
