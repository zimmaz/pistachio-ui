import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  ASSUMPTIONS,
  CONTROLS,
  DATA_FLOWS,
  FINDINGS,
  THREATS,
  componentById,
  controlById,
  threatById,
} from '@/data'
import { SeverityBadge, StatusBadge } from './Badges'
import { EntityRef } from './EntityRef'

/**
 * The Model page's right-hand context panel. It only appears once something is
 * selected, so it never spends space describing nothing.
 */
export function EntityDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const component = componentById.get(id)
  const threat = threatById.get(id)

  return (
    <aside className="contextPanel" aria-label="Selection details">
      <div className="contextPanel__head">
        <span className="u-mono contextPanel__id">{id}</span>
        <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label="Close details">
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {component ? <ComponentBody id={id} /> : null}
      {threat ? <ThreatBody id={id} /> : null}
      {!component && !threat ? <p className="empty">Nothing selected.</p> : null}
    </aside>
  )
}

function ComponentBody({ id }: { id: string }) {
  const component = componentById.get(id)!
  const threats = THREATS.filter((t) => t.target === id)
  const controls = CONTROLS.filter((c) => c.components.includes(id))
  const findings = FINDINGS.filter((f) => f.targetId === id)
  const flows = DATA_FLOWS.filter((f) => f.from === id || f.to === id)
  const evidence = new Set(threats.flatMap((t) => t.evidence))

  return (
    <div className="contextPanel__body">
      <h3 className="contextPanel__title">{component.name}</h3>
      <p className="contextPanel__desc">{component.description}</p>

      <dl className="contextStats">
        <div>
          <dt>Type</dt>
          <dd>{component.kind === 'actor' ? 'External actor' : capitalize(component.kind)}</dd>
        </div>
        <div>
          <dt>Exposure</dt>
          <dd className={component.exposure === 'Internet-facing' ? 'is-exposed' : undefined}>{component.exposure}</dd>
        </div>
        <div>
          <dt>Authentication</dt>
          <dd>{component.authentication}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{component.dataHandled.join(', ')}</dd>
        </div>
      </dl>

      <div className="countGrid">
        <Count label="Threats" value={threats.length} to={`/model?entity=${id}#threats`} />
        <Count label="Controls" value={controls.length} to={`/model?entity=${id}#controls`} />
        <Count
          label="Open findings"
          value={findings.filter((f) => f.status !== 'Resolved').length}
          to={`/findings?component=${id}&scope=all`}
        />
        <Count label="Evidence" value={evidence.size} to={`/evidence?entity=${id}`} />
      </div>

      <ContextSection title={`Data flows (${flows.length})`}>
        <ul className="contextList">
          {flows.map((flow) => (
            <li key={flow.id}>
              <EntityRef id={flow.id} />
              <span>
                {componentById.get(flow.from)?.name} → {componentById.get(flow.to)?.name}
              </span>
              {flow.crossesBoundary ? <span className="chip">{flow.crossesBoundary}</span> : null}
            </li>
          ))}
        </ul>
      </ContextSection>

      {findings.length > 0 ? (
        <ContextSection title="Findings">
          <ul className="contextList">
            {findings.map((finding) => (
              <li key={finding.id}>
                <EntityRef id={finding.id} />
                <span>{finding.title}</span>
                <SeverityBadge severity={finding.severity} bare />
              </li>
            ))}
          </ul>
        </ContextSection>
      ) : null}

      <ContextSection title="Technologies">
        <div className="row row--wrap">
          {component.technologies.map((tech) => (
            <span key={tech} className="chip">
              {tech}
            </span>
          ))}
          <span className="chip chip--mono">added {component.addedInVersion}</span>
        </div>
      </ContextSection>
    </div>
  )
}

function ThreatBody({ id }: { id: string }) {
  const threat = threatById.get(id)!
  const target = componentById.get(threat.target)
  const assumptions = ASSUMPTIONS.filter((a) => (threat.assumptions ?? []).includes(a.id))

  return (
    <div className="contextPanel__body">
      <h3 className="contextPanel__title">{threat.title}</h3>
      <div className="row row--wrap contextPanel__badges">
        <SeverityBadge severity={threat.residual} label={`${threat.residual} residual`} />
        <StatusBadge status={threat.status} />
      </div>
      {threat.detail ? <p className="contextPanel__desc">{threat.detail}</p> : null}

      <dl className="contextStats">
        <div>
          <dt>Category</dt>
          <dd>{threat.category}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{target ? <EntityRef id={target.id} /> : threat.target} {target?.name}</dd>
        </div>
        <div>
          <dt>Likelihood</dt>
          <dd>{threat.likelihood}</dd>
        </div>
        <div>
          <dt>Impact</dt>
          <dd>{threat.impact}</dd>
        </div>
      </dl>

      {threat.prerequisites?.length ? (
        <ContextSection title="Attack prerequisites">
          <ul className="prereqList">
            {threat.prerequisites.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ContextSection>
      ) : null}

      <ContextSection title="Mitigating controls">
        <ul className="contextList">
          {threat.controls.map((controlId) => {
            const control = controlById.get(controlId)
            return (
              <li key={controlId}>
                <EntityRef id={controlId} />
                <span>{control?.name}</span>
                {control ? <StatusBadge status={control.status} /> : null}
              </li>
            )
          })}
        </ul>
      </ContextSection>

      {threat.findings.length > 0 ? (
        <ContextSection title="Linked findings">
          <ul className="contextList">
            {threat.findings.map((findingId) => (
              <li key={findingId}>
                <EntityRef id={findingId} />
              </li>
            ))}
          </ul>
        </ContextSection>
      ) : null}

      {assumptions.length > 0 ? (
        <ContextSection title="Depends on assumptions">
          <ul className="contextList">
            {assumptions.map((assumption) => (
              <li key={assumption.id}>
                <EntityRef id={assumption.id} />
                <span>{assumption.statement}</span>
                <StatusBadge status={assumption.status} />
              </li>
            ))}
          </ul>
        </ContextSection>
      ) : null}

      <ContextSection title="Evidence">
        <ul className="contextList">
          {threat.evidence.map((evidenceId) => (
            <li key={evidenceId}>
              <EntityRef id={evidenceId} />
            </li>
          ))}
        </ul>
      </ContextSection>
    </div>
  )
}

function ContextSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="contextSection">
      <h4 className="def__label">{title}</h4>
      {children}
    </section>
  )
}

function Count({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link className="countCell" to={to}>
      <span className="countCell__value">{value}</span>
      <span className="countCell__label">{label}</span>
    </Link>
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
