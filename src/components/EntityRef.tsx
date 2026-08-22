import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { entityLabel, entityRoute } from '@/data'

/**
 * Every claim in Pistachio is traceable. EntityRef is the single vocabulary
 * for that: a monospace identifier that navigates to the thing it names.
 */
export function EntityRef({ id, showLabel = false }: { id: string; showLabel?: boolean }) {
  return (
    <Link className="ref" to={entityRoute(id)} title={entityLabel(id)}>
      {id}
      {showLabel ? <span className="ref__label">{entityLabel(id)}</span> : null}
    </Link>
  )
}

export function RefList({ ids, empty = '—' }: { ids: string[]; empty?: string }) {
  if (ids.length === 0) return <span className="u-muted">{empty}</span>
  return (
    <span className="refList">
      {ids.map((id) => (
        <EntityRef key={id} id={id} />
      ))}
    </span>
  )
}

/** A labelled provenance block: "this is where the claim came from". */
export function SourceReference({ ids, label = 'Sources' }: { ids: string[]; label?: string }) {
  if (ids.length === 0) return null
  return (
    <div className="sourceRef">
      <span className="sourceRef__label">{label}</span>
      <ul className="sourceRef__list">
        {ids.map((id) => (
          <li key={id}>
            <Link className="sourceRef__item" to={entityRoute(id)}>
              <span className="sourceRef__id">{id}</span>
              <span className="sourceRef__name">{entityLabel(id)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

const TOKEN = /\[\[([A-Z]{2,4}-[0-9A-Za-z]+)\]\]/g

/** Renders prose containing [[ENTITY-ID]] tokens as inline references. */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null

  TOKEN.lastIndex = 0
  while ((match = TOKEN.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index))
    parts.push(<EntityRef key={`${match[1]}-${match.index}`} id={match[1]} />)
    cursor = match.index + match[0].length
  }
  if (cursor < text.length) parts.push(text.slice(cursor))

  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>{part}</Fragment>
      ))}
    </>
  )
}
