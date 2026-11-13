// @vitest-environment jsdom
import { useState } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { VirtualGrid, VirtualGridCell, VirtualGridColumn, type VirtualGridProps } from './virtual-grid'

/*
 * VirtualGrid.
 *
 * What a list a person works through needs and a list to read does not: the
 * cursor that is the selection, the keyboard that walks a hundred thousand
 * rows, the row a reader is told about being in the document, rows read by
 * index and drawn empty until read. jsdom lays nothing out, so where a box's
 * height matters it is given.
 */

const box = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')!
/** Every box this many pixels tall, so the window has a view to fill. */
function viewOf(height: number) {
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => height })
}
afterEach(() => Object.defineProperty(Element.prototype, 'clientHeight', box))

function Commits(props: Partial<VirtualGridProps> & { loaded?: (index: number) => boolean }) {
  const { loaded = () => true, ...rest } = props
  return (
    <VirtualGrid
      label="Commits"
      count={100_000}
      rowHeight={24}
      columns="grid-cols-[1fr_8rem]"
      header={
        <>
          <VirtualGridColumn>Message</VirtualGridColumn>
          <VirtualGridColumn>Author</VirtualGridColumn>
        </>
      }
      renderRow={(index) =>
        loaded(index) ? (
          <>
            <VirtualGridCell>Commit {index}</VirtualGridCell>
            <VirtualGridCell>Ines</VirtualGridCell>
          </>
        ) : null
      }
      className="h-96"
      {...rest}
    />
  )
}

/** The row the grid names as chosen - and only if it is in the document. */
const named = () => {
  const id = screen.getByRole('grid').getAttribute('aria-activedescendant')
  if (id === null) return null
  const row = document.getElementById(id)
  expect(row, 'the grid names a row that is not drawn').not.toBeNull()
  return within(row!).getAllByRole('gridcell')[0]!.textContent
}

describe('VirtualGrid', () => {
  it('draws a window of rows, not a hundred thousand', () => {
    render(<Commits />)
    const rows = within(screen.getByRole('grid')).getAllByRole('row')
    // The heading and a screenful.
    expect(rows.length).toBeGreaterThan(2)
    expect(rows.length).toBeLessThan(40)
    expect(rows[1]!.style.height).toBe('24px')
  })

  it('tells a reader where each row stands in the whole grid, after its heading', () => {
    render(<Commits />)
    const grid = screen.getByRole('grid')
    expect(grid.getAttribute('aria-rowcount')).toBe('100001')
    const rows = within(grid).getAllByRole('row')
    expect(rows[0]!.getAttribute('aria-rowindex')).toBe('1')
    expect(rows[1]!.getAttribute('aria-rowindex')).toBe('2')
    expect(within(rows[0]!).getAllByRole('columnheader')).toHaveLength(2)
  })

  it('counts no heading row when there is none', () => {
    render(<Commits header={undefined} />)
    const grid = screen.getByRole('grid')
    expect(grid.getAttribute('aria-rowcount')).toBe('100000')
    expect(within(grid).getAllByRole('row')[0]!.getAttribute('aria-rowindex')).toBe('1')
  })

  it('shares one grid template between the heading and every row', () => {
    render(<Commits />)
    for (const row of within(screen.getByRole('grid')).getAllByRole('row').slice(0, 3)) {
      expect(row.className).toContain('grid-cols-[1fr_8rem]')
    }
    expect(within(screen.getByRole('grid')).getAllByRole('row')[0]!.className).toContain('sticky')
  })

  it('is one tab stop, and walks with the keyboard, the chosen row named and drawn', async () => {
    viewOf(24 * 11)
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<Commits onSelectedChange={onSelectedChange} />)
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('grid'))
    expect(named()).toBeNull()

    await user.keyboard('{ArrowDown}')
    expect(named()).toBe('Commit 0')
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}')
    expect(named()).toBe('Commit 1')
    // A page is a screenful less one row: eleven rows of room (jsdom
    // measures the heading at nothing), so ten.
    await user.keyboard('{PageDown}')
    expect(named()).toBe('Commit 11')
    await user.keyboard('{PageUp}')
    expect(named()).toBe('Commit 1')
    await user.keyboard('{End}')
    expect(named()).toBe('Commit 99999')
    expect(screen.getByRole('grid').scrollTop).toBeGreaterThan(99_000 * 24)
    await user.keyboard('{Home}')
    expect(named()).toBe('Commit 0')
    expect(screen.getByRole('grid').scrollTop).toBe(0)
    expect(onSelectedChange).toHaveBeenLastCalledWith(0)
  })

  it('does not walk off either end', async () => {
    const user = userEvent.setup()
    render(<Commits count={3} />)
    await user.tab()
    await user.keyboard('{ArrowUp}')
    expect(named()).toBe('Commit 0')
    await user.keyboard('{ArrowUp}{End}{ArrowDown}{PageDown}')
    expect(named()).toBe('Commit 2')
  })

  it('marks the chosen row selected, and the rest not', () => {
    render(<Commits selected={2} />)
    const rows = within(screen.getByRole('grid')).getAllByRole('row').slice(1)
    expect(rows[2]!.getAttribute('aria-selected')).toBe('true')
    expect(rows[2]!.className).toContain('bg-accent-soft')
    expect(rows[1]!.getAttribute('aria-selected')).toBe('false')
  })

  it('follows a chosen row it is given, and keeps none when the count shrinks under it', () => {
    const { rerender } = render(<Commits selected={5} />)
    expect(named()).toBe('Commit 5')
    rerender(<Commits selected={5} count={3} />)
    expect(named()).toBeNull()
    expect(within(screen.getByRole('grid')).queryAllByRole('row', { selected: true })).toHaveLength(0)
  })

  it('chooses a row by click and keeps the keyboard in the grid', async () => {
    const user = userEvent.setup()
    function Host() {
      const [selected, setSelected] = useState<number | null>(null)
      return <Commits selected={selected} onSelectedChange={setSelected} />
    }
    render(<Host />)
    await user.click(screen.getByText('Commit 3'))
    expect(named()).toBe('Commit 3')
    expect(document.activeElement).toBe(screen.getByRole('grid'))
    await user.keyboard('{ArrowDown}')
    expect(named()).toBe('Commit 4')
  })

  it('opens the chosen row with Enter, and any row with a double click', async () => {
    const user = userEvent.setup()
    const onActivate = vi.fn()
    render(<Commits onActivate={onActivate} />)
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onActivate).not.toHaveBeenCalled()
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onActivate).toHaveBeenLastCalledWith(1)
    await user.dblClick(screen.getByText('Commit 4'))
    expect(onActivate).toHaveBeenLastCalledWith(4)
  })

  it('draws a row not read yet empty, at its height, and says it is coming', () => {
    render(<Commits loaded={(index) => index % 2 === 0} />)
    const rows = within(screen.getByRole('grid')).getAllByRole('row').slice(1)
    expect(rows[1]!.getAttribute('aria-busy')).toBe('true')
    expect(rows[1]!.textContent).toBe('')
    expect(rows[1]!.style.height).toBe('24px')
    expect(within(rows[1]!).getAllByRole('gridcell')).toHaveLength(1)
    expect(rows[0]!.hasAttribute('aria-busy')).toBe(false)
  })

  it('says which rows are drawn when that changes, and only then', async () => {
    viewOf(24 * 11)
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    const { rerender } = render(<Commits onRangeChange={(start, end) => onRangeChange(start, end)} />)
    // Once before the box is measured, once after.
    const [start, end] = onRangeChange.mock.lastCall!
    expect(start).toBe(0)
    expect(end).toBeGreaterThan(10)
    const calls = onRangeChange.mock.calls.length
    // A new callback on every render is not a new window.
    rerender(<Commits onRangeChange={(from, to) => onRangeChange(from, to)} />)
    rerender(<Commits onRangeChange={(from, to) => onRangeChange(from, to)} />)
    expect(onRangeChange).toHaveBeenCalledTimes(calls)
    await user.tab()
    await user.keyboard('{End}')
    expect(onRangeChange.mock.lastCall![1]).toBe(100_000)
  })

  it('lays the layer over exactly the rows drawn, hidden from readers', () => {
    const layer = vi.fn(() => <canvas />)
    render(<Commits layer={layer} />)
    const call = (layer.mock.lastCall as unknown as [{ start: number; end: number; rowHeight: number }])[0]
    expect(call.start).toBe(0)
    expect(call.rowHeight).toBe(24)
    const holder = document.querySelector('canvas')!.parentElement!
    expect(holder.getAttribute('aria-hidden')).toBe('true')
    expect(holder.style.height).toBe(`${(call.end - call.start) * 24}px`)
    expect(holder.style.top).toBe('0px')
    expect(holder.className).toContain('pointer-events-none')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Commits selected={1} />)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe, with a heading, a chosen row and a row not read yet', async () => {
    await expectNoA11yViolations(<Commits count={20} selected={1} loaded={(index) => index !== 3} />)
  })
})

describe('VirtualGrid, at its edges', () => {
  afterEach(() => {
    Object.defineProperty(Element.prototype, 'clientHeight', box)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('chooses nothing for a row that is not there', () => {
    const { rerender } = render(<Commits count={3} selected={-1} />)
    expect(named()).toBeNull()
    rerender(<Commits count={3} selected={3} />)
    expect(named()).toBeNull()
    rerender(<Commits count={3} selected={2} />)
    expect(named()).toBe('Commit 2')
  })

  it('tells nothing when there is nothing to walk', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    render(<Commits count={0} onSelectedChange={onSelectedChange} />)
    await user.tab()
    await user.keyboard('{ArrowDown}{End}')
    expect(onSelectedChange).not.toHaveBeenCalled()
  })

  it('keeps the page still for the keys it answers, and opens nothing on a key it does not', () => {
    const onActivate = vi.fn()
    render(<Commits selected={1} onActivate={onActivate} />)
    const grid = screen.getByRole('grid')
    expect(fireEvent.keyDown(grid, { key: 'ArrowDown' })).toBe(false)
    expect(fireEvent.keyDown(grid, { key: 'Enter' })).toBe(false)
    expect(onActivate).toHaveBeenCalledWith(1)
    onActivate.mockClear()
    expect(fireEvent.keyDown(grid, { key: 'a' })).toBe(true)
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('brings a row chosen from outside into view', () => {
    viewOf(24 * 11)
    const { rerender } = render(<Commits selected={5000} />)
    expect(named()).toBe('Commit 5000')
    rerender(<Commits selected={42} />)
    expect(named()).toBe('Commit 42')
  })

  it('leaves the heading its room, measured, and scrolls a far row a third of the way down what is left', async () => {
    viewOf(24 * 11)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('aria-rowindex') === '1' ? 24 : 0
    })
    let resized: (() => void) | undefined
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resized = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    const user = userEvent.setup()
    render(<Commits overscan={0} />)
    act(() => resized!())
    // Ten rows under a heading of one, and the one the edge cuts.
    expect(within(screen.getByRole('grid')).getAllByRole('row')).toHaveLength(1 + 11)
    await user.tab()
    await user.keyboard('{End}')
    expect(screen.getByRole('grid').scrollTop).toBe(99_999 * 24 - Math.floor(240 / 3))
  })

  it('follows a scroll the reader makes, and lays the layer over the rows it moved to', () => {
    viewOf(24 * 11)
    const layer = vi.fn(() => <canvas />)
    render(<Commits overscan={0} layer={layer} />)
    const grid = screen.getByRole('grid')
    grid.scrollTop = 24 * 500
    fireEvent.scroll(grid)
    const rows = within(grid).getAllByRole('row')
    expect(within(rows[1]!).getAllByRole('gridcell')[0]!.textContent).toBe('Commit 500')
    const view = (layer.mock.lastCall as unknown as [{ start: number; end: number }])[0]
    expect(view.start).toBe(500)
    const holder = document.querySelector('canvas')!.parentElement!
    expect(holder.style.top).toBe(`${500 * 24}px`)
    expect(holder.style.height).toBe(`${(view.end - view.start) * 24}px`)
  })

  it('keeps a row its element when rows are put in before it, given keys', () => {
    function Keyed({ ids }: { ids: string[] }) {
      return (
        <VirtualGrid
          label="Commits"
          count={ids.length}
          rowHeight={24}
          columns="grid-cols-1"
          rowKey={(index) => ids[index]!}
          renderRow={(index) => <VirtualGridCell>{ids[index]}</VirtualGridCell>}
        />
      )
    }
    const { rerender } = render(<Keyed ids={['b', 'c', 'd']} />)
    const before = screen.getByText('c').closest('[role="row"]')
    rerender(<Keyed ids={['a', 'b', 'c', 'd']} />)
    expect(screen.getByText('c').closest('[role="row"]')).toBe(before)
  })

  it('stands its heading on the rows template, above what scrolls', () => {
    render(<Commits />)
    const heading = within(screen.getByRole('grid')).getAllByRole('row')[0]!
    expect(heading.className.split(/\s+/)).toEqual(
      expect.arrayContaining(['sticky', 'top-0', 'grid', 'bg-raise', '[z-index:var(--z-sticky)]', 'grid-cols-[1fr_8rem]']),
    )
  })
})
