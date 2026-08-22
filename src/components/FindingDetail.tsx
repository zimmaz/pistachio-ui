import { Ban, CircleCheck, ShieldQuestion, Wrench } from 'lucide-react'
import {
  attackPathById,
  componentById,
  controlById,
  exceptionById,
  threatById,
  type Finding,
  type FindingStatus,
} from '@/data'
import { AttackPathView } from './AttackPath'
import { SeverityBadge, StatusBadge } from './Badges'
import { EntityRef, SourceReference } from './EntityRef'
import { Def, Drawer, Section } from './Overlay'

export interface Decision {
  status: FindingStatus
  note: string
}

interface Props {
  finding: Finding | null
  decision?: Decision
  onClose: () => void
  onMitigate: () => void
  onAcceptRisk: () => void
  onMarkInvalid: () => void
}

export function FindingDetail({ finding, decision, onClose, onMitigate, onAcceptRisk, onMarkInvalid }: Props) {
  if (!finding) return null

  const status = decision?.status ?? finding.status
  const path = finding.attackPathId ? attackPathById.get(finding.attackPathId) : null
  const exception = finding.exceptionId ? exceptionById.get(finding.exceptionId) : null
  const target = componentById.get(finding.targetId)
  const settled = status === 'Invalid' || status === 'Resolved' || status === 'Risk accepted'
  const approvalPending = status === 'Pending approval'

  return (
    <Drawer
      open
      onClose={onClose}
      wide
      title={finding.title}
      eyebrow={
        <>
          <span className="u-mono drawer__id">{finding.id}</span>
          <SeverityBadge severity={finding.severity} />
          <StatusBadge status={status} />
        </>
      }
      footer={
        <>
          <span className="decisionLabel">
            <ShieldQuestion size={13} aria-hidden="true" />
            Decision
          </span>
          <button className="btn btn--primary" onClick={onMitigate} disabled={settled || approvalPending}>
            <Wrench size={13} aria-hidden="true" />
            Mitigate
          </button>
          <button className="btn" onClick={onAcceptRisk} disabled={settled || approvalPending}>
            Accept risk
          </button>
          <button className="btn btn--danger" onClick={onMarkInvalid} disabled={settled || approvalPending}>
            <Ban size={13} aria-hidden="true" />
            Mark invalid
          </button>
        </>
      }
    >
      {decision ? (
        <div className="callout callout--brand" role="status">
          <CircleCheck size={14} className="callout__icon" aria-hidden="true" />
          <span>{decision.note}</span>
        </div>
      ) : null}

      <div className="defs defs--split">
        <Def label="Status">
          <StatusBadge status={status} />
        </Def>
        <Def label="Type">{finding.type}</Def>
        <Def label="Target">
          {target ? <EntityRef id={target.id} /> : null} {finding.target}
        </Def>
        <Def label="Owner">{finding.owner}</Def>
        <Def label="Detected by">{finding.detectedBy}</Def>
        <Def label="Detected">
          {finding.detectedLabel} · from <EntityRef id={finding.sourceEvidenceId} />
        </Def>
      </div>

      <Section title="Why this matters">
        <p className="prose">{finding.rationale}</p>
      </Section>

      {path ? (
        <Section
          title="Attack path"
          action={
            <span className="panel__meta">
              <EntityRef id={path.id} /> · likelihood {path.likelihood.toLowerCase()}
            </span>
          }
        >
          <AttackPathView path={path} />
        </Section>
      ) : null}

      <Section title="Recommended mitigation">
        <p className="prose">{finding.mitigation}</p>
      </Section>

      <Section title="Related controls">
        <ul className="controlList">
          {finding.controls.map((id) => {
            const control = controlById.get(id)
            if (!control) return null
            return (
              <li key={id} className="controlList__item">
                <EntityRef id={id} />
                <span className="controlList__name">{control.name}</span>
                <StatusBadge status={control.status} />
              </li>
            )
          })}
        </ul>
      </Section>

      {finding.threats.length > 0 ? (
        <Section title="Linked threats">
          <ul className="controlList">
            {finding.threats.map((id) => (
              <li key={id} className="controlList__item">
                <EntityRef id={id} />
                <span className="controlList__name">{threatById.get(id)?.title ?? id}</span>
                {threatById.get(id) ? <SeverityBadge severity={threatById.get(id)!.residual} bare /> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {exception ? (
        <Section title="Recorded decision">
          <div className="exceptionCard">
            <div className="exceptionCard__head">
              <EntityRef id={exception.id} />
              <StatusBadge status={exception.status} />
              <span className="panel__meta">Expires {exception.expires}</span>
            </div>
            <p className="prose">{exception.justification}</p>
            <div className="defs defs--split">
              <Def label="Risk owner">{exception.riskOwner}</Def>
              <Def label="Security approver">{exception.securityApprover}</Def>
            </div>
            {exception.scopeNote ? (
              <div className="callout callout--risk">
                <span>{exception.scopeNote}</span>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      <SourceReference ids={finding.evidence} label="Evidence" />
    </Drawer>
  )
}
