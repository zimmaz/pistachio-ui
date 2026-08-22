import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { SEARCHABLE } from '@/data'

const GROUP_ORDER = ['Finding', 'Threat', 'Component', 'Evidence', 'Attack path', 'Control', 'Asset', 'Risk decision', 'Agent']

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matched = needle
      ? SEARCHABLE.filter(
          (item) => item.id.toLowerCase().includes(needle) || item.title.toLowerCase().includes(needle),
        )
      : SEARCHABLE.filter((item) => item.group === 'Finding' || item.group === 'Attack path')

    return matched
      .slice()
      .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group))
      .slice(0, 24)
  }, [query])

  useEffect(() => {
    setCursor(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    restoreTo.current = document.activeElement as HTMLElement | null
    setQuery('')
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => {
      window.clearTimeout(id)
      restoreTo.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  const commit = (index: number) => {
    const item = results[index]
    if (!item) return
    navigate(item.to)
    onClose()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((c) => Math.min(c + 1, results.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      commit(cursor)
    }
  }

  let lastGroup = ''

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search the model" onKeyDown={onKeyDown}>
        <div className="palette__input">
          <Search size={15} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search threats, findings, evidence, components…"
            aria-label="Search threats, findings, evidence, components"
            aria-controls="palette-results"
            aria-activedescendant={results[cursor] ? `palette-option-${cursor}` : undefined}
            role="combobox"
            aria-expanded={results.length > 0}
            autoComplete="off"
          />
          <kbd className="palette__esc">esc</kbd>
        </div>

        <div className="palette__results" id="palette-results" role="listbox" aria-label="Results">
          {results.length === 0 ? (
            <p className="empty">Nothing in model v18 matches “{query}”.</p>
          ) : (
            results.map((item, index) => {
              const showGroup = item.group !== lastGroup
              lastGroup = item.group
              return (
                <Fragment key={`${item.group}-${item.id}`}>
                  {showGroup ? (
                    <div className="palette__group" role="presentation">
                      {item.group}
                    </div>
                  ) : null}
                  <div
                    id={`palette-option-${index}`}
                    role="option"
                    aria-selected={index === cursor}
                    className={`palette__item${index === cursor ? ' is-active' : ''}`}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => commit(index)}
                  >
                    <span className="palette__id">{item.id}</span>
                    <span className="palette__title">{item.title}</span>
                    {index === cursor ? <CornerDownLeft size={12} aria-hidden="true" /> : null}
                  </div>
                </Fragment>
              )
            })
          )}
        </div>

        <div className="palette__foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span className="u-muted">Searching model v18</span>
        </div>
      </div>
    </>,
    document.body,
  )
}
