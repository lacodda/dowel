/*
 * The world the stand, the demo and every picture of them are drawn in.
 *
 * Fictional on purpose, and by default. The screens of the line are made by
 * someone who uses them on their own work, and the easiest data to put on a
 * screen is the data already on it - which is how a screenshot ends up in a
 * release note with a real title, a real address or a path off somebody's
 * disk. Nothing in a picture of dowel is anybody's: the people are invented,
 * their addresses are on `example.com` (reserved for exactly this, RFC 2606),
 * and the works are titles nobody has.
 *
 * One world rather than one per screen. A list in one block and its detail in
 * another, the demo walking between them, a picture in a release note - they
 * are the same works in all of them, so the screens can be read against each
 * other, and a fact added here shows up wherever it belongs.
 *
 * `tests/redakt.test.ts` holds everything that is photographed to it: an
 * address off a reserved domain, an IP outside the ranges set aside for
 * documentation, a path into somebody's home - each is a failure, wherever
 * on the stand or in the demo it is written.
 */

/** The moment the world is set at - the stand's own, so a relative date
 * reads the same in a block on the stand as in the demo beside it. */
export const worldNow = '2026-09-09T12:00:00Z'

export interface Person {
  id: string
  name: string
  email: string
  role: string
}

export const people: readonly Person[] = [
  { id: 'ines', name: 'Ines Duarte', email: 'ines@example.com', role: 'Writer' },
  { id: 'ravi', name: 'Ravi Menon', email: 'ravi@example.com', role: 'Producer' },
  { id: 'tomas', name: 'Tomas Vik', email: 'tomas@example.com', role: 'Editor' },
  { id: 'kit', name: 'Kit Arden', email: 'kit@example.com', role: 'Designer' },
]

/** Who is signed in: the person the demo is seen as. */
export const you = people[0]!

export type WorkKind = 'song' | 'clip' | 'short' | 'cover'

/** Where a work stands, in the order it gets there. */
export type WorkStage = 'idea' | 'draft' | 'ready' | 'released'

export interface Version {
  id: string
  label: string
  at: string
  note: string
}

export interface Work {
  id: string
  title: string
  kind: WorkKind
  stage: WorkStage
  /** A person's `id`. */
  owner: string
  updated: string
  /** Out of ten, or null while nobody has judged it. */
  score: number | null
  summary: string
  tags: readonly string[]
  versions: readonly Version[]
}

export const works: readonly Work[] = [
  {
    id: 'w1',
    title: 'Harbour lights',
    kind: 'song',
    stage: 'ready',
    owner: 'ines',
    updated: '2026-09-09T09:40:00Z',
    score: 8,
    summary: 'A slow walk along the quay after the last ferry, told by the one who stayed.',
    tags: ['night', 'water'],
    versions: [
      { id: 'w1v3', label: 'Version 3', at: '2026-09-09T09:40:00Z', note: 'Second verse rewritten around the lighthouse.' },
      { id: 'w1v2', label: 'Version 2', at: '2026-09-04T18:10:00Z', note: 'Chorus moved up a line.' },
      { id: 'w1v1', label: 'Version 1', at: '2026-08-28T07:55:00Z', note: 'First full draft.' },
    ],
  },
  {
    id: 'w2',
    title: 'The quiet mile',
    kind: 'song',
    stage: 'draft',
    owner: 'ravi',
    updated: '2026-09-08T17:05:00Z',
    score: null,
    summary: 'The last stretch home, when the road goes silent and the radio does not.',
    tags: ['road'],
    versions: [{ id: 'w2v1', label: 'Version 1', at: '2026-09-08T17:05:00Z', note: 'Verses only; no chorus yet.' }],
  },
  {
    id: 'w3',
    title: 'Ash and after',
    kind: 'clip',
    stage: 'released',
    owner: 'ines',
    updated: '2026-09-02T11:20:00Z',
    score: 10,
    summary: 'The clip for the spring single: one take, one street, one long morning.',
    tags: ['single', 'street'],
    versions: [
      { id: 'w3v2', label: 'Final cut', at: '2026-09-02T11:20:00Z', note: 'Colour pass and the closing title.' },
      { id: 'w3v1', label: 'Rough cut', at: '2026-08-25T15:00:00Z', note: 'Timing against the master.' },
    ],
  },
  {
    id: 'w4',
    title: 'Nine of cups',
    kind: 'short',
    stage: 'idea',
    owner: 'tomas',
    updated: '2026-08-30T08:00:00Z',
    score: 3,
    summary: 'Fifteen seconds of a card trick that goes wrong in the best way.',
    tags: ['short'],
    versions: [],
  },
  {
    id: 'w5',
    title: 'Undertow',
    kind: 'song',
    stage: 'draft',
    owner: 'ravi',
    updated: '2026-08-11T21:15:00Z',
    score: null,
    summary: 'What pulls back when everything else is going forward.',
    tags: ['water', 'night'],
    versions: [
      { id: 'w5v2', label: 'Version 2', at: '2026-08-11T21:15:00Z', note: 'Bridge in a lower key.' },
      { id: 'w5v1', label: 'Version 1', at: '2026-08-03T10:30:00Z', note: 'Melody sketch over piano.' },
    ],
  },
  {
    id: 'w6',
    title: 'Ember street',
    kind: 'cover',
    stage: 'ready',
    owner: 'kit',
    updated: '2026-06-19T13:30:00Z',
    score: 6,
    summary: 'The cover for the autumn release: a street at dusk in two colours.',
    tags: ['autumn', 'street'],
    versions: [{ id: 'w6v1', label: 'Version 1', at: '2026-06-19T13:30:00Z', note: 'Two colours, one typeface.' }],
  },
  {
    id: 'w7',
    title: 'Paper lanterns',
    kind: 'song',
    stage: 'idea',
    owner: 'ines',
    updated: '2026-09-07T20:45:00Z',
    score: null,
    summary: 'A festival seen from the hill above it, a year after leaving.',
    tags: ['festival'],
    versions: [],
  },
  {
    id: 'w8',
    title: 'Low orbit',
    kind: 'clip',
    stage: 'draft',
    owner: 'tomas',
    updated: '2026-09-05T14:00:00Z',
    score: 7,
    summary: 'A clip shot entirely from a rooftop, looking up.',
    tags: ['sky'],
    versions: [{ id: 'w8v1', label: 'Rough cut', at: '2026-09-05T14:00:00Z', note: 'Order of the shots settled.' }],
  },
]

/** A person, by the `id` a work names them with. */
export function personOf(id: string): Person | undefined {
  return people.find((person) => person.id === id)
}
