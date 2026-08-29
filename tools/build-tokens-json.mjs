/*
 * The theme, as DTCG JSON.
 *
 * One vocabulary, three forms: the CSS custom properties a product imports,
 * the Tailwind `@theme` block those compile into, and this - the form design
 * tools read. All three come from `theme.css`, which stays the single source;
 * a hand-kept JSON copy would drift from the stylesheet within a release.
 *
 * Format: Design Tokens Format Module 2025.10, the first stable version.
 * Note what that spec requires and older examples do not: `dimension` and
 * `duration` are objects with `value` and `unit`, not strings.
 *
 * Colours are deliberately left out. Most of them are `color-mix()` or
 * `oklch(from …)` expressions over a product's own accent - they have no fixed
 * value until a browser resolves them against a chosen `--accent-base`, and
 * writing today's amber into the file would state as fact something that is
 * true for exactly one product. The scales below are absolute, so they travel.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const themePath = resolve(here, '../packages/dowel/src/theme.css')
const outPath = resolve(here, '../packages/dowel/dist/tokens.json')
const css = readFileSync(themePath, 'utf8')

/** The value the theme declares for a custom property. */
function declared(name) {
  const match = css.match(new RegExp(`(?<![\\w-])--${name}\\s*:\\s*([^;]+);`))
  if (!match) throw new Error(`the theme no longer declares \`--${name}\``)
  return match[1].trim()
}

/** `9px` and `0.5rem` become the object the spec asks for. Only `px` and
 * `rem` are allowed there, which is all the theme uses. */
function dimension(name) {
  const raw = declared(name)
  const match = raw.match(/^(-?[\d.]+)(px|rem)$/)
  if (!match) throw new Error(`\`--${name}\` is \`${raw}\`, which is not a plain px or rem length`)
  return { $value: { value: Number(match[1]), unit: match[2] } }
}

/** `160ms` likewise. */
function duration(name) {
  const raw = declared(name)
  const match = raw.match(/^([\d.]+)(ms|s)$/)
  if (!match) throw new Error(`\`--${name}\` is \`${raw}\`, which is not a plain duration`)
  return { $value: { value: Number(match[1]), unit: match[2] } }
}

/** `cubic-bezier(0.2, 0, 0, 1)` becomes the four numbers the spec wants. */
function cubicBezier(name) {
  const raw = declared(name)
  const match = raw.match(/^cubic-bezier\(([^)]+)\)$/)
  if (!match) throw new Error(`\`--${name}\` is \`${raw}\`, which is not a cubic-bezier`)
  const points = match[1].split(',').map((n) => Number(n.trim()))
  if (points.length !== 4 || points.some(Number.isNaN)) {
    throw new Error(`\`--${name}\` does not have four numeric control points`)
  }
  return { $value: points }
}

function number(name) {
  const raw = declared(name)
  const value = Number(raw)
  if (Number.isNaN(value)) throw new Error(`\`--${name}\` is \`${raw}\`, which is not a number`)
  return { $value: value }
}

function fontFamily(name) {
  // A CSS font stack is a comma-separated list; the spec wants the array.
  return {
    $value: declared(name)
      .split(',')
      .map((face) => face.trim().replace(/^['"]|['"]$/g, '')),
  }
}

/** A type step and its line height, as one composite token. The theme keeps
 * them as two custom properties because that is what Tailwind reads. */
function typography(step) {
  const size = dimension(`text-${step}`).$value
  const leading = dimension(`text-${step}--line-height`).$value
  return { $value: { fontSize: size, lineHeight: leading } }
}

const radius = Object.fromEntries(
  ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].map((step) => [step, dimension(`radius-${step}`)]),
)

const tokens = {
  $description:
    'The dowel token vocabulary: the scales every product of the lacodda line is drawn on. Colours are omitted - they are derived per product from its own accent.',

  radius: {
    $type: 'dimension',
    $description: 'Corner radius. `md` is the control radius: inputs, buttons, list rows.',
    ...radius,
  },

  typography: {
    $type: 'typography',
    $description: 'Type steps, each with the line height it is set on.',
    ...Object.fromEntries(
      ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl'].map((step) => [step, typography(step)]),
    ),
  },

  fontFamily: {
    $type: 'fontFamily',
    sans: fontFamily('font-sans'),
    mono: fontFamily('font-mono'),
  },

  fontWeight: {
    $type: 'fontWeight',
    normal: number('font-weight-normal'),
    medium: number('font-weight-medium'),
    semibold: number('font-weight-semibold'),
  },

  duration: {
    $type: 'duration',
    $description: 'Motion. Cut to nothing under `prefers-reduced-motion`.',
    quick: duration('duration-quick'),
    base: duration('duration-base'),
    slow: duration('duration-slow'),
  },

  easing: {
    $type: 'cubicBezier',
    out: cubicBezier('ease-out'),
    'in-out': cubicBezier('ease-in-out'),
  },

  layer: {
    $type: 'number',
    $description:
      'Stacking order. The names are a promise about what covers what; the values only mean anything relative to each other.',
    ...Object.fromEntries(
      ['popup', 'sticky', 'menu', 'floating', 'overlay', 'modal', 'palette', 'toast'].map((name) => [
        name,
        number(`z-${name}`),
      ]),
    ),
  },
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, `${JSON.stringify(tokens, null, 2)}\n`)
