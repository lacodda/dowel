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
  documentLocale,
  fallbackLocale,
  LocaleProvider,
  useLocale,
  type LocaleProviderProps,
} from './locale.js'
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

/** Series colours, for charts: identity, assigned 1..8 in order and never
 * cycled. Alone in this vocabulary alongside the status hues, they do not
 * follow the product accent - a series belongs to the data, not to the
 * product drawing it. The order is load-bearing: it is what keeps adjacent
 * pairs apart under colour-blind simulation, so these are not re-sorted. */
export const seriesTokens = [
  'series-1',
  'series-2',
  'series-3',
  'series-4',
  'series-5',
  'series-6',
  'series-7',
  'series-8',
] as const

/** Magnitude: one hue from light to dark, for heatmap cells and anything else
 * that encodes "how much" rather than "which". */
export const scaleTokens = [
  'scale-100',
  'scale-200',
  'scale-300',
  'scale-400',
  'scale-500',
  'scale-600',
  'scale-700',
] as const

/** A chart's own furniture, quieter than `line` because a gridline that
 * competes with the data is drawn wrong. */
export const chartTokens = ['chart-grid', 'chart-axis'] as const

/** Heat: five discrete steps for a grid of cells where colour carries the
 * value. Ordinal rather than sequential - told apart at a glance and matched
 * against a legend - which is why these are their own ramp and not five of
 * `scaleTokens`. The faintest step stays distinct from an empty cell, or the
 * grid claims a day was worked at zero when nobody reported it. */
export const heatTokens = ['heat-1', 'heat-2', 'heat-3', 'heat-4', 'heat-5'] as const

/** Syntax: the eight kinds of thing in a piece of code that are worth telling
 * apart in every language. Fixed like the series - `if` should not be magenta
 * in one product and cobalt in another - but measured against a different
 * threshold: these are read as text, so every slot clears 4.5:1 against the
 * surface code sits on, where a series colour only has to clear 3:1 as a
 * filled mark. They are also the one palette here not held to the
 * colour-blind floor, because syntax colour restates what the text already
 * says and CodeBlock's default draws none of it. */
export const syntaxTokens = [
  'syntax-keyword',
  'syntax-string',
  'syntax-number',
  'syntax-comment',
  'syntax-name',
  'syntax-type',
  'syntax-punctuation',
  'syntax-meta',
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

/**
 * How big things are: the floor for a pointer target, the step below the
 * spacing scale, and how tall a control and a table row stand.
 *
 * The last three are deliberately not `@theme` tokens. Tailwind inlines what
 * it finds there - `h-control` would compile to `height: 36px` - and an
 * override on a container would have nothing to bind to, which is exactly
 * what density needs. Declared as plain properties, they stay a reference.
 */
export const sizeTokens = [
  'size-target',
  'spacing-hair',
  'row-control',
  'row-control-sm',
  'row-control-lg',
  'row-cell',
] as const

/**
 * The window's own chrome: the strip at the top, the rail at the left, the
 * buttons that close the window, and how much of a frameless window's edge
 * can be grabbed to resize it.
 *
 * Its own group rather than a tail on `sizeTokens`, because it is a different
 * vocabulary: these describe a window, not a control, and only the products
 * that draw their own frame speak it. Four of the line's do, and by the fourth
 * the title bar was 40px in one and 2.4rem in another.
 *
 * All in the spacing namespace, which is not tidiness. `--size-*` yields one
 * utility, `size-*`, setting both axes - so `w-window-button` off a `--size-`
 * token compiles to nothing and the button loses its width with no error
 * anywhere. Every measurement here is one axis.
 */
export const chromeTokens = [
  'spacing-titlebar',
  'spacing-rail',
  'spacing-window-button',
  'spacing-resize-edge',
  'spacing-resize-corner',
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
  ...seriesTokens,
  ...scaleTokens,
  ...chartTokens,
  ...heatTokens,
  ...syntaxTokens,
  ...themeParameters,
  ...elevationTokens,
  ...radiusTokens,
  ...typeTokens,
  ...motionTokens,
  ...sizeTokens,
  ...chromeTokens,
  ...layerTokens,
] as const

export type ColorToken = (typeof colorTokens)[number]
export type ThemeParameter = (typeof themeParameters)[number]
export type ElevationToken = (typeof elevationTokens)[number]
export type RadiusToken = (typeof radiusTokens)[number]
export type TypeToken = (typeof typeTokens)[number]
export type MotionToken = (typeof motionTokens)[number]
export type SizeToken = (typeof sizeTokens)[number]
export type ChromeToken = (typeof chromeTokens)[number]
export type LayerToken = (typeof layerTokens)[number]
/* The chart and code palettes belong in this union as much as the rest, and
 * were missing from it until v0.25 - `allTokens` listed them while `Token` did
 * not, so `allTokens.map(token)` could not typecheck. Nothing had tried:
 * `token()` is called with a literal almost everywhere. */
export type SeriesToken = (typeof seriesTokens)[number]
export type ScaleToken = (typeof scaleTokens)[number]
export type ChartToken = (typeof chartTokens)[number]
export type HeatToken = (typeof heatTokens)[number]
export type SyntaxToken = (typeof syntaxTokens)[number]

export type Token =
  | ColorToken
  | SeriesToken
  | ScaleToken
  | ChartToken
  | HeatToken
  | SyntaxToken
  | ThemeParameter
  | ElevationToken
  | RadiusToken
  | TypeToken
  | MotionToken
  | SizeToken
  | ChromeToken
  | LayerToken

/** The custom property a token is read from: `token('accent')` is
 * `'--accent'`. Spelled out here so that no caller builds the string itself
 * and gets the prefix subtly wrong. */
export function token(name: Token): string {
  return `--${name}`
}
