#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deprecationNote, deprecations } from '../packages/dowel/src/deprecated.ts'
import { scales } from './tokens/scales.mjs'

/*
 * The old names, kept working.
 *
 * A row of `packages/dowel/src/deprecated.ts` becomes a declaration at the end
 * of `theme.css`, between two markers, and an item at the old address of the
 * registry. Written into the theme rather than appended at build time: the
 * theme ships as the file that was tested, and everything that reads it - the
 * compiler, the palettes, the Rust modules, a product's copy - then sees the
 * alias without knowing there is such a thing.
 *
 *   node tools/build-aliases.mjs     # rewrite the block in theme.css
 */

const BEGIN = '/* dowel:deprecated - written by tools/build-aliases.mjs. Do not edit. */'
const END = '/* dowel:deprecated:end */'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const themePath = resolve(root, 'packages/dowel/src/theme.css')

/** The theme without its block of aliases: what the rows are checked against,
 * so an alias can never be what makes its own target exist. */
export function withoutAliases(theme) {
  const start = theme.indexOf(BEGIN)
  const end = theme.indexOf(END)
  return start < 0 || end < 0 ? theme : theme.slice(0, start) + theme.slice(end + END.length)
}

/** The theme's own names in `tokens.json`, which the Rust modules read as well.
 * That file has a shape of its own for each group, so an alias in the stylesheet
 * would not reach it, and a product reading it would lose the name. */
export function namesInTokensJson(theme) {
  const tokens = scales(withoutAliases(theme))
  const stepsOf = (group) => Object.keys(group).filter((key) => !key.startsWith('$'))
  const fixed = ['series', 'scale', 'status', 'heat', 'syntax'].flatMap((group) => Object.keys(tokens[group].dark))
  return new Set([
    ...fixed,
    ...stepsOf(tokens.radius).map((step) => `radius-${step}`),
    ...stepsOf(tokens.typography).map((step) => `text-${step}`),
    ...stepsOf(tokens.fontFamily).map((step) => `font-${step}`),
    ...stepsOf(tokens.fontWeight).map((step) => `font-weight-${step}`),
    ...stepsOf(tokens.icon).map((step) => `icon-${step}`),
    ...stepsOf(tokens.duration).map((step) => `duration-${step}`),
    ...stepsOf(tokens.easing).map((step) => `ease-${step}`),
    ...stepsOf(tokens.layer).map((step) => `z-${step}`),
  ])
}

/** The contents of the block: one declaration or utility per row that needs one.
 * A row this cannot honour stops the build, because the alternative is a
 * promise kept in one form of the theme and broken in another. */
export function aliasBlock(rows, theme) {
  const own = withoutAliases(theme)
  const declares = (name) => new RegExp(`(?<![\\w-])--${name}\\s*:`).test(own)
  const themeBlock = own.slice(own.indexOf('@theme inline {'), own.indexOf('\n}', own.indexOf('@theme inline {')))
  // What the compiler is told for a name, written again under the old one: it
  // inlines a value, so an alias through `var()` would make a different rule,
  // and one that depends on the compiler having emitted that custom property.
  const inTheme = (name) => themeBlock.match(new RegExp(`(?<![\\w-])--${name}\\s*:\\s*([^;]+);`))?.[1]
  const carried = namesInTokensJson(theme)

  const properties = []
  const themed = []
  const utilities = []
  for (const row of rows) {
    if (row.kind === 'token') {
      if (!declares(row.to)) throw new Error(`\`--${row.from}\` is renamed to \`--${row.to}\`, which the theme does not declare`)
      if (carried.has(row.to)) {
        throw new Error(`\`--${row.to}\` is carried by tokens.json and the Rust modules: renaming it is a major`)
      }
      if (inTheme(`color-${row.to}`)) {
        properties.push(`  --${row.from}: var(--${row.to});`)
        themed.push(`  --color-${row.from}: ${inTheme(`color-${row.to}`)};`)
      } else if (inTheme(row.to)) {
        themed.push(`  --${row.from}: ${inTheme(row.to)};`)
      } else {
        properties.push(`  --${row.from}: var(--${row.to});`)
      }
    } else if (row.kind === 'utility' && own.includes(`@utility ${row.to} {`)) {
      // A utility the theme writes by hand. One derived from a token follows
      // that token's own row.
      utilities.push(`@utility ${row.from} {\n  @apply ${row.to};\n}`)
    }
  }

  return [
    properties.length > 0 ? `:root {\n${properties.join('\n')}\n}` : '',
    themed.length > 0 ? `@theme inline {\n${themed.join('\n')}\n}` : '',
    ...utilities,
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** The theme with its block brought up to date. */
export function withAliases(rows, theme) {
  const start = theme.indexOf(BEGIN)
  const end = theme.indexOf(END)
  if (start < 0 || end < 0) throw new Error('theme.css has lost its block of aliases')
  const block = aliasBlock(rows, theme)
  return `${theme.slice(0, start)}${BEGIN}\n${block ? `${block}\n` : ''}${theme.slice(end)}`
}

/** What the old address of a renamed item serves: nothing of its own, the new
 * item as a dependency, and the sentence the CLI prints after installing. */
export function aliasItem(row, base) {
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: row.from,
    type: 'registry:ui',
    title: `${row.from} (renamed)`,
    description: deprecationNote(row),
    registryDependencies: [`${base}/${row.to}.json`],
    files: [],
    docs: `${deprecationNote(row)} This installed \`${row.to}\`.`,
    meta: { deprecated: { to: row.to, since: row.since, removeIn: row.removeIn } },
  }
}

export const itemRows = (rows) => rows.filter((row) => row.kind === 'item')

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const theme = readFileSync(themePath, 'utf8')
  const next = withAliases(deprecations, theme)
  if (next !== theme) writeFileSync(themePath, next)
  console.log(`aliases: ${deprecations.length} names on their way out`)
}
