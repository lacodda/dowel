import { type NavRailItem } from '../../../registry/ui/nav-rail'

/*
 * What more than one section draws.
 *
 * Demo data and small drawings that two or more sections show, kept once so
 * the table and the filter mean the same six works, and the bell in the title
 * bar says what the bell on its own says. Anything only one section uses
 * lives in that section's file.
 */

export function Dots() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
      <circle cx="3" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="13" cy="8" r="1.4" />
    </svg>
  )
}

export const FRUIT = ['Apple', 'Apricot', 'Blackberry', 'Blueberry', 'Cherry', 'Peach', 'Pear', 'Plum']

/* The demo data for the table sections. Invented people doing invented work:
 * a stand is public, and the line's rule is that nothing of the owner's ever
 * reaches a fixture. The gaps are the point - two rows with no score and one
 * with no reviewer, which is what the sorting is here to show. */
export interface Work {
  id: string
  title: string
  owner: string
  score: number | null
  words: number
  updated: string
}

export const works: Work[] = [
  { id: 'w1', title: 'Harbour lights', owner: 'Ines', score: 8, words: 4120, updated: '2026-09-09T09:40:00Z' },
  { id: 'w2', title: 'The quiet mile', owner: 'Ravi', score: null, words: 990, updated: '2026-09-08T17:05:00Z' },
  { id: 'w3', title: 'Ash and after', owner: 'Ines', score: 10, words: 12040, updated: '2026-09-02T11:20:00Z' },
  { id: 'w4', title: 'Nine of cups', owner: 'Tomas', score: 3, words: 640, updated: '2026-08-30T08:00:00Z' },
  { id: 'w5', title: 'Undertow', owner: 'Ravi', score: null, words: 7300, updated: '2026-08-11T21:15:00Z' },
  { id: 'w6', title: 'Ember street', owner: 'Kit', score: 6, words: 2280, updated: '2026-06-19T13:30:00Z' },
]

export const bellLabels = {
  label: 'Notifications',
  title: 'Recent',
  markAllLabel: 'Mark all read',
  seeAllLabel: 'See all',
  emptyLabel: 'Nothing recent.',
}

export const splashMark = (
  <svg viewBox="0 0 32 32" aria-hidden>
    <path d="M16 2 28 9v14L16 30 4 23V9z" fill="var(--accent)" />
    <text x="16" y="20.5" fontFamily="Consolas, monospace" fontSize="11" fontWeight="700" fill="var(--on-accent)" textAnchor="middle">
      ki
    </text>
  </svg>
)

export const shellScreens: NavRailItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" />
        <rect x="9" y="9" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  {
    id: 'catalogue',
    label: 'Catalogue',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M3 4h10M3 8h10M3 12h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
        <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" strokeLinecap="round" />
      </svg>
    ),
  },
]
