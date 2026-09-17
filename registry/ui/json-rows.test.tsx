import { describe, expect, it } from 'vitest'
import { branchPaths, kindOf, summarise, visibleRows, type JsonValue } from './json-rows'

/*
 * The flattening, checked as arithmetic.
 *
 * The defects that matter here are the ones that make a viewer say something
 * false about the data: a null shown as an absence, a path that resolves to
 * the wrong value, a closed branch whose count is of the wrong thing.
 */

const open = (...paths: string[]) => new Set(paths)

describe('kindOf', () => {
  it('tells null from an object, which typeof does not', () => {
    // `typeof null === 'object'` is the oldest trap in the language, and here
    // it would draw a null as an empty expandable branch.
    expect(kindOf(null)).toBe('null')
    expect(kindOf({})).toBe('object')
  })

  it('tells an array from an object', () => {
    expect(kindOf([])).toBe('array')
    expect(kindOf({})).toBe('object')
  })

  it.each([
    ['a string', 'x', 'string'],
    ['a number', 1, 'number'],
    ['a boolean', true, 'boolean'],
  ])('names %s', (_label, value, expected) => {
    expect(kindOf(value as JsonValue)).toBe(expected)
  })
})

describe('visibleRows', () => {
  it('shows a closed branch as one row, whatever it holds', () => {
    // What keeps a viewer of a large document cheap: a thousand entries nobody
    // opened cost one row.
    const rows = visibleRows({ items: Array(1000).fill(1) }, open('$'))
    expect(rows).toHaveLength(2)
    expect(rows[1]!.size).toBe(1000)
  })

  it('shows what an open branch holds', () => {
    const rows = visibleRows({ a: 1, b: 2 }, open('$'))
    expect(rows.map((r) => r.key)).toEqual([null, 'a', 'b'])
  })

  it('counts depth from the root', () => {
    const rows = visibleRows({ a: { b: 1 } }, open('$', '$.a'))
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 2])
  })

  it('keeps a null as a value rather than an absence', () => {
    // A key present and null is not a key missing, and a viewer that draws
    // them the same way hides the difference that decides the bug.
    const [, row] = visibleRows({ a: null }, open('$'))
    expect(row!.kind).toBe('null')
    expect(row!.value).toBeNull()
  })

  it('keeps an empty branch openable rather than turning it into a leaf', () => {
    const [, row] = visibleRows({ a: {} }, open('$'))
    expect(row!.kind).toBe('object')
    expect(row!.size).toBe(0)
  })

  it('numbers an array position rather than naming it', () => {
    const rows = visibleRows({ xs: ['a'] }, open('$', '$.xs'))
    const item = rows.at(-1)!
    expect(item.index).toBe(true)
    expect(item.key).toBe('0')
    expect(item.path).toBe('$.xs[0]')
  })

  it('writes a path that resolves back to the value', () => {
    const value: JsonValue = { items: [{ name: 'kilna' }] }
    const rows = visibleRows(value, open('$', '$.items', '$.items[0]'))
    expect(rows.at(-1)!.path).toBe('$.items[0].name')
  })

  it('brackets a key that dot notation would break', () => {
    /*
     * Both of these are common in real data and both are silent failures. A
     * key with a space gives a path nothing can resolve; a key containing a
     * dot gives one that resolves to a DIFFERENT value - `$.a.b` for the
     * single key `"a.b"` points at `b` inside `a`.
     */
    const rows = visibleRows({ 'user name': 1, 'a.b': 2 }, open('$'))
    expect(rows[1]!.path).toBe('$["user name"]')
    expect(rows[2]!.path).toBe('$["a.b"]')
  })

  it('points each row at the branch it sits in', () => {
    // What Left uses to leave a deep branch in one press.
    const rows = visibleRows({ a: { b: 1 } }, open('$', '$.a'))
    expect(rows[1]!.parent).toBe('$')
    expect(rows[2]!.parent).toBe('$.a')
  })

  it('takes a root that is not the document', () => {
    // A viewer showing one field of a larger record still writes paths that
    // mean something in the record.
    const rows = visibleRows({ a: 1 }, open('$.config'), { root: '$.config' })
    expect(rows[1]!.path).toBe('$.config.a')
  })

  it('shows a bare value as a single row', () => {
    const rows = visibleRows('x', open())
    expect(rows).toEqual([
      { path: '$', key: null, index: false, kind: 'string', value: 'x', depth: 0, parent: undefined },
    ])
  })
})

describe('branchPaths', () => {
  it('opens the top levels rather than everything', () => {
    // "Expand all" on a document with a large array in it is how a viewer
    // freezes the screen around it. The bound is the feature.
    const value: JsonValue = { a: { b: { c: { d: 1 } } } }
    expect([...branchPaths(value)]).toEqual(['$', '$.a'])
  })

  it('leaves a big branch shut however shallow it is', () => {
    /*
     * The test this file did not have, and the defect it did not catch.
     *
     * A depth bound alone reads as sufficient and is not: cost is measured in
     * rows, depth counts levels, and a large array at the TOP level is inside
     * any depth bound worth having. Measured on the stand: a payload with
     * `assets: [1204]` rendered 1216 rows on arrival under `depth: 2` - the
     * exact freeze the bound exists to prevent, produced by the bound.
     */
    const value: JsonValue = { assets: Array.from({ length: 1204 }, () => 1) }
    const paths = branchPaths(value)
    expect(paths.has('$'), 'the root should still open').toBe(true)
    expect(paths.has('$.assets'), 'a 1204-entry array opened itself').toBe(false)
  })

  it('does not look inside a branch it declined to open', () => {
    // Those rows are not going to be drawn, so what is inside them is not a
    // question that needs answering.
    const value: JsonValue = { xs: Array.from({ length: 50 }, () => ({ a: 1 })) }
    expect([...branchPaths(value, { depth: 9 })]).toEqual(['$'])
  })

  it('opens a branch small enough to read', () => {
    // The bound is a ceiling on size, not a refusal to open arrays.
    const value: JsonValue = { xs: [{ a: 1 }, { b: 2 }] }
    expect([...branchPaths(value, { depth: 9 })].sort()).toEqual([
      '$',
      '$.xs',
      '$.xs[0]',
      '$.xs[1]',
    ])
  })

  it('takes a size bound from the caller', () => {
    const value: JsonValue = { xs: [1, 2, 3] }
    expect(branchPaths(value, { size: 2 }).has('$.xs')).toBe(false)
    expect(branchPaths(value, { size: 3 }).has('$.xs')).toBe(true)
  })

  it('goes as deep as it is asked to', () => {
    const value: JsonValue = { a: { b: { c: { d: 1 } } } }
    expect([...branchPaths(value, { depth: 3 })]).toEqual(['$', '$.a', '$.a.b'])
  })

  it('lists only what opens', () => {
    expect([...branchPaths({ a: 1, b: [2] })]).toEqual(['$', '$.b'])
  })

  it('keeps the opening cost to something a screen can hold', () => {
    /*
     * The assertion in the units the bound is actually about. Every test above
     * describes the RULE; this one measures its CONSEQUENCE, which is the
     * thing that went wrong - the rule was stated correctly and was the wrong
     * rule.
     *
     * The payload is the awkward shape on purpose: a large array at the top
     * level, records inside it, a few small branches beside it.
     */
    const payload: JsonValue = {
      event: 'release.published',
      totals: { primitives: 76, tests: 2361 },
      assets: Array.from({ length: 1204 }, (_, at) => ({ name: `a-${at}`, bytes: at })),
    }
    const rows = visibleRows(payload, branchPaths(payload))
    expect(
      rows.length,
      `a document arrives as ${rows.length} rows; the bound exists so it does not`,
    ).toBeLessThan(40)
  })

  it('writes the same paths the rows do', () => {
    /*
     * The two walks are separate code, and a path that disagrees between them
     * means "expand all" opens nothing: the set holds paths no row matches.
     */
    const value: JsonValue = { 'a.b': { xs: [{ n: 1 }] } }
    const paths = branchPaths(value, { depth: 9 })
    const rows = visibleRows(value, paths)
    for (const row of rows) {
      if (row.size !== undefined) {
        expect(paths.has(row.path), `\`${row.path}\` is a branch no path matches`).toBe(true)
      }
    }
  })
})

describe('summarise', () => {
  it('says how many, not what', () => {
    // A preview of the first entries reads as though those are all of them.
    const [root] = visibleRows({ a: 1, b: 2 }, new Set<string>())
    expect(summarise(root!)).toBe('{ 2 }')
  })

  it('brackets an array', () => {
    const [root] = visibleRows([1, 2, 3], new Set<string>())
    expect(summarise(root!)).toBe('[ 3 ]')
  })

  it('says zero rather than nothing for an empty branch', () => {
    const [root] = visibleRows({}, new Set<string>())
    expect(summarise(root!)).toBe('{ 0 }')
  })
})
