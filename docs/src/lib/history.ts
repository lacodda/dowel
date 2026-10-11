/*
 * The history of the item a page is about, from `registry/history.json`.
 *
 * Read here once so the page and its table of contents agree about whether
 * there is a history to show: the heading is listed in the contents only for
 * a page that draws it.
 */
import history from '../../../registry/history.json'

export interface Change {
  type: string
  scope: string | null
  breaking: boolean
  summary: string
  date: string
  commit: string
}

export interface Release {
  version: string
  changes: Change[]
}

/** The page's item and where its file lives, for a component or a block page. */
export function itemOfPage(id: string): { name: string; dir: 'ui' | 'blocks' } | null {
  const match = id.match(/^(components|blocks)\/([a-z][a-z0-9-]*)$/)
  if (!match) return null
  return { name: match[2]!, dir: match[1] === 'components' ? 'ui' : 'blocks' }
}

export function releasesOf(name: string): Release[] {
  return (history as Record<string, Release[]>)[name] ?? []
}
