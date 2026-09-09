// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { VirtualList, windowFor } from './virtual-list'

/*
 * VirtualList.
 *
 * Almost everything worth asserting is in `windowFor`, and that is why it is a
 * function rather than an effect: jsdom gives every element a height of zero
 * and never fires a scroll with a real offset, so a test of the component
 * alone would be asserting against a list that believes it is invisible - and
 * would pass whatever the arithmetic did.
 *
 * What the component is tested for is what jsdom can honestly say: the spacer
 * exists, a screenful is in the DOM rather than a hundred thousand rows, and
 * the row a reader lands on announces its true position in the list.
 */

const base = { count: 100_000, rowHeight: 20, viewportHeight: 400, scrollTop: 0 }

describe('which rows are drawn', () => {
  it('draws a screenful, not the list', () => {
    const { start, end } = windowFor(base)
    // 400px of 20px rows is 20 visible, plus one for the row cut by the edge,
    // plus overscan below. Whatever the exact number, it is nearer 20 than
    // 100,000 - that is the whole point of the component.
    expect(end - start).toBeLessThan(40)
    expect(end - start).toBeGreaterThan(20)
  })

  it('moves the window as the list is scrolled', () => {
    const { start, end } = windowFor({ ...base, scrollTop: 20_000 })
    // Row 1000 is at 20,000px.
    expect(start).toBeLessThanOrEqual(1000)
    expect(end).toBeGreaterThan(1000)
  })

  it('keeps the scrollbar honest about how much there is', () => {
    // The spacer is the only thing that tells the browser the list is long.
    expect(windowFor(base).totalHeight).toBe(2_000_000)
  })

  it('offsets the drawn rows to where they belong', () => {
    const { start, offsetTop } = windowFor({ ...base, scrollTop: 20_000 })
    expect(offsetTop).toBe(start * 20)
  })
})

describe('the edges, all of which show as a blank list rather than an error', () => {
  it('draws something before the box has been measured', () => {
    // The first frame: `clientHeight` is 0 until the effect runs. Drawing
    // nothing here is what makes a virtual list look broken on load - the box
    // stays empty until something scrolls it.
    //
    // `overscan: 0` on purpose. With the default overscan this passes whether
    // or not the floor exists, because the extra rows fill the window on their
    // own - the assertion would be about overscan rather than about the empty
    // first frame it claims to be about. Found by mutation: removing the floor
    // left the test green.
    const { start, end } = windowFor({ ...base, viewportHeight: 0, overscan: 0 })
    expect(end).toBeGreaterThan(start)
  })

  it('survives a scroll position past the end', () => {
    // The list shrank under the reader - a filter was applied while scrolled
    // to the bottom.
    const { start, end } = windowFor({ ...base, count: 10, scrollTop: 999_999 })
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeLessThanOrEqual(10)
    expect(end).toBeGreaterThan(start)
  })

  it('survives a negative scroll position', () => {
    // What a trackpad hands over at the top of an elastic scroll. Unclamped,
    // `Math.floor` walks the start index into rows that do not exist.
    const { start, offsetTop } = windowFor({ ...base, scrollTop: -120 })
    expect(start).toBe(0)
    expect(offsetTop).toBe(0)
  })

  it('says there is nothing rather than dividing by it', () => {
    expect(windowFor({ ...base, count: 0 })).toEqual({
      start: 0,
      end: 0,
      totalHeight: 0,
      offsetTop: 0,
    })
  })

  it('survives a row height of zero', () => {
    // A caller computing the height from a token that has not loaded yet.
    // Unguarded this divides by zero and the start index is Infinity.
    const { start, end } = windowFor({ ...base, count: 10, rowHeight: 0 })
    expect(Number.isFinite(start)).toBe(true)
    expect(Number.isFinite(end)).toBe(true)
  })

  it('draws past both edges, so a fast scroll does not paint blank', () => {
    // The scroll event arrives after the pixels; without overscan the reader
    // sees empty space where rows have not been drawn yet.
    const withOverscan = windowFor({ ...base, scrollTop: 20_000, overscan: 5 })
    const without = windowFor({ ...base, scrollTop: 20_000, overscan: 0 })
    expect(withOverscan.start).toBe(without.start - 5)
    expect(withOverscan.end).toBe(without.end + 5)
  })
})

describe('what the component puts in the document', () => {
  const rows = Array.from({ length: 100_000 }, (_, index) => ({ id: index, name: `Row ${index}` }))

  const Example = () => (
    <VirtualList
      rows={rows}
      rowHeight={20}
      rowKey={(row) => row.id}
      label="Rows"
      className="h-96"
    >
      {(row) => <span>{row.name}</span>}
    </VirtualList>
  )

  it('puts a screenful in the DOM, not the list', () => {
    render(<Example />)
    // The assertion the component exists for. A hundred thousand nodes is a
    // layout the machine recomputes on every change.
    expect(screen.getAllByRole('listitem').length).toBeLessThan(50)
  })

  it('tells a reader how long the list really is, and where a row sits in it', () => {
    // Counted from the rows in the DOM a reader would announce "3 of 20" in a
    // list of a hundred thousand - the rows on screen are a screenful, which
    // is exactly what the component hides.
    //
    // `aria-setsize`/`aria-posinset`, not `aria-rowcount`/`aria-rowindex`:
    // those were the obvious names and belong to `grid` and `table`. axe
    // rejected them here, and a reader would have ignored them silently -
    // markup that looks like it says something.
    render(<Example />)
    const first = screen.getAllByRole('listitem')[0]
    expect(first?.getAttribute('aria-setsize')).toBe('100000')
    expect(first?.getAttribute('aria-posinset')).toBe('1')
  })

  it('carries the spacer that makes the scrollbar honest', () => {
    const { container } = render(<Example />)
    const spacer = container.querySelector('[style*="height"]')
    expect(spacer?.getAttribute('style')).toContain('2000000px')
  })

  it('can be reached by a keyboard', () => {
    // A box that scrolls and holds nothing focusable is unreachable without a
    // pointer.
    render(<Example />)
    expect(screen.getByRole('list').getAttribute('tabindex')).toBe('0')
  })

  it('watches the viewport rather than measuring it once', () => {
    // A list inside a panel that opens, or a window the reader resizes, draws
    // the wrong number of rows until something scrolls it.
    const observe = vi.fn()
    const disconnect = vi.fn()
    const original = globalThis.ResizeObserver
    // A class, not `vi.fn(() => ({...}))`: the component calls
    // `new ResizeObserver(...)`, and an arrow function is not a constructor.
    // The stand-in has to behave like the thing it replaces.
    globalThis.ResizeObserver = class {
      observe = observe
      disconnect = disconnect
      unobserve = vi.fn()
    } as unknown as typeof ResizeObserver

    try {
      const { unmount } = render(<Example />)
      expect(observe).toHaveBeenCalled()
      unmount()
      expect(disconnect).toHaveBeenCalled()
    } finally {
      globalThis.ResizeObserver = original
    }
  })

  it('renders without a ResizeObserver at all', () => {
    // Older WebViews, and jsdom before the stub above. The list should be a
    // list, not a crash.
    const original = globalThis.ResizeObserver
    // @ts-expect-error - removing it is the point of the test
    delete globalThis.ResizeObserver
    try {
      render(<Example />)
      expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
    } finally {
      globalThis.ResizeObserver = original
    }
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(<Example />)
  })
})
