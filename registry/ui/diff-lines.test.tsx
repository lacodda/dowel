import { describe, expect, it } from 'vitest'
import { countChanges, diffLines, LIMIT, rows } from './diff-lines'

/*
 * The comparison, checked as arithmetic.
 *
 * The property that matters most is the one the donor did not have: the two
 * columns of a side-by-side comparison must stay in step. Everything else here
 * is about the cases where a diff quietly says something untrue - a blank line
 * treated as an absence, a rewritten line drawn as two unrelated events, a
 * line number that counts rows instead of lines.
 */

describe('diffLines', () => {
  it('says nothing changed when nothing did', () => {
    expect(diffLines('a\nb', 'a\nb')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'same', text: 'b' },
    ])
  })

  it('finds the line that arrived', () => {
    expect(diffLines('a\nc', 'a\nb\nc')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'added', text: 'b' },
      { kind: 'same', text: 'c' },
    ])
  })

  it('finds the line that left', () => {
    expect(diffLines('a\nb\nc', 'a\nc')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'removed', text: 'b' },
      { kind: 'same', text: 'c' },
    ])
  })

  it('keeps the common lines rather than rewriting the whole text', () => {
    // The point of a subsequence: one changed line in the middle is one
    // change, not "all of this went and all of that arrived".
    const changes = diffLines('a\nb\nc', 'a\nB\nc')
    expect(changes.filter((c) => c.kind === 'same')).toHaveLength(2)
  })

  it('gives up honestly on something too long to compare', () => {
    // A frozen window is worse than an answer of "too much". The ceiling is
    // part of the contract, so it is checked rather than trusted.
    const long = Array(LIMIT + 1).fill('x').join('\n')
    const changes = diffLines(long, 'y')
    expect(changes).toHaveLength(2)
    expect(changes[0]!.kind).toBe('removed')
    expect(changes[1]!.kind).toBe('added')
  })
})

describe('rows', () => {
  it('keeps the two sides the same height', () => {
    /*
     * The property the whole shape rests on. Filtering the change list twice -
     * the obvious implementation, and the donor's - gives two columns of
     * different lengths the moment anything is inserted, and from there the
     * reader is comparing line 4 against line 3.
     */
    const paired = rows(diffLines('a\nb\nc', 'x\na\nb\nc\ny'))

    // One list of rows, so the two columns are the same height by
    // construction. The lines themselves are unequal in number - three against
    // five - and the difference is carried by gaps rather than by one column
    // being shorter.
    expect(paired).toHaveLength(5)
    expect(paired.filter((r) => r.before !== null)).toHaveLength(3)
    expect(paired.filter((r) => r.after !== null)).toHaveLength(5)

    // What the alignment is FOR: an unchanged line stands opposite itself, at
    // the same index on both sides. This is the assertion the donor's two
    // filters fail - there, `b` sits at index 1 on the left and index 2 on the
    // right.
    for (const row of paired) {
      if (row.kind === 'same') expect(row.before).toBe(row.after)
    }
    const b = paired.findIndex((r) => r.before === 'b')
    expect(paired[b]!.after).toBe('b')
  })

  it('puts an unchanged line opposite itself', () => {
    const [row] = rows(diffLines('a', 'a'))
    expect(row).toEqual({ before: 'a', after: 'a', kind: 'same', beforeLine: 1, afterLine: 1 })
  })

  it('leaves a gap opposite a line that only ever existed on one side', () => {
    const paired = rows(diffLines('a\nb', 'a'))
    expect(paired[1]).toEqual({
      before: 'b',
      after: null,
      kind: 'removed',
      beforeLine: 2,
      afterLine: null,
    })
  })

  it('pairs a rewritten line, rather than drawing a deletion and a stranger', () => {
    // The commonest edit there is. Split across two rows with a gap opposite
    // each, the reader has to work out that these are the same line.
    const paired = rows(diffLines('a\nold\nc', 'a\nnew\nc'))
    expect(paired).toHaveLength(3)
    expect(paired[1]).toEqual({
      before: 'old',
      after: 'new',
      kind: 'removed',
      beforeLine: 2,
      afterLine: 2,
    })
  })

  it('does not swallow the second of two consecutive insertions', () => {
    // The pairing walks the list and skips the change it consumed; getting
    // that wrong loses a line silently, which is the worst thing a diff can
    // do.
    const paired = rows(diffLines('a', 'x\ny\na'))
    expect(paired.map((r) => r.after)).toEqual(['x', 'y', 'a'])
    expect(paired.filter((r) => r.before !== null)).toHaveLength(1)
  })

  it('numbers by lines of the text, not by rows of the table', () => {
    /*
     * A gutter that counts rows is a gutter that sends the reader to the wrong
     * place: the rows include the gaps, and the file does not. After one
     * insertion every later number on the left would be one too high.
     */
    const paired = rows(diffLines('a\nb', 'x\na\nb'))
    expect(paired.map((r) => r.beforeLine)).toEqual([null, 1, 2])
    expect(paired.map((r) => r.afterLine)).toEqual([1, 2, 3])
  })

  it('tells an empty line apart from no line at all', () => {
    // `''` is a line somebody wrote with nothing on it; `null` is a side that
    // has nothing. Conflating them draws a blank line as a deletion.
    const paired = rows(diffLines('a\n\nb', 'a\n\nb'))
    expect(paired[1]!.before).toBe('')
    expect(paired[1]!.after).toBe('')
    expect(paired[1]!.kind).toBe('same')
  })

  it('has nothing to show for two empty texts', () => {
    // Two empty strings each split into one empty line, which is one unchanged
    // row - not a comparison of nothing against nothing.
    const paired = rows(diffLines('', ''))
    expect(paired).toEqual([
      { before: '', after: '', kind: 'same', beforeLine: 1, afterLine: 1 },
    ])
  })
})

describe('countChanges', () => {
  it('counts each side separately', () => {
    expect(countChanges(diffLines('a\nb\nc', 'a\nB\nc\nd'))).toEqual({ added: 2, removed: 1 })
  })

  it('counts nothing when nothing moved', () => {
    expect(countChanges(diffLines('a\nb', 'a\nb'))).toEqual({ added: 0, removed: 0 })
  })
})
