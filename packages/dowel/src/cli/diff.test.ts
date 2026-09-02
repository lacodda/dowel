import { describe, expect, it } from 'vitest'
import { differs, diffLines, hunks } from './diff.js'

/*
 * Comparing a copied component with the one the registry serves.
 *
 * The property that matters most is the line-ending one. A checkout on Windows
 * hands back CRLF for a file the registry stores with LF, and a diff that took
 * that literally would report every component as entirely rewritten - true,
 * useless, and indistinguishable from a real change.
 */

describe('whether two files differ at all', () => {
  it('is false for identical text', () => {
    expect(differs('a\nb\n', 'a\nb\n')).toBe(false)
  })

  it('ignores the line endings', () => {
    expect(differs('a\nb\n', 'a\r\nb\r\n')).toBe(false)
  })

  it('is true for a real change', () => {
    expect(differs('a\nb\n', 'a\nc\n')).toBe(true)
  })
})

describe('marking lines', () => {
  it('marks an added line', () => {
    const marked = diffLines('a\nb', 'a\nx\nb')
    expect(marked.map((line) => line.kind)).toEqual(['same', 'added', 'same'])
    expect(marked[1]!.text).toBe('x')
  })

  it('marks a removed line', () => {
    const marked = diffLines('a\nx\nb', 'a\nb')
    expect(marked.map((line) => line.kind)).toEqual(['same', 'removed', 'same'])
  })

  it('marks a changed line as a removal and an addition', () => {
    const marked = diffLines('a\nb', 'a\nc')
    const kinds = marked.map((line) => line.kind)
    expect(kinds).toContain('removed')
    expect(kinds).toContain('added')
  })

  it('keeps every line of both files', () => {
    // Nothing is dropped: a line is same, added, or removed, and the counts
    // have to add up. A diff that silently loses a line reads as agreement.
    const from = 'a\nb\nc'
    const to = 'a\nx\nc\nd'
    const marked = diffLines(from, to)
    const fromLines = marked.filter((line) => line.kind !== 'added').length
    const toLines = marked.filter((line) => line.kind !== 'removed').length
    expect(fromLines).toBe(from.split('\n').length)
    expect(toLines).toBe(to.split('\n').length)
  })

  it('finds no difference between the same text with different endings', () => {
    const marked = diffLines('a\nb\n', 'a\r\nb\r\n')
    expect(marked.every((line) => line.kind === 'same')).toBe(true)
  })
})

describe('grouping into hunks', () => {
  it('produces nothing when the files agree', () => {
    expect(hunks(diffLines('a\nb', 'a\nb'))).toEqual([])
  })

  it('gives one hunk for one run of changes', () => {
    const long = Array.from({ length: 20 }, (_, i) => `line ${i}`)
    const changed = [...long]
    changed[10] = 'changed'
    expect(hunks(diffLines(long.join('\n'), changed.join('\n')))).toHaveLength(1)
  })

  it('gives two hunks for two distant runs', () => {
    const long = Array.from({ length: 40 }, (_, i) => `line ${i}`)
    const changed = [...long]
    changed[5] = 'one'
    changed[35] = 'two'
    expect(hunks(diffLines(long.join('\n'), changed.join('\n')))).toHaveLength(2)
  })

  it('merges runs whose context would overlap', () => {
    // Otherwise the same context lines print twice, once per hunk.
    const long = Array.from({ length: 20 }, (_, i) => `line ${i}`)
    const changed = [...long]
    changed[10] = 'one'
    changed[12] = 'two'
    expect(hunks(diffLines(long.join('\n'), changed.join('\n')))).toHaveLength(1)
  })

  it('does not print the whole file for a one-line change', () => {
    const long = Array.from({ length: 100 }, (_, i) => `line ${i}`)
    const changed = [...long]
    changed[50] = 'changed'
    const [hunk] = hunks(diffLines(long.join('\n'), changed.join('\n')))
    expect(hunk!.lines.length).toBeLessThan(12)
  })

  it('numbers the two sides separately', () => {
    /* An added line advances the consumer's numbering and not the registry's.
     * Getting this wrong makes every line number after the first insertion
     * point off by one - which is worse than no numbers, because it looks
     * authoritative. */
    const marked = diffLines('a\nb\nc', 'a\nx\nb\nc')
    const [hunk] = hunks(marked, 0)
    expect(hunk!.fromLine).toBe(2)
    expect(hunk!.toLine).toBe(2)
  })
})
