import { Ban, CircleCheck, ClipboardList, ShieldQuestion, Wrench } from 'lucide-react'
import {
  FINDING_CONFIDENCE,
  attackPathById,
  componentById,
  controlById,
  exceptionById,
  provenanceFor,
  threatById,
  type Finding,
  type FindingDecision,
} from '@/data'
import { AttackPathView } from './AttackPath'
import { SeverityBadge, StatusBadge } from './Badges'
import { EntityRef, SourceChip, SourceReference } from './EntityRef'
import { Def, Drawer, Section } from './Overlay'
import { ConfidenceRow, ProvenanceChain } from './ProvenanceChain'

export type Decision = FindingDecision

interface Props {
  finding: Finding | null
  decision?: Decision
  onClose: () => void
  onMitigate: () => void
  onPlanMitigation?: () => void
  onAcceptRisk: () => void
  onMarkInvalid: () => void
  acceptedRisk?: {
    riskOwner: string
    securityApprover: string
    compensatingControls: string[]
    expires: string
    justification: string
    reviewDate?: string
  }
}

export function FindingDetail({
  finding,
  decision,
  onClose,
  onMitigate,
  onPlanMitigation,
  onAcceptRisk,
  onMarkInvalid,
  acceptedRisk,
}: Props) {
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
          {onPlanMitigation ? (
            <button className="btn" onClick={onPlanMitigation} disabled={settled || approvalPending}>
              <ClipboardList size={13} aria-hidden="true" />
              Plan mitigation
            </button>
          ) : null}
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
        {finding.remediationOwner ? <Def label="Remediation owner">{finding.remediationOwner}</Def> : null}
        {finding.dueDate ? <Def label="Due">{finding.dueDate}</Def> : null}
        <Def label="Detected by">{finding.detectedBy}</Def>
        <Def label="First detected">
          {finding.detectedLabel} · from <EntityRef id={finding.sourceEvidenceId} />
        </Def>
        {finding.lastConfirmed ? <Def label="Last confirmed">{finding.lastConfirmed}</Def> : null}
        {finding.ticket ? <Def label="Linked ticket">{finding.ticket}</Def> : null}
      </div>

      {finding.threats[0] ? (
        <Section title="Threat">
          <div className="controlList__item">
            <EntityRef id={finding.threats[0]} />
            <span className="controlList__name">{threatById.get(finding.threats[0])?.title}</span>
          </div>
        </Section>
      ) : null}

      <Section title="Why Pistachio believes this">
        {provenanceFor(finding.id).length > 0 ? (
          <ProvenanceChain nodes={provenanceFor(finding.id)} />
        ) : (
          <p className="prose">{finding.rationale}</p>
        )}
        <ConfidenceRow
          confidence={finding.confidence ?? FINDING_CONFIDENCE[finding.id] ?? 'Moderate'}
          supporting={finding.evidence.length}
          conflicting={finding.type === 'Evidence Conflict' ? 1 : 0}
        />
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

      {acceptedRisk ? (
        <Section title="Risk accepted">
          <div className="exceptionCard">
            <div className="defs defs--split">
              <Def label="Accepted by">{acceptedRisk.riskOwner}</Def>
              <Def label="Approved by">{acceptedRisk.securityApprover}</Def>
              <Def label="Expires">{acceptedRisk.expires}</Def>
              <Def label="Compensating controls">{acceptedRisk.compensatingControls.length}</Def>
              {acceptedRisk.reviewDate ? <Def label="Review date">{acceptedRisk.reviewDate}</Def> : null}
            </div>
            <p className="prose">{acceptedRisk.justification}</p>
          </div>
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
      <div className="sourceChipRow">
        {finding.evidence.map((id) => (
          <SourceChip key={id} id={id} />
        ))}
      </div>
    </Drawer>
  )
}
