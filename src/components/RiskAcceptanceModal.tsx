import { useState } from 'react'
import { Plus, ShieldAlert, UserCheck, X } from 'lucide-react'
import type { Finding } from '@/data'
import { SeverityBadge } from './Badges'
import { Modal } from './Overlay'

const OWNERS = ['Payments Director', 'Platform Director', 'Engineering Director', 'Merchant Director']
const SUGGESTED_CONTROLS = ['VPN-only access', 'IP allowlist', 'Enhanced monitoring', 'Quarterly attestation']

export interface RiskAcceptanceSubmit {
  summary: string
  riskOwner: string
  securityApprover: string
  justification: string
  compensatingControls: string[]
  expires: string
  reviewDate: string
}

interface Props {
  finding: Finding | null
  onClose: () => void
  onSubmit: (record: RiskAcceptanceSubmit) => void
}

/**
 * Risk acceptance is a human act. The dialog names the owner, the approver and
 * an expiry, and it can only *request* approval — nothing here approves itself.
 */
export function RiskAcceptanceModal({ finding, onClose, onSubmit }: Props) {
  const [owner, setOwner] = useState(OWNERS[0])
  const [justification, setJustification] = useState('')
  const [controls, setControls] = useState<string[]>([])
  const [draftControl, setDraftControl] = useState('')
  const [expires, setExpires] = useState('2026-11-30')
  const [reviewDate, setReviewDate] = useState('2026-10-15')
  const [touched, setTouched] = useState(false)
  const approver = 'AppSec Director'

  if (!finding) return null

  const justificationInvalid = justification.trim().length < 20
  const controlsInvalid = controls.length === 0

  const addControl = (value: string) => {
    const next = value.trim()
    if (!next || controls.includes(next)) return
    setControls((prev) => [...prev, next])
    setDraftControl('')
  }

  const submit = () => {
    setTouched(true)
    if (justificationInvalid || controlsInvalid) return
    onSubmit({
      summary: `Risk acceptance requested. Owner ${owner}. Required approver ${approver}. Expires ${formatDate(expires)}.`,
      riskOwner: owner,
      securityApprover: approver,
      justification: justification.trim(),
      compensatingControls: controls,
      expires: formatDate(expires),
      reviewDate: formatDate(reviewDate),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Accept residual risk"
      subtitle={`${finding.id} · ${finding.title}`}
      footer={
        <>
          <span className="approverNote">
            <UserCheck size={13} aria-hidden="true" />
            Requires approval from the AppSec Director
          </span>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={submit}>
            Request risk acceptance
          </button>
        </>
      }
    >
      <div className="callout callout--risk">
        <ShieldAlert size={14} className="callout__icon" aria-hidden="true" />
        <span>
          Residual risk stays <SeverityBadge severity={finding.severity} bare /> until the mitigation ships. Accepting
          records the decision against a named owner; it does not change the threat model.
        </span>
      </div>

      <div className="field">
        <span className="field__label">Security approver</span>
        <div className="def__value">{approver}</div>
        <span className="field__hint">A named human must approve. Agents never appear in this field.</span>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="risk-owner">
          Risk owner
        </label>
        <select
          id="risk-owner"
          className="select"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
        >
          {OWNERS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="risk-justification">
          Justification
        </label>
        <textarea
          id="risk-justification"
          className="textarea"
          value={justification}
          placeholder="Why is this risk acceptable, and what changes before the expiry date?"
          onChange={(event) => setJustification(event.target.value)}
          aria-describedby="risk-justification-hint"
          aria-invalid={touched && justificationInvalid}
        />
        <span className="field__hint" id="risk-justification-hint">
          {touched && justificationInvalid
            ? 'A justification of at least 20 characters is required for the approval record.'
            : 'Recorded verbatim in the decision record and shown on the Model page.'}
        </span>
      </div>

      <div className="field">
        <span className="field__label">Compensating controls</span>
        {controls.length > 0 ? (
          <ul className="tokenList">
            {controls.map((control) => (
              <li key={control} className="token">
                {control}
                <button
                  type="button"
                  onClick={() => setControls((prev) => prev.filter((c) => c !== control))}
                  aria-label={`Remove ${control}`}
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="row">
          <input
            className="input"
            value={draftControl}
            placeholder="Add a compensating control"
            onChange={(event) => setDraftControl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addControl(draftControl)
              }
            }}
            aria-label="Add a compensating control"
            aria-invalid={touched && controlsInvalid}
          />
          <button type="button" className="btn" onClick={() => addControl(draftControl)}>
            <Plus size={13} aria-hidden="true" />
            Add
          </button>
        </div>
        <div className="row row--wrap suggestList">
          {SUGGESTED_CONTROLS.filter((c) => !controls.includes(c)).map((control) => (
            <button key={control} type="button" className="suggestChip" onClick={() => addControl(control)}>
              {control}
            </button>
          ))}
        </div>
        {touched && controlsInvalid ? (
          <span className="field__hint field__hint--error">At least one compensating control is required.</span>
        ) : null}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="risk-expiry">
          Expiration
        </label>
        <input
          id="risk-expiry"
          type="date"
          className="input"
          value={expires}
          min="2026-08-23"
          onChange={(event) => setExpires(event.target.value)}
        />
        <span className="field__hint">Acceptances lapse automatically. Pistachio reopens the finding on expiry.</span>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="risk-review">
          Review date
        </label>
        <input
          id="risk-review"
          type="date"
          className="input"
          value={reviewDate}
          min="2026-08-23"
          onChange={(event) => setReviewDate(event.target.value)}
        />
      </div>
    </Modal>
  )
}

function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
