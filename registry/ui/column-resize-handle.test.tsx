// @vitest-environment jsdom
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ColumnResizeHandle, measureColumns, useColumnWidths } from './column-resize-handle'

/*
 * What has to be true of a column's resize handle.
 *
 * The width reported is the cell's width plus the distance dragged, so the
 * defects are arithmetic: a handle that reports the distance alone, one that
 * lets a column go to nothing, one that never says the drag is over - so the
 * width is never persisted - and a double-click that flips the sort of the
 * header it sits in instead of resetting the column.
 */

beforeAll(() => {
  // jsdom has no pointer capture; the handle asks for it on every drag.
  Object.assign(Element.prototype, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => false),
  })
})

/** A header cell of a known width with the handle in it. */
function Cell(props: Partial<Parameters<typeof ColumnResizeHandle>[0]>) {
  return (
    <table>
      <thead>
        <tr>
          <th
            className="relative"
            ref={(cell) => {
              if (cell) cell.getBoundingClientRect = () => ({ width: 200 }) as DOMRect
            }}
          >
            Title
            <ColumnResizeHandle label="Resize the Title column" onResize={() => {}} onReset={() => {}} {...props} />
          </th>
        </tr>
      </thead>
    </table>
  )
}

const handle = () => screen.getByRole('separator', { name: 'Resize the Title column' })

describe('ColumnResizeHandle', () => {
  it('reports the cell width plus the distance dragged, then done on release', () => {
    const onResize = vi.fn()
    render(<Cell onResize={onResize} />)
    fireEvent.pointerDown(handle(), { button: 0, clientX: 100 })
    fireEvent.pointerMove(handle(), { clientX: 140 })
    expect(onResize).toHaveBeenLastCalledWith(240, false)
    fireEvent.pointerUp(handle(), { clientX: 150 })
    expect(onResize).toHaveBeenLastCalledWith(250, true)
    expect(onResize).toHaveBeenCalledTimes(2)
  })

  it('respects the minimum width', () => {
    const onResize = vi.fn()
    render(<Cell onResize={onResize} minWidth={80} />)
    fireEvent.pointerDown(handle(), { button: 0, clientX: 300 })
    fireEvent.pointerMove(handle(), { clientX: 10 })
    expect(onResize).toHaveBeenLastCalledWith(80, false)
  })

  it('resets on a double click', () => {
    const onReset = vi.fn()
    render(<Cell onReset={onReset} />)
    fireEvent.doubleClick(handle())
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('tells the caller the drag is about to start, before any width', () => {
    const calls: string[] = []
    render(<Cell onStart={() => calls.push('start')} onResize={() => calls.push('resize')} />)
    fireEvent.pointerDown(handle(), { button: 0, clientX: 0 })
    fireEvent.pointerMove(handle(), { clientX: 5 })
    expect(calls).toEqual(['start', 'resize'])
  })

  it('reports nothing for a move with no press', () => {
    const onResize = vi.fn()
    render(<Cell onResize={onResize} />)
    fireEvent.pointerMove(handle(), { clientX: 140 })
    expect(onResize).not.toHaveBeenCalled()
  })

  it('ignores any button but the primary one', () => {
    const onResize = vi.fn()
    render(<Cell onResize={onResize} />)
    fireEvent.pointerDown(handle(), { button: 2, clientX: 100 })
    fireEvent.pointerMove(handle(), { clientX: 140 })
    expect(onResize).not.toHaveBeenCalled()
  })

  it('keeps the click after a drag from reaching the header', () => {
    // On a sortable column that click would flip the sort every time a width
    // was set.
    const onHeaderClick = vi.fn()
    render(
      <table>
        <thead>
          <tr>
            <th className="relative" onClick={onHeaderClick}>
              <ColumnResizeHandle label="Resize the Title column" onResize={() => {}} onReset={() => {}} />
            </th>
          </tr>
        </thead>
      </table>,
    )
    fireEvent.click(handle())
    fireEvent.doubleClick(handle())
    expect(onHeaderClick).not.toHaveBeenCalled()
  })

  it('is a separator named for its column, not a tab stop', () => {
    render(<Cell />)
    expect(handle().getAttribute('aria-orientation')).toBe('vertical')
    expect(handle().tagName).toBe('SPAN')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Cell />)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(<Cell />)
    unmount()
  })
})

describe('useColumnWidths', () => {
  it('keeps a dragged width and persists it only when done', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useColumnWidths<'title' | 'owner'>({ initial: {}, onChange }))
    expect(result.current.sized).toBe(false)

    act(() => result.current.resize('title', 240))
    expect(result.current.widthOf('title')).toBe(240)
    expect(result.current.sized).toBe(true)
    expect(onChange).not.toHaveBeenCalled()

    act(() => result.current.resize('title', 250, true))
    expect(onChange).toHaveBeenCalledWith({ title: 250 })
  })

  it('answers a measured width for a column nobody dragged', () => {
    // Under fixed layout every column needs a width, or the browser shares
    // the free space equally - the date column as wide as the title.
    const { result } = renderHook(() => useColumnWidths<'title' | 'owner'>({ initial: {} }))
    act(() => result.current.measure([['title', 300.4], ['owner', 120]]))
    act(() => result.current.resize('title', 240))
    expect(result.current.widthOf('owner')).toBe(120)
    expect(result.current.isHandSized('owner')).toBe(false)
    expect(result.current.isHandSized('title')).toBe(true)
  })

  it('ignores a measurement taken after the layout went fixed', () => {
    const { result } = renderHook(() => useColumnWidths<'title' | 'owner'>({ initial: { title: 200 } }))
    act(() => result.current.measure([['owner', 120]]))
    expect(result.current.widthOf('owner')).toBeUndefined()
  })

  it('falls back for a column that was not there to measure', () => {
    const { result } = renderHook(() =>
      useColumnWidths<'title' | 'owner'>({ initial: { title: 200 }, fallback: () => 96 }),
    )
    expect(result.current.widthOf('owner')).toBe(96)
  })

  it('resets a column, and the layout with the last one', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useColumnWidths<'title' | 'owner'>({ initial: { title: 200 }, onChange }))
    act(() => result.current.reset('title'))
    expect(result.current.sized).toBe(false)
    expect(result.current.widthOf('title')).toBeUndefined()
    expect(onChange).toHaveBeenCalledWith({})
  })

  it('never keeps a width under the minimum', () => {
    const { result } = renderHook(() => useColumnWidths<'title'>({ initial: {}, minWidth: 64 }))
    act(() => result.current.resize('title', 10))
    expect(result.current.widthOf('title')).toBe(64)
  })
})

describe('measureColumns', () => {
  it('reads the cells that name a column and skips the rest', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <th>select</th>
            <th data-column="title">Title</th>
            <th data-column="owner">Owner</th>
          </tr>
        </thead>
      </table>,
    )
    const row = container.querySelector('tr')!
    let width = 100
    for (const cell of row.querySelectorAll('th')) {
      const own = width
      cell.getBoundingClientRect = () => ({ width: own }) as DOMRect
      width += 50
    }
    expect(measureColumns(row)).toEqual([
      ['title', 150],
      ['owner', 200],
    ])
  })
})
