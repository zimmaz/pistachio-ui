import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useDialog } from '@/lib/hooks'

function useBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [active])
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

export function Drawer({ open, onClose, title, eyebrow, children, footer, wide }: DrawerProps) {
  const ref = useDialog(open, onClose)
  useBodyLock(open)
  if (!open) return null

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        className={`drawer${wide ? ' drawer--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <header className="drawer__head">
          <div className="drawer__heading">
            {eyebrow ? <div className="drawer__eyebrow">{eyebrow}</div> : null}
            <h2 className="drawer__title">{title}</h2>
          </div>
          <button className="btn btn--quiet btn--icon drawer__close" onClick={onClose} aria-label="Close panel">
            <X size={15} aria-hidden="true" />
          </button>
        </header>
        <div className="drawer__body">{children}</div>
        {footer ? <footer className="drawer__foot">{footer}</footer> : null}
      </div>
    </>,
    document.body,
  )
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onClose, title, subtitle, children, footer }: ModalProps) {
  const ref = useDialog(open, onClose)
  useBodyLock(open)
  if (!open) return null

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header className="modal__head">
          <div className="modal__heading">
            <h2 className="modal__title">{title}</h2>
            {subtitle ? <p className="modal__sub">{subtitle}</p> : null}
          </div>
          <button
            className="btn btn--quiet btn--icon modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__foot">{footer}</footer> : null}
      </div>
    </>,
    document.body,
  )
}

/** Label/value pair used throughout drawers and detail panels. */
export function Def({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="def__label">{label}</div>
      <div className="def__value">{children}</div>
    </div>
  )
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="detailSection">
      <div className="detailSection__head">
        <h3 className="detailSection__title">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}
