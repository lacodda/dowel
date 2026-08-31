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

export { cn } from './cn.js'
export { lineProducts, lineProduct, type LineProduct } from './line.js'
export {
  defaultStorageKey,
  initTheme,
  nextTheme,
  resolvedTheme,
  useTheme,
  useThemeSwitch,
  type Theme,
} from './theme.js'

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
  'on-good',
  'on-warn',
  'on-bad',
  'on-info',
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

/** Elevation. Three steps, and they change with the theme: a shadow that
 * works on a dark ground is invisible on a light one. */
export const elevationTokens = ['shadow-lift', 'shadow-raise', 'shadow-float'] as const

/** Corner radius. `md` is the control radius - inputs, buttons, list rows;
 * `inner` is what a shape nested inside another one takes. */
export const radiusTokens = [
  'radius-xs',
  'radius-sm',
  'radius-md',
  'radius-lg',
  'radius-xl',
  'radius-2xl',
  'radius-inner',
] as const

/** Type: sizes with their line heights, weights, and the two tracking steps
 * the products actually need. */
export const typeTokens = [
  'font-sans',
  'font-mono',
  'text-2xs',
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'font-weight-normal',
  'font-weight-medium',
  'font-weight-semibold',
  'tracking-caption',
  'tracking-tight',
] as const

/** Motion. The durations are read directly rather than through a utility -
 * Tailwind's `duration-*` takes a literal number - while the easings are a
 * namespace, so `ease-out` is a class. */
export const motionTokens = [
  'duration-quick',
  'duration-base',
  'duration-slow',
  'ease-out',
  'ease-in-out',
] as const

/** Stacking order. Not a Tailwind namespace either: a component reads these
 * as `z-index: var(--z-modal)`. The names are a promise about what covers
 * what, and the values only mean anything relative to each other. */
export const layerTokens = [
  'z-popup',
  'z-sticky',
  'z-menu',
  'z-floating',
  'z-overlay',
  'z-modal',
  'z-palette',
  'z-toast',
] as const

/** Every token the theme defines, in one list. Anything that iterates the
 * vocabulary - a docs page, an inspector, the JSON export, the test that keeps
 * this file honest against the stylesheet - reads this, so a new category
 * cannot be added and quietly missed by half of them. */
export const allTokens = [
  ...colorTokens,
  ...themeParameters,
  ...elevationTokens,
  ...radiusTokens,
  ...typeTokens,
  ...motionTokens,
  ...layerTokens,
] as const

export type ColorToken = (typeof colorTokens)[number]
export type ThemeParameter = (typeof themeParameters)[number]
export type ElevationToken = (typeof elevationTokens)[number]
export type RadiusToken = (typeof radiusTokens)[number]
export type TypeToken = (typeof typeTokens)[number]
export type MotionToken = (typeof motionTokens)[number]
export type LayerToken = (typeof layerTokens)[number]
export type Token =
  | ColorToken
  | ThemeParameter
  | ElevationToken
  | RadiusToken
  | TypeToken
  | MotionToken
  | LayerToken

/** The custom property a token is read from: `token('accent')` is
 * `'--accent'`. Spelled out here so that no caller builds the string itself
 * and gets the prefix subtly wrong. */
export function token(name: Token): string {
  return `--${name}`
}
