import { useEffect, useState } from 'react'
import { AppShell, Screen } from '@/components/ui/app-shell'
import { Button } from '@/components/ui/button'
import { NavRail } from '@/components/ui/nav-rail'
import { ProductMark } from '@/components/ui/product-mark'
import { href, useRoute } from './router'
import { useDemoState } from './state'
import { Home } from './screens/home'
import { Settings } from './screens/settings'
import { SignIn } from './screens/sign-in'
import { Works } from './screens/works'

/*
 * kilna-lite.
 *
 * A small product built from dowel's blocks, and nothing else of its own but
 * the glue: the shell, the router, the state and a dashboard. It is the
 * blocks' first consumer - the place a block is used the way a product uses
 * it, with a router that owns the address and data that changes underneath -
 * and it is drawn on the stand's fictional world, so any picture of it is a
 * picture of nobody's work.
 */

function HomeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M2.5 7.5L8 3l5.5 4.5V13a.5.5 0 0 1-.5.5H9.5v-3h-3v3H3a.5.5 0 0 1-.5-.5z" strokeLinejoin="round" />
    </svg>
  )
}

function WorksIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 4h10M3 8h10M3 12h6" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="8" cy="8" r="2.25" />
      <path
        d="M8 1.75v1.5M8 12.75v1.5M14.25 8h-1.5M3.25 8h-1.5M12.4 3.6l-1.06 1.06M4.66 11.34L3.6 12.4M12.4 12.4l-1.06-1.06M4.66 4.66L3.6 3.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Whether the window is a phone's width: the rail folds to its icons. */
function useNarrow(): boolean {
  const query = '(max-width: 767px)'
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const list = window.matchMedia(query)
    const follow = () => setNarrow(list.matches)
    list.addEventListener('change', follow)
    return () => list.removeEventListener('change', follow)
  }, [])
  return narrow
}

const DESTINATIONS = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'works', label: 'Works', icon: <WorksIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
]

export function App() {
  const state = useDemoState()
  const route = useRoute()
  const narrow = useNarrow()

  // The sign-in page is the page: it stands outside the shell.
  if (!state.signedIn) return <SignIn onSignedIn={state.signIn} />

  const [screen = 'home', open = null] = route
  const current = DESTINATIONS.some((destination) => destination.id === screen) ? screen : 'home'

  return (
    <AppShell
      top={
        <div className="flex h-full items-center gap-2.5 border-b border-line px-3">
          <ProductMark product="kilna" size={22} />
          <span className="text-sm font-semibold text-text">kilna-lite</span>
          <span className="text-xs text-dim">a dowel demo</span>
          <Button size="sm" variant="icon" className="ml-auto" onClick={state.signOut}>
            Sign out
          </Button>
        </div>
      }
      side={
        <NavRail
          label="Screens"
          items={DESTINATIONS}
          activeId={current}
          collapsed={narrow}
          render={(item) => <a href={href(item.id === 'home' ? '' : item.id)} />}
        />
      }
      sideWidth={narrow ? 'var(--spacing-rail-compact)' : undefined}
    >
      <Screen scroll="held" pad={narrow ? 'tight' : 'default'}>
        {current === 'works' ? (
          <Works state={state} open={open} />
        ) : current === 'settings' ? (
          <Settings state={state} open={open} />
        ) : (
          <Home state={state} />
        )}
      </Screen>
    </AppShell>
  )
}
