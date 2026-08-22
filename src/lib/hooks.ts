import { useCallback, useEffect, useRef, useState } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps focus inside an overlay, restores it on close, and wires Escape.
 * Used by every dialog surface so keyboard users are never stranded.
 */
export function useDialog(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return
    restoreTo.current = document.activeElement as HTMLElement | null

    const node = ref.current
    const first = node?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !node) return

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (items.length === 0) return

      const start = items[0]
      const end = items[items.length - 1]
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault()
        end.focus()
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault()
        start.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      restoreTo.current?.focus?.()
    }
  }, [active, onClose])

  return ref
}

/** Closes a popover when focus or a pointer moves outside it. */
export function useDismissable<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return ref
}

/** Global shortcut registration, skipped while the user is typing. */
export function useShortcut(key: string, handler: () => void, withMeta = true) {
  const saved = useRef(handler)
  saved.current = handler

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true

      if (withMeta) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === key) {
          event.preventDefault()
          saved.current()
        }
        return
      }
      if (!typing && event.key.toLowerCase() === key) {
        event.preventDefault()
        saved.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [key, withMeta])
}

/** Persisted boolean, used for the sidebar collapse preference. */
export function useStickyBoolean(storageKey: string, initial: boolean) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initial
    const stored = window.localStorage.getItem(storageKey)
    return stored === null ? initial : stored === 'true'
  })

  const set = useCallback(
    (next: boolean) => {
      setValue(next)
      window.localStorage.setItem(storageKey, String(next))
    },
    [storageKey],
  )

  return [value, set] as const
}

/** Tracks which section anchor is currently in view on the Model page. */
export function useActiveSection(ids: string[], rootMargin = '-56px 0px -70% 0px') {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin, threshold: 0 },
    )

    for (const id of ids) {
      const node = document.getElementById(id)
      if (node) observer.observe(node)
    }
    return () => observer.disconnect()
  }, [ids, rootMargin])

  return active
}
