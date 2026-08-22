import { useCallback, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { OTHER_PROJECTS, PROJECT } from '@/data'
import { useDismissable } from '@/lib/hooks'

export function ProjectSwitcher({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const ref = useDismissable<HTMLDivElement>(open, close)

  return (
    <div className="projectSwitcher" ref={ref}>
      <button
        type="button"
        className="projectSwitcher__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? `${PROJECT.name} · ${PROJECT.environment}` : undefined}
      >
        <span className="projectSwitcher__glyph" aria-hidden="true">
          {PROJECT.initials}
        </span>
        <span className="projectSwitcher__text">
          <span className="projectSwitcher__name">{PROJECT.name}</span>
          <span className="projectSwitcher__env">{PROJECT.environment}</span>
        </span>
        <ChevronsUpDown size={13} className="projectSwitcher__caret" aria-hidden="true" />
      </button>

      {open ? (
        <div className="projectSwitcher__menu" role="listbox" aria-label="Switch project">
          {OTHER_PROJECTS.map((project) => {
            const current = project.id === PROJECT.id
            return (
              <button
                key={project.id}
                type="button"
                role="option"
                aria-selected={current}
                aria-current={current}
                className="projectSwitcher__option"
                disabled={!current}
                title={current ? undefined : 'Only the Payments Platform model is loaded in this build'}
                onClick={close}
              >
                {current ? (
                  <Check size={13} aria-hidden="true" />
                ) : (
                  <span className="projectSwitcher__spacer" aria-hidden="true" />
                )}
                <span>
                  {project.name}
                  <span className="projectSwitcher__env"> · {project.environment}</span>
                </span>
                <span className="projectSwitcher__optionMeta">
                  {project.modelVersion} · {project.findings}
                </span>
              </button>
            )
          })}
          <p className="projectSwitcher__note" role="presentation">
            Only the Payments Platform model is loaded in this build.
          </p>
        </div>
      ) : null}
    </div>
  )
}
