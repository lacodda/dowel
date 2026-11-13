import { readdirSync, readFileSync, statSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { deprecationNote, deprecations, type Deprecation } from '../deprecated.js'
import { findRawColor } from '../eslint/no-raw-color.js'
import { THEME_IMPORT } from './doctor.js'
import {
  COLOR_UTILITIES,
  NAME_END,
  NAME_START,
  UTILITY_OPENER,
  stockColorNames,
  stockNames,
  stockTokens,
  stockUtilities,
  stockUtilityNames,
  type Replacement,
} from './stock.js'

/*
 * Reading someone else's project.
 *
 * This is the half of the migration tools that only looks. It walks a
 * project's sources and reports two things: names from the stock shadcn
 * vocabulary, and colours written down instead of named.
 *
 * The colour half deliberately calls `findRawColor` - the same function the
 * ESLint rule calls, not a second copy of the patterns. Two implementations of
 * "what counts as a raw colour" would drift, and the drift would be invisible:
 * the rule would pass a file the report calls dirty, or worse, the other way
 * round, and a migration would be declared finished on a project the linter
 * then rejects.
 *
 * Why a scanner at all, when the rule exists: `check` runs *before* a project
 * has adopted anything. It needs no ESLint installation, no flat config, no
 * parser that agrees with the project's TypeScript version - the moment those
 * are required, the tool can only be run by a project that has already done
 * the thing the tool is supposed to help with.
 *
 * The trade is that this reads text rather than an abstract syntax tree, so it
 * cannot tell a class name inside a string from the same characters inside a
 * comment. That is the right trade for a report - it is advisory, a human
 * reads every line of it - and the wrong one for the linter, which is why the
 * linter still parses.
 */

/** Where a finding is. Line and column are 1-based, as an editor counts. */
export interface Location {
  readonly file: string
  readonly line: number
  readonly column: number
}

/** One thing found in one place. */
export interface Finding extends Location {
  /** `stock` - a name from the shadcn vocabulary; `color` - a colour written
   * down rather than named; `renamed` - a name of dowel's own that has moved,
   * still working until the next major. */
  readonly kind: 'stock' | 'color' | 'renamed'
  /** The text that was matched, for showing back to the reader. */
  readonly text: string
  /** What is wrong, in a sentence. */
  readonly message: string
  /** The token to use instead, when there is an honest one. */
  readonly replacement?: Replacement
}

/** Which files are worth reading.
 *
 * CSS is here because the stock vocabulary lives in a stylesheet: a project
 * migrating from shadcn has `--background: 0 0% 100%` in its own theme file,
 * and that is the first thing to find. */
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.mdx'])

/** A test file, where a colour is the subject rather than the styling.
 *
 * The linter already exempts these - a test about the accent has to write a
 * hex down to have something to assert - and this has to exempt exactly the
 * same files. Sharing `findRawColor` keeps the two agreeing on what a colour
 * *is*; it cannot make them agree on where one is allowed, and the first live
 * run of `check` reported six violations in dowel's own stand that the linter
 * passes. A report stricter than the build it precedes teaches a reader to
 * ignore it. */
const TEST_FILE = /\.(?:test|spec)\.[jt]sx?$/

/** Directories never worth walking into.
 *
 * `node_modules` would otherwise dominate the report with other people's
 * colours, and a build output would report the same finding a second time from
 * the compiled copy - which reads as two problems where there is one. */
const SKIP_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.astro',
  '.turbo',
  'coverage',
  'target',
])

/** Every file under `root` worth scanning, as absolute paths, in a stable
 * order - a report that reshuffles between runs cannot be diffed. */
export function collectFiles(root: string): string[] {
  const found: string[] = []

  const walk = (directory: string): void => {
    let entries: string[]
    try {
      entries = readdirSync(directory).sort()
    } catch {
      // A directory that cannot be read is not a finding: it is somebody's
      // permissions, and stopping the whole report over it would be worse
      // than the gap.
      return
    }

    for (const entry of entries) {
      const path = resolve(directory, entry)
      let isDirectory: boolean
      try {
        isDirectory = statSync(path).isDirectory()
      } catch {
        continue
      }

      if (isDirectory) {
        if (SKIP_DIRECTORIES.has(entry) || entry.startsWith('.')) continue
        walk(path)
        continue
      }

      const dot = entry.lastIndexOf('.')
      if (dot < 0) continue
      if (!EXTENSIONS.has(entry.slice(dot))) continue
      found.push(path)
    }
  }

  walk(root)
  return found
}

/** A stock custom property, as it appears in either half of a project:
 * `--muted-foreground` in a stylesheet, `var(--muted-foreground)` in a style
 * object.
 *
 * Built from the table rather than written out, so a name added there is found
 * here without a second edit. */
const STOCK_PROPERTY = new RegExp(`${NAME_START}--(${stockNames.join('|')})${NAME_END}`, 'g')

/** The same names as Tailwind utilities, which is how they reach a component:
 * `bg-muted`, `text-muted-foreground`, `border-input`, `hover:bg-accent`.
 *
 * The prefix list is what Tailwind actually generates from a colour token, and
 * the opening character class is what keeps `bg-primary` from matching inside
 * `custom-bg-primary`. */
const STOCK_UTILITY = new RegExp(
  `${UTILITY_OPENER}((?:${COLOR_UTILITIES})-(?:${stockColorNames.join('|')}))${NAME_END}`,
  'g',
)

/** Tailwind's stock weights and shadows, which the theme wipes, wherever a
 * class word can stand - a variant before one included. */
const STOCK_STEP = new RegExp(`${UTILITY_OPENER}(${stockUtilityNames.join('|')})${NAME_END}`, 'gm')

/** Turn an offset into a 1-based line and column. */
function locate(source: string, index: number): { line: number; column: number } {
  let line = 1
  let lineStart = 0
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10 /* \n */) {
      line += 1
      lineStart = i + 1
    }
  }
  return { line, column: index - lineStart + 1 }
}

/** Every string literal in a source file, with where it starts.
 *
 * This is the textual stand-in for the rule's `Literal` and `TemplateElement`
 * visitors, and it exists so that a colour is only reported where a colour
 * could actually be written - in a string - rather than anywhere the
 * characters happen to appear. Without it, a comment explaining the rule would
 * be a finding: it has to write a colour down to say which ones are forbidden.
 *
 * It is a small scanner rather than a regular expression because quotes nest:
 * an apostrophe inside double quotes is one string, not two.
 */
export function stringLiterals(source: string): { text: string; index: number }[] {
  const literals: { text: string; index: number }[] = []
  let i = 0

  while (i < source.length) {
    const char = source[i]

    // A line comment: skip to the newline. Nothing in it is a literal, and a
    // commented-out colour is not a colour on a screen.
    if (char === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i += 1
      continue
    }

    // A block comment. An opener inside a string is handled by the branch
    // below taking the whole string first.
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2)
      i = end < 0 ? source.length : end + 2
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char
      const start = i + 1
      i = start
      while (i < source.length) {
        if (source[i] === '\\') {
          i += 2
          continue
        }
        if (source[i] === quote) break
        i += 1
      }
      literals.push({ text: source.slice(start, i), index: start })
      i += 1
      continue
    }

    i += 1
  }

  return literals
}

/** What to say about one match.
 *
 * One builder for both shapes a stock name takes, so that a custom property
 * and the utility spelling of the same name cannot end up described
 * differently - which they were, and the ambiguous case was the one that
 * suffered: both branches said "has no dowel equivalent", and a name that
 * exists in both vocabularies has the opposite problem.
 *
 * `subject` is the text as it was written, `prefix` is what a replacement has
 * to keep in front of the token (`--`, or `bg-`). */
function describe(subject: string, prefix: string, replacement: Replacement): string {
  switch (replacement.kind) {
    case 'token':
      return `\`${subject}\` is the stock shadcn vocabulary; dowel calls this \`${prefix}${replacement.token}\`.`
    case 'unmapped':
      return `\`${subject}\` is the stock shadcn vocabulary and has no dowel equivalent - ${replacement.note}`
    case 'ambiguous':
      return `\`${subject}\` exists in both vocabularies: ${replacement.note}`
  }
}

/** Every place one row of the deprecation table is written in a source.
 *
 * A token is its custom property, and its utilities if it has any; a utility is
 * the word itself, wherever a variant has put it; an item is an import of its
 * file. Each comes back with what to say and what to write instead. */
export function renamedIn(
  source: string,
  row: Deprecation,
): { index: number; text: string; to: string }[] {
  const name = row.from.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
  const found: { index: number; text: string; to: string }[] = []

  const collect = (pattern: RegExp, to: (text: string) => string) => {
    for (const match of source.matchAll(pattern)) {
      const text = match.groups!.name!
      found.push({ index: match.index + match[0]!.indexOf(text), text, to: to(text) })
    }
  }

  if (row.kind === 'token') {
    collect(new RegExp(`${NAME_START}(?<name>--${name})${NAME_END}`, 'g'), () => `--${row.to}`)
    collect(
      new RegExp(`${UTILITY_OPENER}(?<name>(?:${COLOR_UTILITIES})-${name})${NAME_END}`, 'gm'),
      (text) => `${text.slice(0, text.length - row.from.length)}${row.to}`,
    )
  } else if (row.kind === 'utility') {
    collect(new RegExp(`${UTILITY_OPENER}(?<name>${name})${NAME_END}`, 'gm'), () => row.to)
  } else {
    // The path of an import, which is the only place an item's name stands for
    // the item. Reported, never rewritten: the file has not moved.
    collect(new RegExp(`['"][^'"\\n]*/(?<name>${name})['"]`, 'g'), () => row.to)
  }
  return found
}

/** Read one file and say what is wrong with it. */
export function scanSource(source: string, file: string, rows: readonly Deprecation[] = deprecations): Finding[] {
  const findings: Finding[] = []
  const isStylesheet = file.endsWith('.css')
  /* Stock names are still reported in a test - a test on the old vocabulary
   * has to be migrated with everything else. Only the colour pass is exempt. */
  const isTest = TEST_FILE.test(file)

  const add = (
    kind: Finding['kind'],
    index: number,
    text: string,
    message: string,
    replacement?: Replacement,
  ) => {
    const { line, column } = locate(source, index)
    findings.push({ file, line, column, kind, text, message, replacement })
  }

  /* Stock custom properties, anywhere in the file. In a stylesheet that is a
   * declaration; in a component it is a `var()` call. Both are the same
   * finding and take the same fix. */
  for (const match of source.matchAll(STOCK_PROPERTY)) {
    const name = match[1]!
    const replacement = stockTokens[name]!
    add('stock', match.index, match[0]!, describe(`--${name}`, '--', replacement), replacement)
  }

  /* The same names as utilities. Only in code: a stylesheet writing
   * `bg-primary` is writing about a class, usually in an `@apply`, and the
   * custom-property pass above has already spoken about the same file. */
  if (!isStylesheet) {
    for (const match of source.matchAll(STOCK_UTILITY)) {
      const utility = match[1]!
      const name = stockNames.find((candidate) => utility.endsWith(`-${candidate}`))
      if (!name) continue
      const replacement = stockTokens[name]!
      const prefix = utility.slice(0, utility.length - name.length)
      add(
        'stock',
        match.index + match[0]!.indexOf(utility),
        utility,
        describe(utility, prefix, replacement),
        replacement,
      )
    }
  }

  /* Tailwind's own steps the theme clears. In a stylesheet as well as in
   * code: an `@apply font-bold` compiles to nothing just the same, and no
   * other pass speaks for it. */
  for (const match of source.matchAll(STOCK_STEP)) {
    const utility = match[1]!
    const to = stockUtilities[utility]!
    add(
      'stock',
      match.index + match[0]!.indexOf(utility),
      utility,
      `\`${utility}\` is a step of Tailwind's own that the dowel theme does not define, so it compiles to nothing; the vocabulary's word is \`${to}\`.`,
      { kind: 'token', token: to },
    )
  }

  // A stylesheet that defines the dowel tokens is the one place raw colour
  // belongs, and where an old name is declared on purpose. Recognised by what
  // it declares rather than by its name: a product may call its theme anything.
  const definesTheme = isStylesheet && /--accent-base\s*:/.test(source)

  /* Names of dowel's own that have moved. A stylesheet is read for these too:
   * unlike a stock name in `@apply`, nothing else would speak for it. */
  if (!definesTheme) {
    for (const row of rows) {
      for (const { index, text, to } of renamedIn(source, row)) {
        add('renamed', index, text, deprecationNote(row), { kind: 'token', token: to })
      }
    }
  }

  /* Colours written down. In code this reads string literals, exactly like the
   * rule does; a stylesheet is read whole, because that is where a colour
   * appears outside any string - and where, in a theme file, it is supposed
   * to. */
  if (isTest) {
    // Nothing: a test writes colours down on purpose, and the linter exempts
    // the same files.
  } else if (isStylesheet) {
    if (!definesTheme) {
      for (const [index, line] of source.split('\n').entries()) {
        const finding = findRawColor(line)
        if (finding) {
          findings.push({
            file,
            line: index + 1,
            column: 1,
            kind: 'color',
            text: line.trim(),
            message: finding.message,
          })
        }
      }
    }
  } else {
    for (const literal of stringLiterals(source)) {
      const finding = findRawColor(literal.text)
      if (finding) add('color', literal.index, literal.text.trim(), finding.message)
    }
  }

  return findings.sort((a, b) => a.line - b.line || a.column - b.column)
}

/** Whether a stylesheet of this project imports the dowel theme: from the
 * package, or from where the registry copied it. */
export function onTheTheme(root: string): boolean {
  return collectFiles(root)
    .filter((file) => file.endsWith('.css'))
    .some((file) => {
      try {
        return THEME_IMPORT.test(readFileSync(file, 'utf8'))
      } catch {
        return false
      }
    })
}

/** `--accent` or a colour utility of it, and nothing longer.
 *
 * The one stock name dowel also has, which a project on the theme can only mean
 * dowel's way. `--accent-foreground` is not this: dowel has no such token, so
 * on the theme it is a name that resolves to nothing, and still worth saying. */
const DOWELS_ACCENT = new RegExp(`^(?:--|(?:${COLOR_UTILITIES})-)accent$`)

export function isDowelsAccent(text: string): boolean {
  return DOWELS_ACCENT.test(text)
}

/** Scan a whole project. Paths in the findings are relative to `root`, with
 * forward slashes, so a report reads the same on either platform. */
export function scanProject(root: string, rows: readonly Deprecation[] = deprecations): Finding[] {
  const findings: Finding[] = []
  for (const file of collectFiles(root)) {
    let source: string
    try {
      source = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    const name = relative(root, file).split(sep).join('/')
    findings.push(...scanSource(source, name, rows))
  }
  return findings
}
