import { useSearchParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { AGENTS, AGENT_ACTIVITY, METRICS, findingById } from '@/data'
import { ActivityTimeline } from '@/components/ActivityTimeline'
import { SeverityBadge, StatusBadge } from '@/components/Badges'
import { EntityRef } from '@/components/EntityRef'
import { useModelSession } from '@/lib/model-session'

export function Agents() {
  const [params, setParams] = useSearchParams()
  const expanded = params.get('id') ?? AGENTS[0].id
  const session = useModelSession()

  const toggle = (id: string) => {
    const merged = new URLSearchParams(params)
    if (expanded === id) merged.delete('id')
    else merged.set('id', id)
    setParams(merged, { replace: true })
  }

  const awaiting = AGENTS.reduce((acc, agent) => acc + agent.proposalsAwaitingReview, 0)

  return (
    <div className="page">
      <header className="pageHead">
        <div>
          <h1 className="pageHead__title">Agents</h1>
          <p className="pageHead__lede">
            Automated workers attached to this project. They analyze evidence and propose model changes. They cannot
            publish a version, create an authoritative finding, or accept residual risk.
          </p>
        </div>
        <div className="pageHead__facts">
          <div className="fact">
            <span className="fact__label">Active</span>
            <span className="fact__value fact__value--big">{METRICS.activeAgents}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Pending proposals</span>
            <span className="fact__value">{session.pendingProposalCount}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Awaiting human review</span>
            <span className="fact__value">{awaiting}</span>
          </div>
        </div>
      </header>

      <div className="grid grid--agents">
        <section className="panel panel__body--tight" aria-label="Agents">
          <ul className="agentList">
            {AGENTS.map((agent) => {
              const open = expanded === agent.id
              const authority = agent.authority
              return (
                <li key={agent.id} className={`agentRow${open ? ' is-open' : ''}`}>
                  <h2>
                    <button
                      type="button"
                      className="agentRow__trigger"
                      aria-expanded={open}
                      onClick={() => toggle(agent.id)}
                    >
                      <ChevronRight size={14} className="agentRow__caret" aria-hidden="true" />
                      <span className="agentRow__name">{agent.name}</span>
                      <StatusBadge status={agent.state} />
                      <span className="agentRow__last">
                        {agent.lastRunTarget} · {agent.lastRunLabel}
                      </span>
                      <span className="agentRow__counts">
                        <span title="Model changes proposed">{agent.modelChanges} proposed</span>
                        <span aria-hidden="true">·</span>
                        <span title="Findings generated">{agent.findingsGenerated.length} findings</span>
                      </span>
                    </button>
                  </h2>

                  {open ? (
                    <div className="agentRow__detail">
                      <p className="prose">{agent.responsibility}</p>

                      <div className="defs defs--split">
                        <div>
                          <div className="def__label">Responsibility</div>
                          <div className="def__value">{agent.responsibility}</div>
                        </div>
                        <div>
                          <div className="def__label">Trigger</div>
                          <div className="def__value">{agent.trigger ?? agent.nextTrigger}</div>
                        </div>
                        <div>
                          <div className="def__label">Inputs</div>
                          <div className="def__value">{agent.inputs.join(' · ')}</div>
                        </div>
                        <div>
                          <div className="def__label">Last run</div>
                          <div className="def__value">
                            <EntityRef id={agent.lastRunEvidenceId} /> {agent.lastRunLabel}
                          </div>
                        </div>
                      </div>

                      {authority ? (
                        <div className="authorityCard">
                          <div className="def__label">Authority</div>
                          <dl className="authorityGrid">
                            <div>
                              <dt>Can analyze</dt>
                              <dd>{authority.canAnalyze ? 'Yes' : 'No'}</dd>
                            </div>
                            <div>
                              <dt>Can create findings</dt>
                              <dd>{authority.canCreateFindings}</dd>
                            </div>
                            <div>
                              <dt>Can modify model</dt>
                              <dd>{authority.canModifyModel ? 'Yes' : 'No'}</dd>
                            </div>
                            <div>
                              <dt>Can accept risk</dt>
                              <dd>{authority.canAcceptRisk ? 'Yes' : 'No'}</dd>
                            </div>
                          </dl>
                          <p className="prose u-muted">Approval · Human review required</p>
                        </div>
                      ) : null}

                      {agent.metrics30d ? (
                        <div>
                          <div className="def__label">Last 30 days</div>
                          <dl className="metrics30">
                            <div>
                              <dt>Runs</dt>
                              <dd>{agent.metrics30d.runs}</dd>
                            </div>
                            <div>
                              <dt>Proposals</dt>
                              <dd>{agent.metrics30d.proposals}</dd>
                            </div>
                            <div>
                              <dt>Accepted</dt>
                              <dd>{agent.metrics30d.accepted}</dd>
                            </div>
                            <div>
                              <dt>Rejected</dt>
                              <dd>{agent.metrics30d.rejected}</dd>
                            </div>
                            <div>
                              <dt>Pending</dt>
                              <dd>{agent.metrics30d.pending}</dd>
                            </div>
                          </dl>
                        </div>
                      ) : null}

                      {agent.findingsGenerated.length > 0 ? (
                        <div>
                          <div className="def__label">Findings proposed</div>
                          <ul className="controlList">
                            {agent.findingsGenerated.map((id) => {
                              const finding = findingById.get(id)
                              if (!finding) return null
                              return (
                                <li key={id} className="controlList__item">
                                  <EntityRef id={id} />
                                  <span className="controlList__name">{finding.title}</span>
                                  <SeverityBadge severity={finding.severity} />
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ) : null}

                      {agent.proposalsAwaitingReview > 0 ? (
                        <div className="callout callout--info">
                          <span>
                            {agent.proposalsAwaitingReview} proposed change
                            {agent.proposalsAwaitingReview > 1 ? 's are' : ' is'} waiting for a human to accept or
                            reject. The approved model was not updated.
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="panel" aria-labelledby="agent-activity-title">
          <div className="panel__head">
            <h2 className="panel__title" id="agent-activity-title">
              Activity — PR #182
            </h2>
            <span className="panel__meta">Aug 22 · 12:04 – 12:18</span>
          </div>
          <div className="panel__body">
            <ActivityTimeline events={AGENT_ACTIVITY} dense />
            <div className="divider divider--gutter" />
            <p className="prose u-muted">
              The PR Review Agent observed the structural change and proposed it. The Threat Analysis Agent scored the
              affected subgraph and proposed findings. No agent published a model version. REV-021 is waiting for a
              human.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
