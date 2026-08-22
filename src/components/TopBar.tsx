import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, PanelLeft, Search } from 'lucide-react'
import { METRICS, NOTIFICATIONS, PROJECT } from '@/data'
import { useDismissable } from '@/lib/hooks'
import { NotificationList } from './NotificationPanel'

const TITLES: Record<string, string> = {
  '/overview': 'Overview',
  '/model': 'Model',
  '/evidence': 'Evidence',
  '/findings': 'Findings',
  '/agents': 'Agents',
}

interface Props {
  onOpenSearch: () => void
  onToggleSidebar: () => void
}

export function TopBar({ onOpenSearch, onToggleSidebar }: Props) {
  const { pathname } = useLocation()
  const [bellOpen, setBellOpen] = useState(false)
  const [environment, setEnvironment] = useState<string>(PROJECT.environment)
  const closeBell = useCallback(() => setBellOpen(false), [])
  const bellRef = useDismissable<HTMLDivElement>(bellOpen, closeBell)

  const current = TITLES[pathname] ?? 'Overview'
  const offEnvironment = environment !== PROJECT.environment

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="iconButton topbar__sidebarToggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <PanelLeft size={15} aria-hidden="true" />
        </button>

        <nav className="topbar__crumbs" aria-label="Breadcrumb">
          <span className="topbar__crumb">{PROJECT.name}</span>
          <span className="topbar__sep" aria-hidden="true">
            /
          </span>
          <span className="topbar__crumb topbar__crumb--current" aria-current="page">
            {current}
          </span>
        </nav>

        <div className="topbar__modelState">
          <span className="topbar__version" title={`Model version ${PROJECT.modelVersion}`}>
            Model {PROJECT.modelVersion}
          </span>
          <span className="topbar__updated">Last updated {PROJECT.lastUpdatedLabel}</span>
        </div>

        <div className="topbar__spacer" />

        <div className="topbar__actions">
          <button type="button" className="searchTrigger" onClick={onOpenSearch}>
            <Search size={13} aria-hidden="true" />
            <span className="searchTrigger__label">Search the model</span>
            <span className="searchTrigger__kbd" aria-hidden="true">
              ⌘K
            </span>
          </button>

          <label className="u-visually-hidden" htmlFor="env-select">
            Environment
          </label>
          <select
            id="env-select"
            className={`select envSelect${offEnvironment ? ' is-off' : ''}`}
            value={environment}
            onChange={(event) => setEnvironment(event.target.value)}
          >
            {PROJECT.environments.map((env) => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </select>

          <div className="bellWrap" ref={bellRef}>
            <button
              type="button"
              className={`iconButton${bellOpen ? ' is-active' : ''}`}
              aria-expanded={bellOpen}
              aria-haspopup="true"
              aria-label={`Notifications, ${NOTIFICATIONS.length} unread`}
              onClick={() => setBellOpen((v) => !v)}
            >
              <Bell size={15} aria-hidden="true" />
              <span className="iconButton__dot" aria-hidden="true" />
            </button>
            {bellOpen ? (
              <div className="bellPanel" role="group" aria-label="Notifications">
                <div className="bellPanel__head">
                  <span className="panel__title">Attention</span>
                  <span className="panel__meta">
                    {METRICS.needsReview} awaiting review · {METRICS.criticalFindings} critical
                  </span>
                </div>
                <NotificationList onNavigate={closeBell} />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {offEnvironment ? (
        <div className="envNotice" role="status">
          <span className="envNotice__env">{environment}</span>
          <span>
            No threat model has been published for {environment}. Showing the {PROJECT.environment} model.
          </span>
          <button type="button" className="btn btn--quiet" onClick={() => setEnvironment(PROJECT.environment)}>
            Return to {PROJECT.environment}
          </button>
        </div>
      ) : null}
    </>
  )
}
