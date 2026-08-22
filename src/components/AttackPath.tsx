import { ShieldCheck, ShieldOff } from 'lucide-react'
import type { AttackPath as AttackPathModel, AttackPathStep } from '@/data'
import { EntityRef } from './EntityRef'

interface Props {
  path: AttackPathModel
  selectedStep?: number | null
  onSelectStep?: (order: number | null) => void
  compact?: boolean
}

/**
 * The path reads top to bottom: who, how, where, with what privilege, against
 * which asset. Controls sit beside the step they would break, and a broken
 * control is drawn as broken rather than merely coloured.
 */
export function AttackPathView({ path, selectedStep, onSelectStep, compact = false }: Props) {
  const interactive = Boolean(onSelectStep)

  return (
    <ol className={`attackPath${compact ? ' attackPath--compact' : ''}`}>
      {path.steps.map((step, index) => {
        const selected = selectedStep === step.order
        const last = index === path.steps.length - 1
        const broken = step.controls.filter((c) => !c.effective).length
        const showDetail = interactive ? selected : !compact

        return (
          <li
            key={step.order}
            className={`attackStep${selected ? ' is-selected' : ''}${last ? ' is-terminal' : ''}`}
          >
            <span className="attackStep__layer">{step.layer}</span>

            <span className="attackStep__rail" aria-hidden="true">
              <span className={`attackStep__marker attackStep__marker--${step.layer.toLowerCase()}`} />
              {last ? null : <span className="attackStep__line" />}
            </span>

            <div className="attackStep__body">
              {interactive ? (
                <button
                  type="button"
                  className="attackStep__toggle"
                  aria-expanded={selected}
                  onClick={() => onSelectStep?.(selected ? null : step.order)}
                >
                  <StepHead step={step} brokenCount={broken} compact={compact} />
                </button>
              ) : (
                <StepHead step={step} brokenCount={broken} compact={compact} />
              )}

              {showDetail ? <StepDetail step={step} /> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function StepHead({
  step,
  brokenCount,
  compact,
}: {
  step: AttackPathStep
  brokenCount: number
  compact: boolean
}) {
  return (
    <span className="attackStep__head">
      <span className="attackStep__label">{step.label}</span>
      {!compact && brokenCount > 0 ? (
        <span className="attackStep__gap">
          <ShieldOff size={11} aria-hidden="true" />
          {brokenCount} control{brokenCount > 1 ? 's' : ''} ineffective
        </span>
      ) : null}
    </span>
  )
}

function StepDetail({ step }: { step: AttackPathStep }) {
  return (
    <div className="attackStep__detail">
      <p className="attackStep__text">{step.detail}</p>
      {step.entityId ? (
        <div className="attackStep__entity">
          <EntityRef id={step.entityId} />
        </div>
      ) : null}
      {step.controls.length > 0 ? (
        <div className="attackStep__controls">
          {step.controls.map((control) => (
            <span
              key={control.id}
              className={`controlChip${control.effective ? ' is-effective' : ' is-broken'}`}
              title={control.effective ? 'Control holds at this step' : 'Control does not stop this step'}
            >
              {control.effective ? (
                <ShieldCheck size={11} aria-hidden="true" />
              ) : (
                <ShieldOff size={11} aria-hidden="true" />
              )}
              <span className="controlChip__id">{control.id}</span>
              <span className="controlChip__name">{control.name}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
