import { useCallback, useEffect, useState } from 'react'

/*
 * The stand's router, in forty lines.
 *
 * A router is a solved problem and there is no shortage of libraries; this one
 * exists because the stand asks for exactly two things - which component is on
 * screen, and a back button that works - and because the stand is the place a
 * product looks to see what dowel needs. Everything it drags in reads as part
 * of the system. The calendar was written on `Intl` for the same reason.
 *
 * The base path is baked in by Vite: the stand is served under `/dowel/stand/`
 * on the project page and at `/` in a dev server, and a router that guessed
 * would be right in one of those and wrong in the other.
 */

/** Where the stand is mounted. Vite substitutes it at build time. */
const BASE = import.meta.env.BASE_URL

/**
 * Where a deep link is put when the server could not serve it.
 *
 * GitHub Pages has one 404 page for the whole site and it belongs to the
 * documentation, so `/dowel/stand/button` reaches the docs' "page not found"
 * rather than the stand. That page hands the route back here through session
 * storage and sends the browser to the stand's root; this reads it, puts the
 * real URL in the address bar, and forgets it.
 *
 * The result is that a reloaded or shared deep link lands on the component it
 * names, with the URL it was given.
 */
function claimRedirect(): void {
  if (typeof window === 'undefined') return
  let handed: string | null
  try {
    handed = window.sessionStorage.getItem('dowel.stand.redirect')
    if (handed) window.sessionStorage.removeItem('dowel.stand.redirect')
  } catch {
    // Storage can throw rather than return null; a deep link that cannot be
    // restored is a front page, not a crash.
    return
  }
  if (!handed || !handed.startsWith(BASE)) return
  window.history.replaceState(null, '', handed)
}

/** The part of the path that names a component: `/dowel/stand/button` is
 * `button`, and the root is an empty string. */
function readPath(): string {
  if (typeof window === 'undefined') return ''
  claimRedirect()
  const { pathname } = window.location
  const rest = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, '')
  return rest.replace(/\/+$/, '')
}

/**
 * The current route, and a way to change it.
 *
 * `navigate` pushes rather than replaces, so the back button walks the list of
 * components a reader actually looked at - which is the whole reason a stand
 * has routes instead of anchors.
 */
export function useRoute(): { path: string; navigate: (to: string) => void } {
  const [path, setPath] = useState(readPath)

  useEffect(() => {
    // The browser's own back and forward, which `pushState` does not announce.
    const onPop = () => setPath(readPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: string) => {
    const next = `${BASE}${to}`.replace(/\/{2,}/g, '/')
    if (next === window.location.pathname) return
    window.history.pushState(null, '', next)
    setPath(to.replace(/\/+$/, ''))
    // A new page starts at the top. Without this, following a link from
    // halfway down one component's page lands halfway down the next one.
    window.scrollTo(0, 0)
  }, [])

  return { path, navigate }
}

/** The href to put on a link, so it is a real URL that can be copied, opened
 * in a new tab and bookmarked - the thing an anchor in a scroll never is. */
export function href(to: string): string {
  return `${BASE}${to}`.replace(/\/{2,}/g, '/')
}

/**
 * What to put on a link so it routes instead of reloading.
 *
 * Plain clicks are intercepted; anything else is left to the browser, which is
 * what keeps a middle-click, a ctrl-click and "open in new tab" working. A
 * router that swallows those is the commonest way a single-page application
 * feels wrong under the hands of someone who uses a browser properly.
 */
export function linkProps(
  to: string,
  navigate: (to: string) => void,
): { href: string; onClick: (event: React.MouseEvent) => void } {
  return {
    href: href(to),
    onClick: (event) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      navigate(to)
    },
  }
}
