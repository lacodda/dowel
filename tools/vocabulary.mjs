#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

/*
 * Every name a product can have written down.
 *
 * `tests/vocabulary.json` is the record: tokens, the utilities the theme writes
 * by hand, registry items, entry points of the package, lint rules and what the
 * package exports. A name on it may only leave through the table in
 * `packages/dowel/src/deprecated.ts`, and that is what makes the vocabulary
 * frozen rather than merely described as frozen.
 *
 *   node tools/vocabulary.mjs          # is the record up to date?
 *   node tools/vocabulary.mjs --write  # add what is new
 *
 * `--write` only adds. Taking a name off the list is an edit to the JSON, in
 * the commit of the major that removes it.
 */

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const recordPath = resolve(root, 'tests/vocabulary.json')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

const sorted = (names) => [...new Set(names)].sort()

/** The names exported from one module, values and types alike. */
function exportsOf(source) {
  const file = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, false)
  const names = []
  file.forEachChild((node) => {
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) names.push(element.name.text)
    } else if (node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) names.push(declaration.name.getText(file))
      } else if (node.name) {
        names.push(node.name.text)
      }
    }
  })
  return names
}

/** The names as the sources have them today. */
export function surface() {
  const theme = read('packages/dowel/src/theme.css').replace(/\/\*[\s\S]*?\*\//g, '')
  const manifest = JSON.parse(read('packages/dowel/package.json'))
  const registry = JSON.parse(read('docs/public/r/registry.json'))
  const eslint = read('packages/dowel/src/eslint/index.ts')
  return {
    tokens: sorted([...theme.matchAll(/(?<![\w-])--([a-z0-9-]+)\s*:/g)].map((match) => match[1])),
    utilities: sorted([...theme.matchAll(/@utility\s+([\w-]+)/g)].map((match) => match[1])),
    items: sorted(registry.items.map((item) => item.name)),
    entryPoints: sorted(Object.keys(manifest.exports)),
    rules: sorted([...eslint.matchAll(/'(no-[a-z-]+)':/g)].map((match) => match[1])),
    exports: sorted(exportsOf(read('packages/dowel/src/index.ts'))),
  }
}

/** The record with what is new added, and nothing taken away. */
export function merged(recorded, live) {
  return Object.fromEntries(
    Object.keys(live).map((section) => [section, sorted([...(recorded[section] ?? []), ...live[section]])]),
  )
}

/** What is on one side and not the other, as a reader would say it. */
export function compare(recorded, live, deprecatedNames = new Set()) {
  const gone = []
  const unrecorded = []
  for (const section of Object.keys(live)) {
    const now = new Set(live[section])
    const before = new Set(recorded[section] ?? [])
    for (const name of before) if (!now.has(name) && !deprecatedNames.has(name)) gone.push(`${section}: ${name}`)
    for (const name of now) if (!before.has(name)) unrecorded.push(`${section}: ${name}`)
  }
  return { gone, unrecorded }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const live = surface()
  const recorded = JSON.parse(readFileSync(recordPath, 'utf8'))
  if (process.argv.includes('--write')) {
    writeFileSync(recordPath, `${JSON.stringify(merged(recorded, live), null, 2)}\n`)
  }
  const { unrecorded } = compare(process.argv.includes('--write') ? merged(recorded, live) : recorded, live)
  console.log(`vocabulary: ${unrecorded.length} new names unrecorded`)
}
