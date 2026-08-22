import { GitCommitVertical } from 'lucide-react'
import { agentById, findingById, type EvidenceSource } from '@/data'
import { SeverityBadge, StatusBadge } from './Badges'
import { EntityRef } from './EntityRef'
import { Def, Drawer, Section } from './Overlay'

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

      <Section title="Provenance">
        <p className="prose u-muted">
          {evidence.modelChange
            ? `This source moved the model ${evidence.modelChange}. Every entity above can be traced back to it.`
            : 'This source informed the model without changing a version. It is retained as supporting evidence for the controls and assumptions that cite it.'}
        </p>
      </Section>
    </Drawer>
  )
}
