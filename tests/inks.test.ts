import { describe, expect, it } from 'vitest'
import { contrastPromises, promiseName } from '../packages/dowel/src/contrast'
import { classLists, registrySources, utilityOf } from './classes'

/*
 * Every ink the set draws on a fill is a pair the theme promises.
 *
 * The palette gate holds each promised pair to its floor for every product of
 * the line. That proves nothing about a pair nobody promised - `faint` on a
 * selected row, a status word on someone else's status fill - and the browser
 * run sees those only in the one accent the stand is drawn in. So the source
 * is read instead: wherever one class list sets both a text colour and a
 * background, the two have to be a promised pair, in some mode the theme
 * offers. A list is one element, so this is the set's own pairs; an ink on a
 * fill an ancestor paints is the browser run's to catch.
 *
 * A variant is read through: `hover:bg-soft` beside `text-faint` is faint on
 * soft for as long as the pointer is there, which is long enough to read it.
 */

const promises = contrastPromises('normal')
const inks = new Set(promises.map((promise) => promise.ink))
const promised = new Set(promises.map((promise) => `${promise.ink} on ${promise.ground}`))

/** Colour tokens a class can name: the whole colour vocabulary, so that
 * `text-xs` (a size) and `bg-[url(...)]` are not mistaken for colours. */
const COLOURS = new Set([
  'bg', 'raise', 'soft', 'softer', 'line', 'line-2', 'text', 'dim', 'faint',
  'accent', 'accent-2', 'accent-soft', 'on-accent',
  ...['good', 'warn', 'bad', 'info'].flatMap((status) => [status, `${status}-soft`, `on-${status}`]),
])

/** `text-faint` -> `faint`, `bg-bad-soft/40` -> `bad-soft` with its alpha. */
function colourOf(utility: string, prefix: 'text' | 'bg'): { token: string; alpha: boolean } | undefined {
  const match = new RegExp(`^${prefix}-([a-z0-9-]+?)(/\\d+)?$`).exec(utility)
  if (!match || !COLOURS.has(match[1]!)) return undefined
  return { token: match[1]!, alpha: match[2] !== undefined }
}

interface Pair {
  ink: string
  ground: string
  /** Where it is written: `ui/chip.tsx:42`. */
  at: string
}

function pairsInSet(): Pair[] {
  const pairs: Pair[] = []
  for (const source of registrySources()) {
    for (const list of classLists(source)) {
      const utilities = list.classes.map(utilityOf)
      const texts = utilities.flatMap((u) => colourOf(u, 'text') ?? [])
      const grounds = utilities.flatMap((u) => colourOf(u, 'bg') ?? [])
      for (const ink of texts) {
        for (const ground of grounds) {
          pairs.push({ ink: ink.token, ground: ground.token, at: `${source.file}:${list.line}` })
        }
      }
    }
  }
  return pairs
}

describe('inks on fills', () => {
  const pairs = pairsInSet()

  it('finds the pairs the set draws', () => {
    // Guards the rest: a scanner that found nothing would pass by silence.
    expect(pairs.length).toBeGreaterThan(50)
    expect(pairs.some((pair) => pair.ink === 'bad' && pair.ground === 'bad-soft')).toBe(true)
  })

  it('draws only inks the theme promises as text', () => {
    // An alpha on the ink itself (`text-bad/60`) is a different colour from
    // the one promised; on the fill it only thins the fill toward the
    // surface under it, where the ink is promised as well.
    const unknown = pairs.filter((pair) => !inks.has(pair.ink)).map((pair) => `${pair.ink} at ${pair.at}`)
    expect(unknown).toEqual([])
  })

  it('sets every ink only on a fill it is promised on', () => {
    const strays = pairs
      .filter((pair) => !promised.has(`${pair.ink} on ${pair.ground}`))
      .map((pair) => `${pair.ink} on ${pair.ground} at ${pair.at}`)
    expect(strays, 'promise the pair in contrast.ts, where the gate measures it, or draw a promised ink').toEqual([])
  })

  it('keeps faint off the tinted fills', () => {
    // Stated on its own because it is the rule most likely to be broken: a
    // selected row or a status is where a product reaches for the quietest
    // ink, and the one ink not promised there.
    const tinted = promises.filter((promise) => promise.ink === 'faint' && promise.ground.endsWith('-soft'))
    expect(tinted.map(promiseName)).toEqual([])
    expect(pairs.filter((pair) => pair.ink === 'faint' && pair.ground.endsWith('-soft')).map((pair) => pair.at)).toEqual([])
  })
})
