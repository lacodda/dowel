// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableRow,
  TableScroll,
  TableSortHeader,
} from './table'
import { sortRows, toggleSort, type Sort, type SortValue } from './table-sort'

/*
 * Table.
 *
 * What is worth testing here is not that a `<td>` renders. It is the three
 * things a hand-rolled table gets wrong and nobody notices with a mouse: the
 * heading that sorts is a real button, only the sorted column announces a
 * direction, and the empty state spans the whole width instead of hiding under
 * the first column.
 */

interface Row {
  id: string
  name: string
  score: number | null
}

const rows: Row[] = [
  { id: 'a', name: 'Beta', score: 3 },
  { id: 'b', name: 'Alpha', score: null },
  { id: 'c', name: 'Gamma', score: 10 },
]

const read = (row: Row, column: string): SortValue => row[column as 'name' | 'score']

function Example({
  data = rows,
  onSort,
  sticky,
}: { data?: Row[]; onSort?: (sort: Sort) => void; sticky?: boolean } = {}) {
  const [sort, setSort] = [
    { column: 'name', direction: 'asc' } as Sort,
    (next: Sort) => onSort?.(next),
  ]
  return (
    <TableScroll>
      <Table>
        <caption className="sr-only">Works</caption>
        <TableHead sticky={sticky}>
          <TableRow>
            <TableSortHeader
              column="name"
              sort={sort}
              onSortChange={(column) => setSort(toggleSort(sort, column))}
            >
              Name
            </TableSortHeader>
            <TableSortHeader
              column="score"
              numeric
              sort={sort}
              onSortChange={(column) => setSort(toggleSort(sort, column))}
            >
              Score
            </TableSortHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableEmpty colSpan={2}>Nothing here yet</TableEmpty>
          ) : (
            sortRows(data, sort, read, { locale: 'en' }).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell numeric>{row.score ?? '—'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableScroll>
  )
}

describe('the heading that sorts', () => {
  it('is a real button, so a keyboard can reach it', async () => {
    // The defect this exists to prevent: an `onClick` on the `<th>` looks
    // identical with a mouse and is unreachable without one - not focusable,
    // no Enter, announced as a cell rather than as something you can press.
    render(<Example />)
    const heading = screen.getByRole('columnheader', { name: /name/i })
    expect(within(heading).getByRole('button')).toBeDefined()
  })

  it('reorders from the keyboard', async () => {
    const onSort = vi.fn()
    render(<Example onSort={onSort} />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(onSort).toHaveBeenCalledWith({ column: 'name', direction: 'desc' })
  })

  it('announces the direction on the sorted column only', () => {
    render(<Example />)
    expect(screen.getByRole('columnheader', { name: /name/i }).getAttribute('aria-sort')).toBe(
      'ascending',
    )
    // Not `'none'`. It is valid and some readers then announce it on every
    // cell of the column, which turns a table into a recital.
    expect(
      screen.getByRole('columnheader', { name: /score/i }).hasAttribute('aria-sort'),
    ).toBe(false)
  })

  it('does not publish its arrow to a screen reader', () => {
    // `aria-sort` already says which way the column points; the arrow is the
    // same fact drawn, and announcing both reads the direction out twice.
    render(<Example />)
    const heading = screen.getByRole('columnheader', { name: /name/i })
    expect(heading.textContent).toContain('▲')
    // The accessible name is the word alone - the arrow is hidden from it.
    expect(within(heading).getByRole('button').textContent).toContain('▲')
    expect(screen.getByRole('button', { name: 'Name' })).toBeDefined()
  })
})

describe('the rows', () => {
  it('orders them by the sort, absence last', () => {
    render(<Example />)
    const cells = screen.getAllByRole('cell').map((cell) => cell.textContent)
    expect(cells).toEqual(['Alpha', '—', 'Beta', '3', 'Gamma', '10'])
  })

  it('says which row is picked out rather than only colouring it', () => {
    // A row marked by colour alone is one nobody using a reader knows about.
    const { container } = render(
      <table>
        <tbody>
          <TableRow selected>
            <td>picked</td>
          </TableRow>
          <TableRow>
            <td>not</td>
          </TableRow>
        </tbody>
      </table>,
    )
    const [picked, not] = Array.from(container.querySelectorAll('tr'))
    expect(picked?.getAttribute('aria-selected')).toBe('true')
    expect(not?.hasAttribute('aria-selected')).toBe(false)
  })

  it('gives a numeric cell the lining figures and the right edge', () => {
    // A column of numbers that is not aligned is the commonest defect in a
    // table and the one nobody files a bug about.
    render(<Example />)
    const [, score] = screen.getAllByRole('cell')
    expect(score?.className).toContain('tabular-nums')
    expect(score?.className).toContain('text-right')
  })
})

describe('the empty state', () => {
  it('spans every column', () => {
    // Without the span it sits under the first column and the rest of the
    // heading hangs over nothing.
    render(<Example data={[]} />)
    const cell = screen.getByRole('cell', { name: 'Nothing here yet' })
    expect(cell.getAttribute('colspan')).toBe('2')
  })

  it('keeps the heading where it is', () => {
    render(<Example data={[]} />)
    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
  })
})

describe('the shell', () => {
  it('scrolls in the wrapper, because a table cannot scroll itself', () => {
    // `overflow` on a `<table>` does nothing. The wrapper is the only place a
    // scrollbar can live, and the only thing a sticky heading can stick in.
    const { container } = render(<Example />)
    expect(container.firstElementChild?.className).toContain('overflow-x-auto')
  })

  it('gives a sticky heading its own ground', () => {
    // Transparent, it would have the body's rows sliding visibly under its
    // text - the defect is invisible until the table is longer than the fold.
    const { container } = render(<Example sticky />)
    const head = container.querySelector('thead')
    expect(head?.className).toContain('sticky')
    expect(head?.className).toContain('bg-bg')
  })

  it('does not stick unless asked', () => {
    const { container } = render(<Example />)
    expect(container.querySelector('thead')?.className).not.toContain('sticky')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example sticky />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(
      <Table className="text-base">
        <tbody>
          <tr>
            <td>x</td>
          </tr>
        </tbody>
      </Table>,
    )
    expect(container.querySelector('table')?.className).toContain('text-base')
    expect(container.querySelector('table')?.className).not.toContain('text-sm')
  })

  it('takes its row height from the region, not from a prop of its own', () => {
    /*
     * This had a `density` prop with words of its own - `base` and `dense` -
     * so "density" meant two things in one set: an attribute on a container
     * for every field, and a prop on this one element for rows. A product
     * wanting a tight screen had to know both and set both, and a table
     * inside a compact form stayed comfortable unless somebody remembered.
     *
     * The prop was also entirely untested, which is how it drifted from the
     * rest of the set without anything going red.
     */
    const { container } = render(<Example />)
    const table = container.querySelector('table')

    expect(table?.className).toContain('[&_td]:py-row')
    expect(table?.className).toContain('[&_th]:py-row')
    // The old vocabulary is gone rather than kept alongside: two ways to say
    // one thing is the drift, not the cure.
    expect(table?.className).not.toMatch(/py-2\.5|py-1\.5/)
  })

  it('passes axe, sorted, sticky and empty', async () => {
    // Unmounted between the two: two renders in one test mount into the same
    // document, and the second tree is then judged with the first still in it.
    const filled = await expectNoA11yViolations(<Example sticky />)
    filled.unmount()

    await expectNoA11yViolations(<Example data={[]} />)
  })
})
