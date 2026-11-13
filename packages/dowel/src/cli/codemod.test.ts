import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { rewriteSource } from './codemod.js'
import { collectFiles } from './scan.js'

/*
 * The only tool here that writes, so the tests are about restraint.
 *
 * Two properties matter more than the renaming itself: that it never rewrites
 * a name it cannot be sure about, and that it changes nothing else in the
 * file. A codemod whose diff contains one surprise gets reverted wholesale,
 * taking the ninety correct renames with it.
 */

describe('renaming', () => {
  it('rewrites a custom property', () => {
    const { source, changes } = rewriteSource('.x { color: var(--muted-foreground); }')
    expect(source).toBe('.x { color: var(--dim); }')
    expect(changes).toEqual([{ line: 1, from: '--muted-foreground', to: '--dim' }])
  })

  it('rewrites a utility and keeps its prefix', () => {
    const { source } = rewriteSource('<div className="bg-muted text-muted-foreground" />')
    expect(source).toBe('<div className="bg-soft text-dim" />')
  })

  it('keeps a variant in front of the utility', () => {
    const { source } = rewriteSource('<div className="hover:bg-muted" />')
    expect(source).toBe('<div className="hover:bg-soft" />')
  })

  it('rewrites the longest name rather than a prefix of it', () => {
    const { source } = rewriteSource('.x { border-color: var(--sidebar-border); }')
    expect(source).toBe('.x { border-color: var(--line); }')
  })

  it('does not touch a name embedded in a longer word', () => {
    const input = '<div className="custom-bg-muted" />'
    expect(rewriteSource(input).source).toBe(input)
  })

  /* A hyphen is a word boundary, so `\b` read `--radius-lg` as the stock
   * `--radius` with a tail and rewrote it to `--radius-md-lg`: on a project
   * already on dowel, `--write` broke every radius it had. */
  it.each([
    ['a longer token of dowel', '.x { border-radius: var(--radius-lg); }'],
    ['the hover partner of a stock name', '.x { color: var(--border-strong); }'],
    ['a longer utility', '<div className="bg-card-soft border-input-strong" />'],
    ['a BEM modifier', '.btn--primary { color: red; }'],
  ])('leaves %s alone', (_what, input) => {
    expect(rewriteSource(input)).toMatchObject({ source: input, changes: [] })
  })

  it('leaves the CSS property a stock name can spell', () => {
    // `--radius` has no colour utilities: `border-radius` is the property, and
    // `border-radius-md: 4px` is a declaration no browser reads.
    const input = '.x { border-radius: 4px; }'
    expect(rewriteSource(input)).toMatchObject({ source: input, changes: [] })
  })

  it('still renames the stock radius itself', () => {
    expect(rewriteSource('.x { border-radius: var(--radius); }').source).toBe('.x { border-radius: var(--radius-md); }')
  })

  it('renames through an opacity', () => {
    // The slash is where a name ends as surely as a space.
    expect(rewriteSource('<div className="bg-primary/50 ring-ring/30" />').source).toBe(
      '<div className="bg-accent/50 ring-accent/30" />',
    )
  })

  it('finds nothing to rewrite in the set itself', () => {
    // The whole of what dowel draws is on dowel's vocabulary by definition, so
    // anything the codemod would change here is the codemod being wrong - and
    // a product on the theme runs it after every upgrade.
    const root = resolve(import.meta.dirname, '../../../..')
    const rewritten = [
      ...collectFiles(resolve(root, 'registry/ui')),
      ...collectFiles(resolve(root, 'registry/blocks')),
      ...collectFiles(resolve(root, 'stand/src')),
      resolve(root, 'packages/dowel/src/theme.css'),
      resolve(root, 'packages/dowel/src/prose.css'),
    ].flatMap((file) => {
      const { changes } = rewriteSource(readFileSync(file, 'utf8'))
      return changes.map((change) => `${relative(root, file)}:${change.line} ${change.from} -> ${change.to}`)
    })
    expect(rewritten).toEqual([])
  })

  it('records the line each change is on', () => {
    const { changes } = rewriteSource(['var(--card)', '', 'var(--border)'].join('\n'))
    expect(changes.map((change) => change.line)).toEqual([1, 3])
  })
})

describe('what it refuses to rewrite', () => {
  /* The defect the first live run found. `--accent` means opposite things in
   * the two vocabularies, so rewriting it turns a migrated project's accent
   * into a grey - twenty-four of them, in dowel's own stand. */

  it('leaves a name that exists in both vocabularies exactly as it was', () => {
    const input = '.x { color: var(--accent); background: var(--accent-foreground); }'
    const { source, changes } = rewriteSource(input)
    expect(source).toBe(input)
    expect(changes).toEqual([])
  })

  it('says why it left it, rather than staying silent', () => {
    const { skipped } = rewriteSource('.x { color: var(--accent); }')
    expect(skipped).toHaveLength(1)
    expect(skipped[0]!.name).toBe('--accent')
    expect(skipped[0]!.note).toContain('hover fill')
  })

  it('leaves a name dowel has no equivalent for', () => {
    const input = '.x { color: var(--chart-1); }'
    const { source, skipped } = rewriteSource(input)
    expect(source).toBe(input)
    expect(skipped[0]!.note).toContain('chart palette')
  })

  it('still rewrites the unambiguous names around one it refuses', () => {
    // The refusal is per name, not per file: a file with `--accent` in it
    // still gets its `--muted` renamed.
    const { source } = rewriteSource('.x { a: var(--accent); b: var(--muted); }')
    expect(source).toBe('.x { a: var(--accent); b: var(--soft); }')
  })
})

describe('one pass, not two', () => {
  it('does not rename the output of a rename', () => {
    /* `--secondary` becomes `--soft`, and `--soft` is not a stock name, so
     * this is safe today. The property being defended is that the pass reads
     * the original text: a second pass over the output would be free to
     * rename again, and the table has a name (`accent`) whose stock meaning
     * *is* another entry's replacement. */
    const { source, changes } = rewriteSource('var(--secondary)')
    expect(source).toBe('var(--soft)')
    expect(changes).toHaveLength(1)
  })

  it('rewrites every occurrence on a line, not just the first', () => {
    const { source } = rewriteSource('var(--card) var(--card) var(--card)')
    expect(source).toBe('var(--raise) var(--raise) var(--raise)')
  })
})

describe('leaving the rest of the file alone', () => {
  it('changes nothing in a file with no stock names', () => {
    const input = ['import { cn } from "dowel-ui"', '', 'export const a = cn("bg-raise")', ''].join('\n')
    const { source, changes } = rewriteSource(input)
    expect(source).toBe(input)
    expect(changes).toEqual([])
  })

  it('preserves the line endings it was given', () => {
    // A codemod that normalised endings would show every line as changed on a
    // Windows checkout, burying the renames it actually made.
    const input = '.x {\r\n  color: var(--card);\r\n}\r\n'
    expect(rewriteSource(input).source).toBe('.x {\r\n  color: var(--raise);\r\n}\r\n')
  })

  it('does not touch surrounding punctuation when a utility is rewritten', () => {
    const { source } = rewriteSource('cn("bg-muted", isOn && "text-card-foreground")')
    expect(source).toBe('cn("bg-soft", isOn && "text-text")')
  })
})

describe("Tailwind's own steps the theme wipes", () => {
  it('rewrites a stock weight and a stock shadow to the vocabulary, variants kept', () => {
    const { source, changes } = rewriteSource('<div className="font-bold hover:shadow-lg shadow-sm font-light" />')
    expect(source).toBe('<div className="font-semibold hover:shadow-float shadow-lift font-normal" />')
    expect(changes.map((change) => `${change.from}>${change.to}`)).toEqual([
      'font-bold>font-semibold',
      'shadow-lg>shadow-float',
      'shadow-sm>shadow-lift',
      'font-light>font-normal',
    ])
  })

  it('reads the longest step whole, and leaves a word it is only part of', () => {
    expect(rewriteSource('<i className="shadow-2xl shadow-2xs shadow-md" />').source).toBe(
      '<i className="shadow-float shadow-lift shadow-raise" />',
    )
    // Not a class: a name, a longer utility, the vocabulary's own words.
    const kept = '<i data-x="my-font-bold" className="shadow-lg-ish font-semibold shadow-float shadow-none" />'
    expect(rewriteSource(kept).source).toBe(kept)
  })

  it('rewrites a step at the very start of a line, where nothing opens it', () => {
    expect(rewriteSource('font-bold shadow-lg').source).toBe('font-semibold shadow-float')
    expect(rewriteSource('bg-muted').source).toBe('bg-soft')
  })

  it('rewrites an @apply in a stylesheet, which compiles to nothing just the same', () => {
    expect(rewriteSource('.tip { @apply font-bold shadow-lg; }').source).toBe('.tip { @apply font-semibold shadow-float; }')
  })

  it('makes a stock token and a stock step in one pass, neither reading the other', () => {
    const { source } = rewriteSource('<p className="bg-muted font-bold text-muted-foreground shadow-xl" />')
    expect(source).toBe('<p className="bg-soft font-semibold text-dim shadow-float" />')
  })
})
