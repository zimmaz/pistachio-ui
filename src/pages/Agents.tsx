import { useSearchParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { AGENTS, AGENT_ACTIVITY, METRICS, findingById } from '@/data'
import { ActivityTimeline } from '@/components/ActivityTimeline'
import { SeverityBadge, StatusBadge } from '@/components/Badges'
import { EntityRef } from '@/components/EntityRef'

export function Agents() {
  const [params, setParams] = useSearchParams()
  const expanded = params.get('id') ?? AGENTS[0].id

  const toggle = (id: string) => {
    const merged = new URLSearchParams(params)
    if (expanded === id) merged.delete('id')
    else merged.set('id', id)
    setParams(merged, { replace: true })
  }

  const totalRuns = AGENTS.reduce((acc, agent) => acc + agent.runsThisWeek, 0)
  const awaiting = AGENTS.reduce((acc, agent) => acc + agent.proposalsAwaitingReview, 0)

  return (
    <div className="page">
      <header className="pageHead">
        <div>
          <h1 className="pageHead__title">Agents</h1>
          <p className="pageHead__lede">
            Automated workers attached to this project. They read evidence and propose model changes; they never record
            a decision.
          </p>
        </div>
        <div className="pageHead__facts">
          <div className="fact">
            <span className="fact__label">Active</span>
            <span className="fact__value fact__value--big">{METRICS.activeAgents}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Runs this week</span>
            <span className="fact__value">{totalRuns}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Proposals awaiting review</span>
            <span className="fact__value">{awaiting}</span>
          </div>
        </div>
      </header>

      <div className="grid grid--agents">
        <section className="panel panel__body--tight" aria-label="Agents">
          <ul className="agentList">
            {AGENTS.map((agent) => {
              const open = expanded === agent.id
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
                        <span title="Model changes proposed">{agent.modelChanges} changes</span>
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
                          <div className="def__label">Inputs</div>
                          <div className="def__value">{agent.inputs.join(' · ')}</div>
                        </div>
                        <div>
                          <div className="def__label">Last run</div>
                          <div className="def__value">
                            <EntityRef id={agent.lastRunEvidenceId} /> {agent.lastRunLabel}
                          </div>
                        </div>
                        <div>
                          <div className="def__label">Result</div>
                          <div className="def__value">
                            {agent.modelChanges} model changes · {agent.findingsGenerated.length} findings
                          </div>
                        </div>
                        <div>
                          <div className="def__label">Next trigger</div>
                          <div className="def__value">{agent.nextTrigger}</div>
                        </div>
                      </div>

                      {agent.findingsGenerated.length > 0 ? (
                        <div>
                          <div className="def__label">Findings generated</div>
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
                            {agent.proposalsAwaitingReview} proposed model change
                            {agent.proposalsAwaitingReview > 1 ? 's are' : ' is'} waiting for a human to accept or
                            reject.
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
              Activity — model v18 run
            </h2>
            <span className="panel__meta">Aug 22 · 12:04 – 12:07</span>
          </div>
          <div className="panel__body">
            <ActivityTimeline events={AGENT_ACTIVITY} dense />
            <div className="divider divider--gutter" />
            <p className="prose u-muted">
              Three agents cooperated on this run. The PR Review Agent found the structural change, the Threat Analysis
              Agent scored the affected subgraph, and the Architecture Agent published the version once validation
              passed. No decision was recorded by an agent.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
