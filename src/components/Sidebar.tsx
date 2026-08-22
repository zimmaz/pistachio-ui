import { useCallback, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Bot, Check, FileStack, LayoutGrid, Network, PanelLeftClose, Settings, ShieldAlert } from 'lucide-react'
import { CURRENT_USER, METRICS } from '@/data'
import { useDismissable } from '@/lib/hooks'
import { ProjectSwitcher } from './ProjectSwitcher'

const NAV = [
  { to: '/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/model', label: 'Model', icon: Network },
  { to: '/evidence', label: 'Evidence', icon: FileStack },
  { to: '/findings', label: 'Findings', icon: ShieldAlert, count: METRICS.openFindings, alert: true },
  { to: '/agents', label: 'Agents', icon: Bot },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  assistantOpen: boolean
  onAskPistachio: () => void
  dense: boolean
  onDenseChange: (next: boolean) => void
  calmMotion: boolean
  onCalmMotionChange: (next: boolean) => void
}

export function Sidebar({
  collapsed,
  onToggle,
  assistantOpen,
  onAskPistachio,
  dense,
  onDenseChange,
  calmMotion,
  onCalmMotionChange,
}: Props) {
  const [prefsOpen, setPrefsOpen] = useState(false)
  const closePrefs = useCallback(() => setPrefsOpen(false), [])
  const prefsRef = useDismissable<HTMLDivElement>(prefsOpen, closePrefs)

  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="sidebar__brand">
        {collapsed ? (
          <button
            type="button"
            className="sidebar__markBtn"
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <span className="pxMark" aria-hidden="true" />
          </button>
        ) : (
          <>
            <span className="pxMark" aria-hidden="true" />
            <span className="sidebar__wordmark">Pistachio</span>
            <button
              type="button"
              className="sidebar__collapseBtn"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={14} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <ProjectSwitcher collapsed={collapsed} />

      <nav className="sidebar__nav" aria-label="Sections">
        {NAV.map(({ to, label, icon: Icon, count, alert }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `navItem${isActive ? ' is-active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={15} className="navItem__icon" aria-hidden="true" />
            <span className="navItem__label">{label}</span>
            {count !== undefined ? (
              <span className={`navItem__count${alert ? ' navItem__count--alert' : ''}`}>
                {count}
                <span className="u-visually-hidden"> open findings</span>
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__foot">
        <button
          type="button"
          className={`askButton${assistantOpen ? ' is-open' : ''}`}
          onClick={onAskPistachio}
          aria-expanded={assistantOpen}
          title="Ask Pistachio"
        >
          <span className="pxMark" style={{ '--mark-h': '1.125rem' } as React.CSSProperties} aria-hidden="true" />
          <span className="askButton__label">Ask Pistachio</span>
          <span className="askButton__kbd" aria-hidden="true">
            ⌘J
          </span>
        </button>

        <div className="userWrap" ref={prefsRef}>
          <button
            type="button"
            className={`userRow${prefsOpen ? ' is-open' : ''}`}
            title={`${CURRENT_USER.name} · ${CURRENT_USER.role}`}
            aria-expanded={prefsOpen}
            aria-haspopup="true"
            onClick={() => setPrefsOpen((v) => !v)}
          >
            <span className="avatar" aria-hidden="true">
              {CURRENT_USER.initials}
            </span>
            <span className="userRow__text">
              <span className="userRow__name">{CURRENT_USER.name}</span>
              <span className="userRow__role">{CURRENT_USER.role}</span>
            </span>
            <Settings size={13} className="userRow__gear" aria-hidden="true" />
            <span className="u-visually-hidden">Workspace preferences</span>
          </button>

          {prefsOpen ? (
            <div className="prefsMenu" role="group" aria-label="Workspace preferences">
              <p className="prefsMenu__who">
                {CURRENT_USER.name}
                <span>
                  {CURRENT_USER.team} · signed in via SSO
                </span>
              </p>
              <PrefToggle
                label="Compact density"
                hint="Tighter table rows for long review sessions"
                checked={dense}
                onChange={onDenseChange}
              />
              <PrefToggle
                label="Reduce motion"
                hint="Disable panel and drawer transitions"
                checked={calmMotion}
                onChange={onCalmMotionChange}
              />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

function PrefToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      className="prefToggle"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="prefToggle__box" aria-hidden="true">
        {checked ? <Check size={11} /> : null}
      </span>
      <span className="prefToggle__text">
        <span className="prefToggle__label">{label}</span>
        <span className="prefToggle__hint">{hint}</span>
      </span>
    </button>
  )
}
