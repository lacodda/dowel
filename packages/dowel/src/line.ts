/*
 * The products of the lacodda line, and the colour each one is known by.
 *
 * These are the accents from the line's registry of marks: one hue per
 * product, fixed for the life of that product. A product's theme is its mark's
 * colour - the tile on its README, the icon in the taskbar and the primary
 * button on its screens are the same colour, because they are the same fact.
 *
 * The registry itself lives with the mark generator, outside this repository.
 * It is copied here rather than read, because a build must not reach into a
 * private toolchain to know what colour a button is; the release gate checks
 * that every product listed has an accent file, and the contrast tests run
 * over this list, so a wrong value cannot travel far.
 */

export interface LineProduct {
  /** Package-and-directory name, and the name of the accent file. */
  readonly name: string
  /** The two-letter code on the product's mark. */
  readonly code: string
  /** The accent, as the registry states it. */
  readonly accent: string
  /** The colour's name in the line's palette. */
  readonly colorName: string
}

export const lineProducts: readonly LineProduct[] = [
  { name: 'kasl', code: 'ka', accent: '#A9C23F', colorName: 'lime' },
  { name: 'kasl-server', code: 'ks', accent: '#D9A82E', colorName: 'gold' },
  { name: 'turnout', code: 'tn', accent: '#E85B72', colorName: 'rose' },
  { name: 'sefy', code: 'se', accent: '#35A8A0', colorName: 'teal' },
  { name: 'atlas', code: 'at', accent: '#8A7DF5', colorName: 'nebula' },
  { name: 'nitid', code: 'nd', accent: '#3FA9D9', colorName: 'cyan' },
  { name: 'midda', code: 'mi', accent: '#A46BE8', colorName: 'violet' },
  { name: 'nooma', code: 'nm', accent: '#3FA873', colorName: 'emerald' },
  { name: 'kilna', code: 'ki', accent: '#D9569E', colorName: 'magenta' },
  { name: 'lyrid', code: 'ly', accent: '#4A8FE8', colorName: 'azure' },
  { name: 'efema', code: 'ef', accent: '#5470E8', colorName: 'cobalt' },
  { name: 'dowel', code: 'dw', accent: '#E8862D', colorName: 'signal amber' },
  { name: 'lyrn', code: 'ln', accent: '#6D7BF2', colorName: 'indigo' },
  { name: 'austeris', code: 'au', accent: '#C25BD9', colorName: 'orchid' },
  { name: 'rhapsod', code: 'rh', accent: '#6CB14E', colorName: 'field green' },
  { name: 'hilvan', code: 'hv', accent: '#D64550', colorName: 'crimson' },
  /*
   * The last three marks are two-colour: the registry's palette of single hues
   * ran out at hilvan, and a product now owns either one hue or a pair drawn as
   * one diagonal gradient.
   *
   * The theme takes the first colour of the pair and nothing else. A gradient
   * is a property of the mark — the tile, the code, the banner rule — and an
   * accent is a flat colour a button is filled with, a focus ring is drawn in
   * and a link is set in. Carrying the pair into the vocabulary would make
   * every one of those a gradient, which is not what the pair is for.
   */
  { name: 'scheda', code: 'sc', accent: '#D9704A', colorName: 'terracotta (paired with sea)' },
  { name: 'furca', code: 'fr', accent: '#D9704A', colorName: 'terracotta (paired with olive)' },
  { name: 'rigger', code: 'rr', accent: '#8A62F0', colorName: 'iris (paired with lagoon)' },
]

/** The product with this name, or `undefined`. */
export function lineProduct(name: string): LineProduct | undefined {
  return lineProducts.find((product) => product.name === name)
}
