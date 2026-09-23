import { describe, expect, it } from 'vitest'
import {
  ariaSort,
  isAbsent,
  sortRows,
  toggleSort,
  type Sort,
  type SortValue,
} from './table-sort'

/*
 * table-sort.
 *
 * The property that matters is stated once and then held in both directions,
 * because it is the one a two-line sort gets wrong: **absence is last either
 * way.** A test that only sorts ascending passes on the broken version, since
 * ascending is where `null` happens to land last anyway.
 */

interface Row {
  id: string
  score: number | null
  name: string | undefined
  done?: boolean
}

const rows: Row[] = [
  { id: 'a', score: 3, name: 'Beta', done: true },
  { id: 'b', score: null, name: 'Alpha', done: false },
  { id: 'c', score: 10, name: undefined, done: true },
  { id: 'd', score: 1, name: 'delta', done: false },
]

type Column = 'score' | 'name' | 'done'

const read = (row: Row, column: Column): SortValue => row[column]

const order = (sort: Sort<Column>, from: Row[] = rows) =>
  sortRows(from, sort, read, { locale: 'en' }).map((row) => row.id)

describe('absence sorts last, whichever way the column points', () => {
  it('puts the row with no value last when ascending', () => {
    expect(order({ column: 'score', direction: 'asc' })).toEqual(['d', 'a', 'c', 'b'])
  })

  it('puts it last when descending too', () => {
    // The assertion the whole file exists for. Rank absence with the rest and
    // flip the sign, and `b` leads this list - the reader asks for the highest
    // score and is handed the row that has none.
    expect(order({ column: 'score', direction: 'desc' })).toEqual(['c', 'a', 'd', 'b'])
  })

  it('treats undefined the same as null', () => {
    expect(order({ column: 'name', direction: 'asc' }).at(-1)).toBe('c')
    expect(order({ column: 'name', direction: 'desc' }).at(-1)).toBe('c')
  })

  it('keeps the absent rows among themselves in input order', () => {
    const many: Row[] = [
      { id: 'x', score: null, name: 'x' },
      { id: 'y', score: 5, name: 'y' },
      { id: 'z', score: null, name: 'z' },
    ]
    expect(order({ column: 'score', direction: 'desc' }, many)).toEqual(['y', 'x', 'z'])
  })

  it('does not count zero, empty text or false as absent', () => {
    // The bug a truthiness check would introduce, and the reason `isAbsent`
    // is a named function rather than `!value`.
    expect(isAbsent(0)).toBe(false)
    expect(isAbsent('')).toBe(false)
    expect(isAbsent(false)).toBe(false)
    expect(isAbsent(null)).toBe(true)
    expect(isAbsent(undefined)).toBe(true)

    const zeroes: Row[] = [
      { id: 'nothing', score: null, name: 'a' },
      { id: 'zero', score: 0, name: 'b' },
    ]
    expect(order({ column: 'score', direction: 'desc' }, zeroes)).toEqual(['zero', 'nothing'])
  })

  it('treats a number that is not a number as absent', () => {
    // Found by this test rather than reasoned about: NaN was first handled
    // inside the comparison, which is after presence has passed and therefore
    // inside the sign - so descending floated it to the top, the exact defect
    // the file exists to prevent, on a second kind of absence.
    const broken: Row[] = [
      { id: 'nan', score: Number.NaN, name: 'a' },
      { id: 'one', score: 1, name: 'b' },
    ]
    expect(order({ column: 'score', direction: 'asc' }, broken)).toEqual(['one', 'nan'])
    expect(order({ column: 'score', direction: 'desc' }, broken)).toEqual(['one', 'nan'])
  })
})

describe('what it compares with', () => {
  it('compares numbers as numbers, not as text', () => {
    // `[1, 10, 3]` sorted as text is `1, 10, 3`. The failure is invisible on
    // single digits, which is why the fixture has a 10 in it.
    expect(order({ column: 'score', direction: 'asc' }).slice(0, 3)).toEqual(['d', 'a', 'c'])
  })

  it('compares text by locale rather than by code point', () => {
    // `localeCompare` puts `delta` after `Beta`; a code-point comparison puts
    // every capital before every lower-case letter, so `delta` would come
    // last of the named rows.
    expect(order({ column: 'name', direction: 'asc' }).slice(0, 3)).toEqual(['b', 'a', 'd'])
  })

  it('sorts false before true', () => {
    expect(order({ column: 'done', direction: 'asc' })).toEqual(['b', 'd', 'a', 'c'])
  })

  it('leaves the caller its own array', () => {
    const input = [...rows]
    sortRows(input, { column: 'score', direction: 'desc' }, read, { locale: 'en' })
    expect(input.map((row) => row.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('the tiebreaker', () => {
  const tied: Row[] = [
    { id: 'second', score: 1, name: 'b' },
    { id: 'first', score: 1, name: 'a' },
  ]

  it('decides rows that compare equal', () => {
    const sorted = sortRows(tied, { column: 'score', direction: 'asc' }, read, {
      locale: 'en',
      tiebreak: (row) => row.id,
    })
    expect(sorted.map((row) => row.id)).toEqual(['first', 'second'])
  })

  it('does not reverse with the column', () => {
    // The property that makes it a tiebreaker rather than a second sort: rows
    // that tie must not swap places when the arrow flips, or the "stable"
    // order is the one thing that moves on every click.
    const ascending = sortRows(tied, { column: 'score', direction: 'asc' }, read, {
      locale: 'en',
      tiebreak: (row) => row.id,
    })
    const descending = sortRows(tied, { column: 'score', direction: 'desc' }, read, {
      locale: 'en',
      tiebreak: (row) => row.id,
    })
    expect(descending.map((row) => row.id)).toEqual(ascending.map((row) => row.id))
  })
})

describe('what a click does', () => {
  const sort: Sort<Column> = { column: 'score', direction: 'asc' }

  it('flips the direction of the column already sorted', () => {
    expect(toggleSort(sort, 'score')).toEqual({ column: 'score', direction: 'desc' })
    expect(toggleSort({ column: 'score', direction: 'desc' }, 'score')).toEqual({
      column: 'score',
      direction: 'asc',
    })
  })

  it('starts a different column ascending rather than inheriting', () => {
    // A two-state toggle would hand back `desc` here, because that is what the
    // previous column was - and the first click on a new column would produce
    // an order nobody asked for.
    expect(toggleSort({ column: 'score', direction: 'desc' }, 'name')).toEqual({
      column: 'name',
      direction: 'asc',
    })
  })
})

describe('what a heading announces', () => {
  it('names the direction of the sorted column', () => {
    expect(ariaSort({ column: 'score', direction: 'asc' }, 'score')).toBe('ascending')
    expect(ariaSort({ column: 'score', direction: 'desc' }, 'score')).toBe('descending')
  })

  it('says nothing at all about the others', () => {
    // Not `'none'`: it is valid, and some screen readers then announce it on
    // every cell of every unsorted column, which turns a table into a recital.
    expect(ariaSort({ column: 'score', direction: 'asc' }, 'name')).toBeUndefined()
    expect(ariaSort(undefined, 'score')).toBeUndefined()
  })
})
