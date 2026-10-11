import { useEffect, useState } from 'react'

/*
 * The demo's router: the address after `#`.
 *
 * A hash rather than a path because the demo is served from a static host
 * whose one 404 page belongs to the documentation - a path would need the
 * handoff the stand needs, and would buy nothing a hash does not already give:
 * every screen has an address, the back button walks them, a link can be sent
 * and opened in a new tab.
 */

/** `#/works/w3` is `['works', 'w3']`; the front page is `[]`. */
export function readRoute(hash: string = window.location.hash): string[] {
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean)
}

export function useRoute(): string[] {
  const [route, setRoute] = useState(() => readRoute())
  useEffect(() => {
    const follow = () => setRoute(readRoute())
    window.addEventListener('hashchange', follow)
    return () => window.removeEventListener('hashchange', follow)
  }, [])
  return route
}

/** The href of a screen, for a real link. */
export function href(path: string): string {
  return `#/${path}`
}

/** Go to a screen, as a press of a link would. */
export function go(path: string): void {
  window.location.hash = `/${path}`
}
