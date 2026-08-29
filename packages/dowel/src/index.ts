/*
 * Public surface of the package.
 *
 * The product is dowel; the package is `dowel-ui`, because npm declined the
 * bare name as too close to `del` and `bower`. Everything else - repository,
 * docs, mark - keeps the product's own name.
 *
 * The theme is the product here, and it is CSS: `import 'dowel-ui/theme.css'`.
 * This entry point carries only what JavaScript can usefully say about the
 * theme - the token names, so that a product can iterate them (a token
 * inspector, a docs page, a test) without re-typing the list and drifting from
 * the stylesheet.
 *
 * Primitives are distributed through the registry, not from here: a component
 * is copied into the product and becomes the product's own code.
 */

/** Tokens that carry a colour. Ordered as they read on a screen: grounds,
 * then hairlines, then ink, then the accent, then status. */
export const colorTokens = [
  'bg',
  'raise',
  'soft',
  'softer',
  'line',
  'line-2',
  'text',
  'dim',
  'faint',
  'accent',
  'accent-2',
  'accent-soft',
  'on-accent',
  'good',
  'good-soft',
  'warn',
  'warn-soft',
  'bad',
  'bad-soft',
  'info',
  'info-soft',
] as const

/** Tokens a product overrides to make the theme its own: the accent from the
 * brand-line registry, and how much of it bleeds into the greys. */
export const themeParameters = [
  'accent-base',
  'neutral-base',
  'neutral-tint',
  'neutral-tint-strong',
  'ground',
  'ink',
] as const

/** Everything else the theme defines. */
export const otherTokens = ['shadow-raise'] as const

export type ColorToken = (typeof colorTokens)[number]
export type ThemeParameter = (typeof themeParameters)[number]
export type OtherToken = (typeof otherTokens)[number]
export type Token = ColorToken | ThemeParameter | OtherToken

/** The custom property a token is read from: `token('accent')` is
 * `'--accent'`. Spelled out here so that no caller builds the string itself
 * and gets the prefix subtly wrong. */
export function token(name: Token): string {
  return `--${name}`
}
