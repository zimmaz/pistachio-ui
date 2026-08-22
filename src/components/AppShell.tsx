import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BANNER_CSS_VAR } from '@/lib/brand'
import { useShortcut, useStickyBoolean } from '@/lib/hooks'
import { CommandPalette } from './CommandPalette'
import { PistachioAssistant } from './PistachioAssistant'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  const [collapsed, setCollapsed] = useStickyBoolean('pistachio.sidebar.collapsed', false)
  const [dense, setDense] = useStickyBoolean('pistachio.density.compact', false)
  const [calmMotion, setCalmMotion] = useStickyBoolean('pistachio.motion.reduced', false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { pathname } = useLocation()

  useShortcut('k', () => setPaletteOpen((v) => !v))
  useShortcut('j', () => setAssistantOpen((v) => !v))

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  const closePalette = useCallback(() => setPaletteOpen(false), [])
  const closeAssistant = useCallback(() => setAssistantOpen(false), [])

  return (
    <div
      className={[
        'shell',
        collapsed ? 'is-collapsed' : '',
        mobileNavOpen ? 'is-drawerOpen' : '',
        assistantOpen ? 'is-assistantOpen' : '',
        dense ? 'is-dense' : '',
        calmMotion ? 'is-calm' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--brand-banner': BANNER_CSS_VAR } as React.CSSProperties}
    >
      <a className="skipLink" href="#workspace">
        Skip to content
      </a>

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        assistantOpen={assistantOpen}
        onAskPistachio={() => setAssistantOpen((v) => !v)}
        dense={dense}
        onDenseChange={setDense}
        calmMotion={calmMotion}
        onCalmMotionChange={setCalmMotion}
      />

      {mobileNavOpen ? (
        <div className="navScrim" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      ) : null}

      <div className="workspace">
        <TopBar
          onOpenSearch={() => setPaletteOpen(true)}
          onToggleSidebar={() => setMobileNavOpen((v) => !v)}
        />
        <main className="workspace__main" id="workspace" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <PistachioAssistant open={assistantOpen} onClose={closeAssistant} />
    </div>
  )
}
