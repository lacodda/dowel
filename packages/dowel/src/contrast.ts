/*
 * What the theme promises about contrast: every ink, on every ground it may be
 * set on, and how far apart the two have to be.
 *
 * One list for everything that asks. The CI gate resolves the theme in a
 * browser for every product of the line and holds each pair to its floor; the
 * stand measures the same pairs in the accent and theme on screen; the docs
 * print them. A pair added here is checked everywhere at once, and a pair
 * nobody promised is one the set is not allowed to draw - the class gate reads
 * this list to say which inks may sit on which fills.
 *
 * The floor of a pair is not a number written beside it but WCAG's rule for
 * its kind at a type step: text under 24px (or under 18.66px bold) needs 4.5:1
 * at AA and 7:1 at AAA, larger text 3:1 and 4.5:1, and a boundary - the edge
 * that tells a control from its ground - 3:1. The gate asks the rule at every
 * step of the type scale, so a pair is held to what the smallest text set in
 * it needs. The scale stops at 21px and 600, which is why every text floor
 * here comes out at the small-text figure: there is no step of the line where
 * a quieter ink would be enough.
 */

/** A colour of the theme, by its token name without the dashes. */
export type ContrastToken = string

/** How hard a pair has to work: WCAG's two levels. */
export type ContrastLevel = 'AA' | 'AAA'

/** Text is read; a boundary only has to be seen (WCAG 1.4.11). */
export type ContrastKind = 'text' | 'boundary'

/** The theme's two contrast modes: as drawn, and under
 * `prefers-contrast: more` or the `contrast-more` class. */
export type ContrastMode = 'normal' | 'more'

/** One pair the theme promises. */
export interface ContrastPromise {
  /** The token the text or the line is drawn in. */
  ink: ContrastToken
  /** The token it sits on. A translucent one (`soft`, `accent-soft`,
   * `good-soft`) is laid over `over` first, the way the screen draws it. */
  ground: ContrastToken
  /** The opaque surface under a translucent ground. */
  over?: 'bg' | 'raise'
  kind: ContrastKind
  level: ContrastLevel
  /** What the pair is for, in a few words. */
  role: string
}

/** A type step: its size in CSS pixels, and the heaviest weight it is set in. */
export interface TypeStep {
  size: number
  weight: number
}

/** WCAG's large text: 18pt, or 14pt bold - 24px, or 18.66px at 700. */
export function isLargeText({ size, weight }: TypeStep): boolean {
  return size >= 24 || (size >= 18.66 && weight >= 700)
}

/** The ratio a pair has to clear when its text is set at `step`. Without a
 * step, the floor for ordinary text - which is every step of this scale. */
export function contrastFloor(
  { kind, level }: Pick<ContrastPromise, 'kind' | 'level'>,
  step: TypeStep = { size: 14, weight: 400 },
): number {
  if (kind === 'boundary') return 3
  const large = isLargeText(step)
  if (level === 'AAA') return large ? 4.5 : 7
  return large ? 3 : 4.5
}

/** Every opaque surface, and every translucent one over each of them: where
 * any ink of the set may stand. */
const NEUTRAL: readonly Pick<ContrastPromise, 'ground' | 'over'>[] = [
  { ground: 'bg' },
  { ground: 'raise' },
  { ground: 'soft', over: 'bg' },
  { ground: 'soft', over: 'raise' },
  { ground: 'softer', over: 'bg' },
  { ground: 'softer', over: 'raise' },
]

/** A tinted fill, over both surfaces: a selected row, a status. */
const tinted = (fill: string): Pick<ContrastPromise, 'ground' | 'over'>[] => [
  { ground: fill, over: 'bg' },
  { ground: fill, over: 'raise' },
]

const STATUSES = ['good', 'warn', 'bad', 'info'] as const
const TINTED = [...tinted('accent-soft'), ...STATUSES.flatMap((status) => tinted(`${status}-soft`))]

function on(
  ink: string,
  grounds: readonly Pick<ContrastPromise, 'ground' | 'over'>[],
  kind: ContrastKind,
  level: ContrastLevel,
  role: string,
): ContrastPromise[] {
  return grounds.map((ground) => ({ ink, ...ground, kind, level, role }))
}

/**
 * The pairs, in a mode.
 *
 * As drawn: body text at AAA everywhere; `dim` at AA on every ground including
 * the tinted fills; `faint` at AA on the neutral grounds only - on a tinted
 * fill the quiet ink is `dim`. The accent and the four statuses are text too
 * (a link, the word on a badge), on the neutral grounds and on their own soft
 * fill. A fill's partner (`on-accent`, `on-warn`) on the fill.
 *
 * Under more contrast the three neutral inks rise a level - `text` and `dim`
 * to AAA everywhere, `faint` to AA on the tinted fills as well - and the
 * hairlines become boundaries: `line` against both surfaces, `line-2` against
 * every ground a control stands on.
 */
export function contrastPromises(mode: ContrastMode = 'normal'): ContrastPromise[] {
  const more = mode === 'more'
  return [
    ...on('text', [...NEUTRAL, ...TINTED], 'text', 'AAA', 'body text'),
    ...on('dim', [...NEUTRAL, ...TINTED], 'text', more ? 'AAA' : 'AA', 'secondary text'),
    ...on('faint', more ? [...NEUTRAL, ...TINTED] : NEUTRAL, 'text', 'AA', 'quiet text'),
    ...on('accent', [...NEUTRAL, ...tinted('accent-soft')], 'text', 'AA', 'a link, the word on its fill'),
    ...on('accent-2', NEUTRAL, 'text', 'AA', 'a link under the pointer'),
    ...STATUSES.flatMap((status) =>
      on(status, [...NEUTRAL, ...tinted(`${status}-soft`)], 'text', 'AA', 'a status, the word on its fill'),
    ),
    ...on('on-accent', [{ ground: 'accent' }, { ground: 'accent-2' }], 'text', 'AA', 'text on a fill'),
    // A neutral mark is cut the other way: `faint` is the fill and the page's
    // own ground the glyph, which is the same pair as faint text read back.
    ...on('bg', [{ ground: 'faint' }], 'text', 'AA', 'a glyph on a neutral mark'),
    ...STATUSES.flatMap((status) => on(`on-${status}`, [{ ground: status }], 'text', 'AA', 'text on a fill')),
    ...(more
      ? [
          ...on('line', [{ ground: 'bg' }, { ground: 'raise' }], 'boundary', 'AA', 'a divider'),
          ...on('line-2', [...NEUTRAL, ...TINTED], 'boundary', 'AA', 'the edge of a control'),
        ]
      : []),
  ]
}

/** An sRGB colour, channels 0-255, and its alpha from 0 to 1. */
export type Rgba = readonly [number, number, number, number?]
export type Rgb = readonly [number, number, number]

/** A translucent colour laid over an opaque one, as a browser composites it:
 * in sRGB, channel by channel. */
export function composite([r, g, b, a = 1]: Rgba, [R, G, B]: Rgb): Rgb {
  return [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]
}

/** WCAG 2 relative luminance of an sRGB colour, channels 0-255. */
export function luminance([r, g, b]: Rgb): number {
  const linear = (channel: number) => {
    const c = channel / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

/** WCAG 2 contrast ratio of two opaque colours, from 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** The ratio a promise measures, given a colour for each token: a
 * translucent ink or ground is laid over what is under it first. */
export function measure(promise: ContrastPromise, colour: (token: ContrastToken) => Rgba): number {
  const surface = composite(colour(promise.over ?? promise.ground), [0, 0, 0])
  const ground = promise.over ? composite(colour(promise.ground), surface) : surface
  return contrastRatio(composite(colour(promise.ink), ground), ground)
}

/** How a promise is named in a report: `faint on soft over raise`. */
export function promiseName({ ink, ground, over }: ContrastPromise): string {
  return over ? `${ink} on ${ground} over ${over}` : `${ink} on ${ground}`
}
