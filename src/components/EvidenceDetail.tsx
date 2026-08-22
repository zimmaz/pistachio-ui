import { GitCommitVertical } from 'lucide-react'
import { EVIDENCE_USED_BY, agentById, assumptionById, findingById, provenanceFor, type EvidenceSource } from '@/data'
import { SeverityBadge, StatusBadge } from './Badges'
import { EntityRef } from './EntityRef'
import { Def, Drawer, Section } from './Overlay'
import { ProvenanceChain } from './ProvenanceChain'

const CHANGE_TONE = (entry: string) => {
  if (entry.startsWith('+')) return 'add'
  if (entry.startsWith('-')) return 'remove'
  if (entry.startsWith('!')) return 'conflict'
  return 'change'
}

export function EvidenceDetail({ evidence, onClose }: { evidence: EvidenceSource | null; onClose: () => void }) {
  if (!evidence) return null
  const agent = agentById.get(evidence.agentId)

  return (
    <Drawer
      open
      onClose={onClose}
      title={evidence.name}
      eyebrow={
        <>
          <span className="u-mono drawer__id">{evidence.id}</span>
          <span className="chip">{evidence.type}</span>
          <StatusBadge status={evidence.status} />
        </>
      }
      footer={
        <>
          <span className="panel__meta">
            Analyzed by {agent?.name ?? 'Pistachio'} · {evidence.analyzedLabel}
          </span>
          {evidence.modelChange ? (
            <span className="modelJump">
              <GitCommitVertical size={12} aria-hidden="true" />
              {evidence.modelChange}
            </span>
          ) : null}
        </>
      }
    >
      <div className="defs defs--split">
        <Def label="Source">{evidence.source}</Def>
        <Def label="Author">{evidence.author}</Def>
        <Def label="Format">{evidence.format}</Def>
        <Def label="Last analyzed">{evidence.analyzedLabel}</Def>
      </div>

      <Section title="Summary">
        <p className="prose">{evidence.summary}</p>
      </Section>

      {evidence.detectedChanges.length > 0 ? (
        <Section title="Detected changes">
          <ul className="diffList">
            {evidence.detectedChanges.map((entry) => (
              <li key={entry} className={`diffList__item diffList__item--${CHANGE_TONE(entry)}`}>
                {entry}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {evidence.affectedEntities.length > 0 ? (
        <Section title="Affected model entities">
          <div className="row row--wrap">
            {evidence.affectedEntities.map((id) => (
              <EntityRef key={id} id={id} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Generated findings">
        {evidence.findings.length === 0 ? (
          <p className="u-muted">No findings were raised from this source.</p>
        ) : (
          <ul className="controlList">
            {evidence.findings.map((id) => {
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
        )}
      </Section>

      {(() => {
        const used = EVIDENCE_USED_BY[evidence.id]
        if (!used && evidence.affectedEntities.length === 0) return null
        return (
          <Section title="Used by Pistachio">
            {used ? (
              <div className="defs defs--split">
                <Def label="Model entities">
                  {used.entities.map((id) => (
                    <EntityRef key={id} id={id} />
                  ))}
                </Def>
                <Def label="Threats">
                  {used.threats.length ? used.threats.map((id) => <EntityRef key={id} id={id} />) : '—'}
                </Def>
                <Def label="Findings">
                  {used.findings.length ? used.findings.map((id) => <EntityRef key={id} id={id} />) : '—'}
                </Def>
                <Def label="Model versions">{used.versions}</Def>
              </div>
            ) : null}
            {evidence.usedByAssumptions?.length ? (
              <p className="prose">
                Assumptions{' '}
                {evidence.usedByAssumptions.map((id) => (
                  <EntityRef key={id} id={id} />
                ))}
                {evidence.usedByAssumptions
                  .map((id) => assumptionById.get(id))
                  .filter(Boolean)
                  .map((assumption) =>
                    assumption?.status === 'Contradicted' ? (
                      <span key={assumption.id}> — {assumption.id} is contradicted by this source.</span>
                    ) : null,
                  )}
              </p>
            ) : null}
            {provenanceFor(evidence.id).length > 0 ? <ProvenanceChain nodes={provenanceFor(evidence.id)} /> : null}
          </Section>
        )
      })()}

      <Section title="Provenance">
        <p className="prose u-muted">
          {evidence.modelChange
            ? `This source proposed ${evidence.modelChange}. Agents analyzed it; a human still has to approve the model change.`
            : 'This source informed the model without publishing a version. It is retained as supporting or contradicting evidence for the objects that cite it.'}
        </p>
      </Section>
    </Drawer>
  )
}
