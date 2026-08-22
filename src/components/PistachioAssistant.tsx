import { useEffect, useRef, useState } from 'react'
import { ArrowUp, X } from 'lucide-react'
import {
  ASSISTANT_ANSWERS,
  ASSISTANT_FALLBACK,
  SUGGESTED_PROMPTS,
  type AssistantBlock,
} from '@/data/assistant'
import { PROJECT, attackPathById, findingById } from '@/data'
import { Link } from 'react-router-dom'
import { EntityRef, RichText, SourceReference } from './EntityRef'
import { SeverityBadge } from './Badges'
import { AttackPathView } from './AttackPath'

interface Turn {
  id: string
  question: string
  blocks: AssistantBlock[] | null
}

function answerFor(question: string): AssistantBlock[] {
  const needle = question.trim().toLowerCase()
  const exact = ASSISTANT_ANSWERS.find((a) => a.question.toLowerCase() === needle)
  if (exact) return exact.blocks

  const scored = ASSISTANT_ANSWERS.map((answer) => {
    const words = needle.split(/\s+/).filter((w) => w.length > 3)
    const target = answer.question.toLowerCase()
    const hits = words.filter((word) => target.includes(word)).length
    return { answer, hits }
  }).sort((a, b) => b.hits - a.hits)

  if (scored[0] && scored[0].hits >= 2) return scored[0].answer.blocks
  return ASSISTANT_FALLBACK
}

export function PistachioAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, pending])

  const ask = (question: string) => {
    if (!question.trim() || pending) return
    const id = `turn-${Date.now()}`
    setTurns((prev) => [...prev, { id, question, blocks: null }])
    setDraft('')
    setPending(true)
    window.setTimeout(() => {
      setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, blocks: answerFor(question) } : turn)))
      setPending(false)
    }, 420)
  }

  if (!open) return null

  return (
    <aside className="assistant" aria-label="Ask Pistachio">
      <header className="assistant__head">
        <span className="pxMark" style={{ '--mark-h': '1.25rem' } as React.CSSProperties} aria-hidden="true" />
        <div>
          <h2 className="assistant__title">Ask Pistachio</h2>
          <p className="assistant__scope">
            {PROJECT.name} · current model {PROJECT.modelVersion}
          </p>
        </div>
        <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label="Close assistant">
          <X size={15} aria-hidden="true" />
        </button>
      </header>

      <div className="assistant__log" ref={logRef}>
        {turns.length === 0 ? (
          <div className="assistant__intro">
            <p>
              Ask about anything in the current threat model. Every answer names the evidence it came from, so you can
              check the claim rather than trust it.
            </p>
          </div>
        ) : null}

        {turns.map((turn) => (
          <div key={turn.id} className="assistant__turn">
            <p className="assistant__question">{turn.question}</p>
            {turn.blocks ? (
              <div className="assistant__answer">
                {turn.blocks.map((block, index) => (
                  <AnswerBlock key={index} block={block} />
                ))}
              </div>
            ) : (
              <p className="assistant__pending" aria-live="polite">
                Reading model {PROJECT.modelVersion}
                <span className="assistant__dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="assistant__prompts">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button key={prompt} type="button" className="promptChip" onClick={() => ask(prompt)} disabled={pending}>
            {prompt}
          </button>
        ))}
      </div>

      <form
        className="assistant__composer"
        onSubmit={(event) => {
          event.preventDefault()
          ask(draft)
        }}
      >
        <input
          ref={inputRef}
          className="assistant__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about the model, a finding or a component…"
          aria-label="Ask Pistachio a question"
        />
        <button className="btn btn--primary btn--icon" type="submit" disabled={!draft.trim() || pending} aria-label="Send">
          <ArrowUp size={14} aria-hidden="true" />
        </button>
      </form>
    </aside>
  )
}

function AnswerBlock({ block }: { block: AssistantBlock }) {
  switch (block.kind) {
    case 'text':
      return (
        <p className="assistant__text">
          <RichText text={block.text} />
        </p>
      )

    case 'ordered':
      return (
        <ol className="assistant__ordered">
          {block.items.map((item, index) => (
            <li key={index}>
              <RichText text={item} />
            </li>
          ))}
        </ol>
      )

    case 'findings':
      return (
        <ul className="assistant__findings">
          {block.ids.map((id) => {
            const finding = findingById.get(id)
            if (!finding) return null
            return (
              <li key={id}>
                <EntityRef id={id} />
                <SeverityBadge severity={finding.severity} />
                <span className="assistant__findingTitle">{finding.title}</span>
              </li>
            )
          })}
        </ul>
      )

    case 'path': {
      const path = attackPathById.get(block.attackPathId)
      if (!path) return null
      return (
        <div className="assistant__path">
          <div className="assistant__pathHead">
            <EntityRef id={path.id} />
            <span>{path.name}</span>
          </div>
          <AttackPathView path={path} compact />
        </div>
      )
    }

    case 'sources':
      return <SourceReference ids={block.refs} />

    case 'action':
      return (
        <Link className="btn btn--block" to={block.to}>
          {block.label}
        </Link>
      )

    default:
      return null
  }
}
