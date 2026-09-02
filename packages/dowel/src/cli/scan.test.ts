import { describe, expect, it } from 'vitest'
import { scanSource, stringLiterals } from './scan.js'
import { findRawColor } from '../eslint/no-raw-color.js'

/*
 * What `check` finds, and - more carefully - what it declines to find.
 *
 * The interesting failures of this scanner are all false positives, because a
 * migration report is read by somebody deciding whether to trust the tool. A
 * missed finding costs one more grep; a wrong one costs the tool its reader,
 * and if it reaches `codemod --write` it costs the project its code.
 *
 * The first live run produced both kinds of wrong finding at once, and the
 * cases below are that run, frozen.
 */

describe('stock names', () => {
  it('finds a custom property', () => {
    const findings = scanSource('.card { background: var(--muted-foreground); }', 'a.css')
    expect(findings).toHaveLength(1)
    expect(findings[0]!.kind).toBe('stock')
    expect(findings[0]!.message).toContain('--dim')
  })

  it('finds the utility spelling', () => {
    const findings = scanSource('<div className="bg-muted p-2" />', 'a.tsx')
    expect(findings.map((finding) => finding.text)).toEqual(['bg-muted'])
    expect(findings[0]!.message).toContain('bg-soft')
  })

  it('keeps the utility prefix in the replacement it suggests', () => {
    // `text-muted-foreground` becomes `text-dim`, not `bg-dim` and not `dim`.
    const findings = scanSource('<p className="text-muted-foreground" />', 'a.tsx')
    expect(findings[0]!.message).toContain('text-dim')
  })

  it('matches the longest name, not a prefix of it', () => {
    // `--sidebar` is a prefix of `--sidebar-border`; matching the short one
    // would report the wrong token and leave `-border` behind on a rewrite.
    const findings = scanSource('.x { border-color: var(--sidebar-border); }', 'a.css')
    expect(findings).toHaveLength(1)
    expect(findings[0]!.text).toBe('--sidebar-border')
    expect(findings[0]!.message).toContain('--line')
  })

  it('does not match a name embedded in a longer word', () => {
    const findings = scanSource('<div className="custom-bg-muted my-background" />', 'a.tsx')
    expect(findings).toEqual([])
  })

  it('reports a stock name in a test file', () => {
    // Only the colour pass is exempt in tests. A test asserting on the old
    // vocabulary has to be migrated with everything else.
    const findings = scanSource('expect(el).toHaveClass("bg-muted")', 'a.test.tsx')
    expect(findings.map((finding) => finding.kind)).toEqual(['stock'])
  })
})

describe('names that exist in both vocabularies', () => {
  /* The defect the first live run found: `--accent` is stock shadcn's hover
   * fill *and* dowel's flagship token. Reported as a plain stock name, it told
   * dowel's own stand it had twenty-four violations, and `codemod --write`
   * would have turned every accent on the screen grey. */

  it('does not call a correct use of --accent a stock name', () => {
    const findings = scanSource('.x { color: var(--accent); }', 'a.css')
    expect(findings).toHaveLength(1)
    expect(findings[0]!.replacement?.kind).toBe('ambiguous')
  })

  it('says what the ambiguity is rather than asserting a rename', () => {
    const findings = scanSource('.x { color: var(--accent); }', 'a.css')
    // The wrong message here is the interesting one: "has no dowel equivalent"
    // is what both non-token kinds used to say, and it is false for this one.
    expect(findings[0]!.message).not.toContain('no dowel equivalent')
    expect(findings[0]!.message).toContain('both vocabularies')
  })

  it('treats the utility spelling the same way', () => {
    const findings = scanSource('<div className="text-accent" />', 'a.tsx')
    expect(findings[0]!.replacement?.kind).toBe('ambiguous')
  })

  it('still renames the unambiguous neighbours of an ambiguous name', () => {
    // `--accent-foreground` is ambiguous; `--primary-foreground` is not.
    const findings = scanSource('.x { color: var(--primary-foreground); }', 'a.css')
    expect(findings[0]!.replacement).toEqual({ kind: 'token', token: 'on-accent' })
  })
})

describe('colours', () => {
  it('finds one written in a class', () => {
    const findings = scanSource('<div className="bg-[#d9569e]" />', 'a.tsx')
    expect(findings.map((finding) => finding.kind)).toEqual(['color'])
  })

  it('agrees with the lint rule about what a colour is', () => {
    // The two share `findRawColor` precisely so this cannot drift. The test
    // asserts the sharing rather than the patterns: a second copy of the
    // patterns would pass a test that only checked a few examples.
    const veil = 'bg-black/50'
    expect(findRawColor(veil)).toBeUndefined()
    expect(scanSource(`<div className="${veil}" />`, 'a.tsx')).toEqual([])
  })

  it('does not read a colour out of a comment', () => {
    const source = ['// The rule forbids #d9569e here.', 'const x = 1'].join('\n')
    expect(scanSource(source, 'a.tsx')).toEqual([])
  })

  it('does not read a colour out of a block comment', () => {
    const source = ['/* A theme might use #d9569e. */', 'const x = 1'].join('\n')
    expect(scanSource(source, 'a.tsx')).toEqual([])
  })

  it('is silent in a test file, as the linter is', () => {
    /* The second defect of the first live run: six findings in the stand's
     * own accent test, every one of them a colour the linter allows there.
     *
     * Only the colour pass is exempt, so this asserts on the colour findings
     * rather than on the whole result - the source below also mentions
     * `--accent`, which is reported in a test like anywhere else. */
    const source = 'expect(read("--accent")).toBe("#e8862d")'
    const colors = (file: string) => scanSource(source, file).filter((f) => f.kind === 'color')

    expect(colors('accent.test.tsx')).toEqual([])
    expect(colors('accent.spec.ts')).toEqual([])
    // ...but the same text in a component is a finding.
    expect(colors('accent.tsx')).toHaveLength(1)
  })

  it('allows raw colour in the file that defines the theme', () => {
    const theme = ':root { --accent-base: #e8862d; --other: #123456; }'
    expect(scanSource(theme, 'theme.css').filter((f) => f.kind === 'color')).toEqual([])
  })

  it('reports raw colour in a stylesheet that is not the theme', () => {
    const sheet = '.badge { background: #d9569e; }'
    expect(scanSource(sheet, 'badge.css').map((f) => f.kind)).toEqual(['color'])
  })
})

describe('locations', () => {
  it('counts lines from one and columns from one', () => {
    const source = ['const a = 1', '', 'const b = "bg-muted"'].join('\n')
    const findings = scanSource(source, 'a.tsx')
    expect(findings[0]!.line).toBe(3)
    // The utility starts inside the string, which starts at column 12.
    expect(findings[0]!.column).toBe(12)
  })

  it('sorts by position so a report can be diffed', () => {
    const source = ['var(--card)', 'var(--muted)', 'var(--border)'].join('\n')
    const findings = scanSource(source, 'a.css')
    expect(findings.map((finding) => finding.line)).toEqual([1, 2, 3])
  })
})

describe('string literals', () => {
  it('does not split a string on an apostrophe inside quotes', () => {
    const found = stringLiterals(`const a = "it's fine"`)
    expect(found.map((literal) => literal.text)).toEqual([`it's fine`])
  })

  it('handles an escaped quote', () => {
    const found = stringLiterals(`const a = 'a\\'b'`)
    expect(found).toHaveLength(1)
  })

  it('reads a template literal', () => {
    const found = stringLiterals('const a = `bg-muted`')
    expect(found.map((literal) => literal.text)).toEqual(['bg-muted'])
  })
})
