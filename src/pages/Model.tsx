import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, History } from 'lucide-react'
import {
  ASSETS,
  ASSUMPTIONS,
  ATTACK_PATHS,
  COMPONENTS,
  CONTROLS,
  CURRENT_VERSION,
  DATA_FLOWS,
  METRICS,
  MODEL_SECTIONS,
  MODEL_VERSIONS,
  PROJECT,
  RISK_EXCEPTIONS,
  SEVERITY_RANK,
  THREATS,
  TRUST_BOUNDARIES,
  componentById,
  findingById,
  threatById,
} from '@/data'
import { ArchitectureGraph, GraphLegend } from '@/components/ArchitectureGraph'
import { AttackPathView } from '@/components/AttackPath'
import { SeverityBadge, StatusBadge } from '@/components/Badges'
import { EntityDetails } from '@/components/EntityDetails'
import { EntityRef, RefList } from '@/components/EntityRef'
import { ArchitectureView, AttackPathsView, ChangesView, ProposedBanner } from '@/components/ModelViews'
import { useActiveSection } from '@/lib/hooks'
import { useModelSession } from '@/lib/model-session'
import { isProposedFor, visibleObjects } from '@/lib/model-visibility'

const SECTION_IDS = MODEL_SECTIONS.map((s) => s.id)
const RISKY_PATH = ['CMP-00', 'CMP-04', 'CMP-05', 'CMP-06']
const VIEWS = [
  { id: 'document', label: 'Document' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'paths', label: 'Attack Paths' },
  { id: 'changes', label: 'Changes' },
] as const

export function Model() {
  const [params, setParams] = useSearchParams()
  const [versionIndex, setVersionIndex] = useState(0)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [docProposed, setDocProposed] = useState(false)
  const active = useActiveSection(SECTION_IDS)
  const { hash } = useLocation()

  // Cross-page entity links carry a section hash; the router does not scroll for us.
  useEffect(() => {
    if (!hash) return
    const target = document.getElementById(hash.slice(1))
    target?.scrollIntoView({ block: 'start' })
  }, [hash])

  const session = useModelSession()
  const entity = params.get('entity')
  const pathId = params.get('path') ?? ATTACK_PATHS[0].id
  const view = (params.get('view') as (typeof VIEWS)[number]['id'] | null) ?? 'document'
  const selectedIsProposed = Boolean(entity && (componentById.get(entity)?.proposedInVersion || threatById.get(entity)?.proposedInVersion))
  const showProposed = params.get('proposed') === '1' || selectedIsProposed
  const compare = params.get('compare')
  const version = MODEL_VERSIONS[versionIndex]
  const path = ATTACK_PATHS.find((p) => p.id === pathId) ?? ATTACK_PATHS[0]

  const patch = useCallback(
    (next: Record<string, string | null>) => {
      const merged = new URLSearchParams(params)
      for (const [key, value] of Object.entries(next)) {
        if (value === null) merged.delete(key)
        else merged.set(key, value)
      }
      setParams(merged, { replace: true })
    },
    [params, setParams],
  )

  const visibleComponents = useMemo(
    () => visibleObjects(COMPONENTS, session.currentVersion, docProposed),
    [docProposed, session.currentVersion],
  )
  const visibleFlows = useMemo(
    () => visibleObjects(DATA_FLOWS, session.currentVersion, docProposed),
    [docProposed, session.currentVersion],
  )
  const visiblePaths = useMemo(
    () => visibleObjects(ATTACK_PATHS, session.currentVersion, docProposed),
    [docProposed, session.currentVersion],
  )
  const sortedThreats = useMemo(
    () =>
      visibleObjects(THREATS, session.currentVersion, docProposed)
        .sort((a, b) => SEVERITY_RANK[a.residual] - SEVERITY_RANK[b.residual])
        .slice(0, 14),
    [docProposed, session.currentVersion],
  )

  return (
    <div className={`modelLayout${entity ? ' has-context' : ''}${view !== 'document' ? ' is-view' : ''}`}>
      <div className="modelTabs" role="tablist" aria-label="Model views">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            className={`modelTabs__tab${view === item.id ? ' is-active' : ''}`}
            onClick={() => patch({ view: item.id === 'document' ? null : item.id })}
          >
            {item.label}
          </button>
        ))}
      </div>

      {view === 'architecture' ? (
        <>
          <ArchitectureView
            entity={entity}
            onSelect={(id) => patch({ entity: id, view: 'architecture' })}
            showProposed={showProposed}
            onShowProposed={(value) => patch({ proposed: value ? '1' : null, view: 'architecture' })}
          />
          {entity ? <EntityDetails id={entity} onClose={() => patch({ entity: null })} /> : null}
        </>
      ) : null}

      {view === 'paths' ? (
        <AttackPathsView path={path} onSelectPath={(id) => patch({ path: id, view: 'paths' })} />
      ) : null}

      {view === 'changes' ? (
        <ChangesView compare={compare} onCompare={(value) => patch({ compare: value, view: 'changes' })} />
      ) : null}

      {view !== 'document' ? null : (
      <>
      <nav className="modelToc" aria-label="Model contents">
        <div className="modelToc__inner">
          <div className="modelToc__version">
            <div className="def__label">Model version</div>
            <div className="versionControl">
              <button
                type="button"
                className="btn btn--quiet btn--icon"
                aria-label="Previous version"
                disabled={versionIndex >= MODEL_VERSIONS.length - 1}
                onClick={() => setVersionIndex((i) => Math.min(i + 1, MODEL_VERSIONS.length - 1))}
              >
                <ChevronLeft size={14} aria-hidden="true" />
              </button>
              <span className="versionControl__value">{version.version}</span>
              <button
                type="button"
                className="btn btn--quiet btn--icon"
                aria-label="Next version"
                disabled={versionIndex === 0}
                onClick={() => setVersionIndex((i) => Math.max(i - 1, 0))}
              >
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
            <p className="modelToc__versionMeta">
              {version.createdLabel} · {version.trigger}
            </p>
            <ul className="diffList diffList--tiny">
              {version.diff.added.slice(0, 3).map((entry) => (
                <li key={entry} className="diffList__item diffList__item--add">
                  {entry}
                </li>
              ))}
              {version.diff.changed.slice(0, 2).map((entry) => (
                <li key={entry} className="diffList__item diffList__item--change">
                  {entry}
                </li>
              ))}
            </ul>
            {versionIndex !== 0 ? (
              <button type="button" className="btn btn--block" onClick={() => setVersionIndex(0)}>
                Return to {CURRENT_VERSION.version}
              </button>
            ) : null}
          </div>

          <ol className="modelToc__list">
            {MODEL_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={`modelToc__link${active === section.id ? ' is-active' : ''}`}
                  aria-current={active === section.id ? 'true' : undefined}
                >
                  <span className="modelToc__num">{section.number}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <article className="modelDoc">
        <header className="modelDoc__head">
          <div>
            <h1 className="pageHead__title">Threat model</h1>
            <p className="pageHead__lede">
              {PROJECT.name} · {PROJECT.environment}. Current model {session.currentVersion}
              {session.webhookApproved ? '' : ` · ${session.pendingProposalCount} pending proposals`}. Last approved{' '}
              {session.lastApprovedLabel}.
            </p>
          </div>
          <div className="row row--wrap">
            <span className="chip chip--mono">{visibleComponents.length} components</span>
            <span className="chip chip--mono">{sortedThreats.length} threats</span>
            <span className="chip chip--mono">{METRICS.controls} controls</span>
            {session.webhookApproved ? null : (
              <label className="toggle">
                <input type="checkbox" checked={docProposed} onChange={(event) => setDocProposed(event.target.checked)} />
                Show proposed changes
              </label>
            )}
          </div>
        </header>

        {versionIndex !== 0 ? (
          <div className="callout callout--info" role="status">
            <History size={14} className="callout__icon" aria-hidden="true" />
            <span>
              Reading the {version.version} changelog. The document below renders the published model,{' '}
              {CURRENT_VERSION.version}.{' '}
              <button type="button" className="linkButton" onClick={() => setVersionIndex(0)}>
                Return to {CURRENT_VERSION.version}
              </button>
            </span>
          </div>
        ) : null}

        <ProposedBanner />

        <ModelSection id="system-overview" number="1" title="System Overview">
          <p className="prose">
            The {PROJECT.name} accepts card payments from the customer-facing checkout client, authorizes them through
            the acquirer, and reconciles settlement asynchronously. It runs as four services and one datastore inside a
            single production account, with two trust boundaries: the production edge and the data layer.
          </p>
          <p className="prose">
            {session.webhookApproved
              ? 'Model v19 now includes inbound settlement callbacks from the acquirer. That is the first flow where an external party initiates the request rather than responding to one.'
              : 'PR #182 proposes inbound settlement callbacks from the acquirer. That change is not in the approved v18 model. Agents proposed it; REV-021 is waiting for a human.'}
          </p>
          <div className="callout callout--brand">
            <span>
              Highest residual risk sits on <EntityRef id="CMP-03" /> Payment API, driven by{' '}
              <EntityRef id="TM-003" /> and <EntityRef id="TM-014" />. Two findings on this component have no recorded
              decision.
            </span>
          </div>
        </ModelSection>

        <ModelSection id="architecture" number="2" title="Architecture">
          <p className="prose">
            External traffic enters through the production API Gateway, which terminates TLS, applies the managed rule
            set and forwards authenticated requests to the Payment API over mutual TLS. The Payment API reads and
            writes the primary PostgreSQL store and produces payment events onto the queue.
            {session.webhookApproved || docProposed
              ? ' PR #182 adds the Webhook Service as a second producer on that queue.'
              : ' The Webhook Service from PR #182 is proposed for v19 and is hidden until you show proposed changes.'}
          </p>

          <div className="graphFrame">
            <ArchitectureGraph
              selectedId={entity}
              onSelect={(id) => patch({ entity: id })}
              highlightPath={docProposed || session.webhookApproved ? RISKY_PATH : []}
              showProposed={docProposed}
              includeApprovedProposal={session.webhookApproved}
              newInVersion="v19"
            />
          </div>
          <div className="graphFrame__foot">
            <GraphLegend riskyLabel="Unprotected replay route" />
            <span className="panel__meta">Select a node to open its details</span>
          </div>

          <div className="tableWrap">
            <table className="table table--doc">
              <caption className="u-visually-hidden">Components in the current model</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Component</th>
                  <th scope="col">Type</th>
                  <th scope="col">Exposure</th>
                  <th scope="col">Authentication</th>
                  <th scope="col" className="cell-num">
                    Threats
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleComponents.map((component) => (
                  <tr
                    key={component.id}
                    className={entity === component.id ? 'is-selected' : undefined}
                    tabIndex={0}
                    onClick={() => patch({ entity: component.id })}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        patch({ entity: component.id })
                      }
                    }}
                  >
                    <td className="cell-mono">{component.id}</td>
                    <td className="cell-primary">
                      {component.name}
                      {isProposedFor(component, session.currentVersion) ? (
                        <span className="chip chip--mono">Proposed for v19 · PR #182</span>
                      ) : null}
                    </td>
                    <td className="cell-nowrap">{component.kind === 'actor' ? 'External actor' : component.kind}</td>
                    <td className="cell-nowrap">
                      {component.exposure === 'Internet-facing' ? (
                        <span className="exposureFlag">Internet-facing</span>
                      ) : (
                        component.exposure
                      )}
                    </td>
                    <td>{component.authentication}</td>
                    <td className="cell-num cell-mono">{THREATS.filter((t) => t.target === component.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModelSection>

        <ModelSection id="assets" number="3" title="Assets">
          <p className="prose">
            Three assets carry the platform's risk. Everything else in the system is valuable only because it can reach
            one of them.
          </p>
          <ul className="assetList">
            {ASSETS.map((asset) => (
              <li key={asset.id} className="assetRow">
                <div className="assetRow__head">
                  <EntityRef id={asset.id} />
                  <span className="assetRow__name">{asset.name}</span>
                  <span className="chip">{asset.classification}</span>
                </div>
                <p className="prose">{asset.description}</p>
                <div className="assetRow__meta">
                  <span className="assetRow__stores">
                    Stored in <RefList ids={asset.storedIn} />
                  </span>
                  <span>{asset.threats} threats reference this asset</span>
                </div>
              </li>
            ))}
          </ul>
        </ModelSection>

        <ModelSection id="trust-boundaries" number="4" title="Trust Boundaries">
          {TRUST_BOUNDARIES.map((boundary) => (
            <div key={boundary.id} className="boundaryBlock">
              <div className="boundaryBlock__head">
                <EntityRef id={boundary.id} />
                <span className="boundaryBlock__name">{boundary.name}</span>
                <span className="chip chip--mono">{boundary.crossings.length} crossings</span>
              </div>
              <p className="prose">{boundary.description}</p>
              <div className="row row--wrap">
                {boundary.crossings.map((flowId) => {
                  const flow = DATA_FLOWS.find((f) => f.id === flowId)!
                  return (
                    <span key={flowId} className="crossingChip">
                      <EntityRef id={flowId} />
                      {componentById.get(flow.from)?.name} → {componentById.get(flow.to)?.name}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </ModelSection>

        <ModelSection id="data-flows" number="5" title="Data Flows">
          <div className="tableWrap">
            <table className="table table--doc table--static">
              <caption className="u-visually-hidden">Data flows in the current model</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">From → To</th>
                  <th scope="col">Protocol</th>
                  <th scope="col">Data</th>
                  <th scope="col">Boundary</th>
                  <th scope="col">Added</th>
                </tr>
              </thead>
              <tbody>
                {visibleFlows.map((flow) => (
                  <tr key={flow.id}>
                    <td className="cell-mono">{flow.id}</td>
                    <td className="cell-primary cell-nowrap">
                      {componentById.get(flow.from)?.name} → {componentById.get(flow.to)?.name}
                    </td>
                    <td className="cell-mono">{flow.protocol}</td>
                    <td>
                      {flow.data}
                      {isProposedFor(flow, session.currentVersion) ? (
                        <span className="chip chip--mono">Proposed for v19 · PR #182</span>
                      ) : null}
                      {flow.notes ? <span className="flowNote">{flow.notes}</span> : null}
                    </td>
                    <td className="cell-nowrap">
                      {flow.crossesBoundary ? <span className="exposureFlag">{flow.crossesBoundary}</span> : '—'}
                    </td>
                    <td className="cell-mono">{flow.addedInVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModelSection>

        <ModelSection id="threats" number="6" title="Threats">
          <p className="prose">
            {METRICS.activeThreats} active threats are modelled across {METRICS.components} components. The fourteen
            with the highest residual risk are listed here; select one to open its prerequisites, controls and
            evidence.
          </p>
          <div className="tableWrap">
            <table className="table table--doc">
              <caption className="u-visually-hidden">Highest residual-risk threats</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Threat</th>
                  <th scope="col">Category</th>
                  <th scope="col">Target</th>
                  <th scope="col">Likelihood</th>
                  <th scope="col">Impact</th>
                  <th scope="col">Residual</th>
                </tr>
              </thead>
              <tbody>
                {sortedThreats.map((threat) => (
                  <tr
                    key={threat.id}
                    className={entity === threat.id ? 'is-selected' : undefined}
                    tabIndex={0}
                    onClick={() => patch({ entity: threat.id })}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        patch({ entity: threat.id })
                      }
                    }}
                  >
                    <td className="cell-mono">{threat.id}</td>
                    <td className="cell-primary">
                      {threat.title}
                      {isProposedFor(threat, session.currentVersion) ? (
                        <span className="chip chip--mono">Proposed for v19 · PR #182</span>
                      ) : null}
                    </td>
                    <td className="cell-nowrap">{threat.category}</td>
                    <td className="cell-nowrap">{componentById.get(threat.target)?.name}</td>
                    <td>{threat.likelihood}</td>
                    <td>{threat.impact}</td>
                    <td>
                      <SeverityBadge severity={threat.residual} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModelSection>

        <ModelSection id="attack-paths" number="7" title="Attack Paths">
          <p className="prose">
            An attack path is a chain the model can actually walk: an actor, a technique, the components it traverses,
            the privilege it acquires and the asset it reaches. Controls are shown at the step they would break.
          </p>

          <div className="pathTabs" role="group" aria-label="Attack paths">
            {visiblePaths.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                aria-pressed={candidate.id === path.id}
                className={`pathTab${candidate.id === path.id ? ' is-active' : ''}`}
                onClick={() => {
                  patch({ path: candidate.id })
                  setSelectedStep(null)
                }}
              >
                <span className="pathTab__id">{candidate.id}</span>
                <span className="pathTab__name">
                  {candidate.name}
                  {isProposedFor(candidate, session.currentVersion) ? ' · proposed' : ''}
                </span>
                <SeverityBadge severity={candidate.severity} bare />
              </button>
            ))}
          </div>

          <div className="pathBoard">
            <div className="pathBoard__meta">
              <div>
                <div className="def__label">Reaches</div>
                <div className="def__value">
                  <EntityRef id={path.target} />
                </div>
              </div>
              <div>
                <div className="def__label">Likelihood</div>
                <div className="def__value">{path.likelihood}</div>
              </div>
              <div>
                <div className="def__label">Status</div>
                <div className="def__value">
                  <StatusBadge status={path.status} />
                </div>
              </div>
              <div>
                <div className="def__label">Findings</div>
                <div className="def__value">
                  <RefList ids={path.findings} />
                </div>
              </div>
            </div>
            <AttackPathView path={path} selectedStep={selectedStep} onSelectStep={setSelectedStep} />
          </div>
        </ModelSection>

        <ModelSection id="controls" number="8" title="Security Controls">
          <p className="prose">
            {METRICS.controlsImplemented} of {METRICS.controls} controls are fully implemented. Partial and planned
            controls are the ones attack paths walk through.
          </p>
          <div className="tableWrap">
            <table className="table table--doc table--static">
              <caption className="u-visually-hidden">Security controls</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Control</th>
                  <th scope="col">Family</th>
                  <th scope="col">Status</th>
                  <th scope="col">Components</th>
                  <th scope="col">Verified by</th>
                </tr>
              </thead>
              <tbody>
                {CONTROLS.map((control) => (
                  <tr key={control.id}>
                    <td className="cell-mono">{control.id}</td>
                    <td className="cell-primary">{control.name}</td>
                    <td className="cell-nowrap">{control.family}</td>
                    <td className="cell-nowrap">
                      <StatusBadge status={control.status} />
                    </td>
                    <td className="cell-mono">{control.components.join(' ')}</td>
                    <td className="cell-mono">
                      <EntityRef id={control.verifiedBy} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModelSection>

        <ModelSection id="assumptions" number="9" title="Assumptions">
          <p className="prose">
            An assumption is a claim the model relies on but cannot prove from evidence. {METRICS.unverifiedAssumptions}{' '}
            are unverified and {METRICS.contradictedAssumptions} are contradicted by a later source.
          </p>
          <ul className="assumptionList">
            {ASSUMPTIONS.map((assumption) => (
              <li
                key={assumption.id}
                className={`assumptionRow assumptionRow--${assumption.status.toLowerCase()}${entity === assumption.id ? ' is-selected' : ''}`}
                onClick={() => patch({ entity: assumption.id })}
              >
                <div className="assumptionRow__head">
                  <EntityRef id={assumption.id} />
                  <StatusBadge status={assumption.status} />
                  <span className="assumptionRow__owner">{assumption.owner}</span>
                </div>
                <p className="assumptionRow__text">{assumption.statement}</p>
                <div className="assumptionRow__meta">
                  <span>
                    Source <EntityRef id={assumption.source} />
                  </span>
                  <span className="assetRow__stores">
                    Affects <RefList ids={assumption.relatedThreats} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </ModelSection>

        <ModelSection id="risks" number="10" title="Risks & Decisions">
          <p className="prose">
            Residual risk that a named human has chosen to carry. Pistachio records the decision, the owner, the
            approver and the expiry — and reopens the finding when the acceptance lapses.
          </p>
          {RISK_EXCEPTIONS.map((exception) => (
            <article key={exception.id} className="decisionCard">
              <header className="decisionCard__head">
                <EntityRef id={exception.id} />
                <StatusBadge status={exception.status} />
                <span className="decisionCard__expiry">
                  Expires {exception.expires}
                  {exception.expiresInDays <= 14 ? (
                    <span className="decisionCard__soon"> · in {exception.expiresInDays} days</span>
                  ) : null}
                </span>
              </header>

              <h3 className="decisionCard__title">{exception.findingTitle}</h3>
              <p className="prose">{exception.justification}</p>

              <div className="decisionGrid">
                <div>
                  <div className="def__label">Finding</div>
                  <div className="def__value">
                    <EntityRef id={exception.findingId} />{' '}
                    {findingById.get(exception.findingId)?.status ?? ''}
                  </div>
                </div>
                <div>
                  <div className="def__label">Residual risk</div>
                  <div className="def__value">
                    <SeverityBadge severity={exception.residual} />
                  </div>
                </div>
                <div>
                  <div className="def__label">Risk owner</div>
                  <div className="def__value">{exception.riskOwner}</div>
                </div>
                <div>
                  <div className="def__label">Security approver</div>
                  <div className="def__value">{exception.securityApprover}</div>
                </div>
                <div>
                  <div className="def__label">Compensating controls</div>
                  <div className="def__value">{exception.compensatingControls.join(' · ')}</div>
                </div>
              </div>

              {exception.scopeNote ? (
                <div className="callout callout--risk">
                  <span>{exception.scopeNote}</span>
                </div>
              ) : null}
            </article>
          ))}
        </ModelSection>
      </article>

      {entity ? <EntityDetails id={entity} onClose={() => patch({ entity: null })} /> : null}
      </>
      )}
    </div>
  )
}

function ModelSection({
  id,
  number,
  title,
  children,
}: {
  id: string
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="modelSection" id={id} aria-labelledby={`${id}-title`}>
      <h2 className="modelSection__title" id={`${id}-title`}>
        <span className="modelSection__num">{number}</span>
        {title}
      </h2>
      <div className="modelSection__body">{children}</div>
    </section>
  )
}
