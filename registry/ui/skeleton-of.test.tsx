// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SkeletonOf, measureShape, type MeasuredShape } from './skeleton-of'
import { expectNoA11yViolations } from '../../tests/a11y'

/*
 * jsdom lays nothing out: every `getBoundingClientRect` is zero, which is the
 * one measurement this component refuses to remember. So the heights are
 * staged - the same trick the virtual list's tests use - and the assertions
 * are about what the component does with a measurement, which is the part that
 * can be wrong.
 */
function stageHeights(heights: { block: number; rows?: number[] }) {
  const original = Element.prototype.getBoundingClientRect
  const rowHeights = heights.rows ?? []
  let row = 0

  Element.prototype.getBoundingClientRect = function rect(this: Element) {
    if (this.hasAttribute('data-row')) {
      const height = rowHeights[row % Math.max(1, rowHeights.length)] ?? 0
      row += 1
      return { height, width: 100, top: 0, left: 0, right: 100, bottom: height, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
    }
    return { height: heights.block, width: 100, top: 0, left: 0, right: 100, bottom: heights.block, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
  }

  return () => {
    Element.prototype.getBoundingClientRect = original
    row = 0
  }
}

let restore: (() => void) | undefined
afterEach(() => {
  restore?.()
  restore = undefined
})

function List({ rows = 3 }: { rows?: number }) {
  return (
    <ul>
      {Array.from({ length: rows }, (_, row) => (
        <li key={row} data-row>
          Row {row + 1}
        </li>
      ))}
    </ul>
  )
}

describe('measureShape', () => {
  it('measures the block and the rows inside it', () => {
    restore = stageHeights({ block: 120, rows: [40, 40, 40] })
    const { container } = render(<List />)
    const shape = measureShape(container.firstElementChild as HTMLElement, '[data-row]')
    expect(shape.height).toBe(120)
    expect(shape.rows).toEqual([40, 40, 40])
  })

  it('finds rows that are not direct children', () => {
    // A table's rows live inside a `<tbody>`, a list's inside a `<ul>` that may
    // itself be inside a scroller. Walking children would find none of them.
    restore = stageHeights({ block: 90, rows: [30, 30, 30] })
    const { container } = render(
      <div>
        <div>
          <List />
        </div>
      </div>,
    )
    expect(measureShape(container.firstElementChild as HTMLElement, '[data-row]').rows).toHaveLength(3)
  })

  it('reports no rows when nothing matches', () => {
    restore = stageHeights({ block: 60 })
    const { container } = render(<p>Just a paragraph</p>)
    expect(measureShape(container.firstElementChild as HTMLElement, '[data-row]').rows).toEqual([])
  })
})

describe('SkeletonOf', () => {
  it('shows the content while it is not pending', () => {
    restore = stageHeights({ block: 120, rows: [40, 40, 40] })
    render(
      <SkeletonOf pending={false} rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )
    expect(screen.getByText('Row 1')).toBeDefined()
  })

  it('draws back the shape it measured, row for row', () => {
    // The whole promise: the placeholder is the shape the content had, not a
    // shape somebody typed in months ago.
    restore = stageHeights({ block: 132, rows: [44, 44, 44] })
    const { container, rerender } = render(
      <SkeletonOf pending={false} rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )

    rerender(
      <SkeletonOf pending rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )

    expect(screen.queryByText('Row 1')).toBeNull()
    const boxes = [...container.querySelectorAll('.bg-soft')] as HTMLElement[]
    expect(boxes).toHaveLength(3)
    expect(boxes.map((box) => box.style.height)).toEqual(['44px', '44px', '44px'])
  })

  it('follows the shape when the content changes', () => {
    // A list that gains rows changes the shape, and a placeholder built from
    // the first measurement would be wrong in exactly the way this component
    // exists to prevent.
    restore = stageHeights({ block: 132, rows: [44, 44, 44] })
    const { container, rerender } = render(
      <SkeletonOf pending={false} rowSelector="[data-row]">
        <List rows={3} />
      </SkeletonOf>,
    )

    restore()
    restore = stageHeights({ block: 264, rows: [44, 44, 44, 44, 44, 44] })
    rerender(
      <SkeletonOf pending={false} rowSelector="[data-row]">
        <List rows={6} />
      </SkeletonOf>,
    )
    rerender(
      <SkeletonOf pending rowSelector="[data-row]">
        <List rows={6} />
      </SkeletonOf>,
    )

    expect(container.querySelectorAll('.bg-soft')).toHaveLength(6)
  })

  it('draws one box the height of the block when there are no rows', () => {
    restore = stageHeights({ block: 200 })
    const { container, rerender } = render(
      <SkeletonOf pending={false}>
        <p>A card, with no repeating part</p>
      </SkeletonOf>,
    )
    rerender(
      <SkeletonOf pending>
        <p>A card, with no repeating part</p>
      </SkeletonOf>,
    )

    const heights = [...container.querySelectorAll('.bg-soft')].map(
      (box) => (box as HTMLElement).style.height,
    )
    expect(heights).toEqual(['200px'])
  })

  it('shows the fallback on a first load, with nothing to remember', () => {
    restore = stageHeights({ block: 120, rows: [40] })
    render(
      <SkeletonOf pending rowSelector="[data-row]" fallback={<div data-testid="first" />}>
        <List />
      </SkeletonOf>,
    )
    expect(screen.getByTestId('first')).toBeDefined()
  })

  it('says nothing rather than inventing a shape', () => {
    // No measurement and no fallback: a shape made up on the spot is the
    // defect, and silence is the honest answer.
    const { container } = render(
      <SkeletonOf pending rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )
    expect(container.innerHTML).toBe('')
  })

  it('takes a shape measured in an earlier session', () => {
    // A product that stores the measurement can be honest on a first load too.
    const stored: MeasuredShape = { height: 90, rows: [30, 30, 30] }
    const { container } = render(
      <SkeletonOf pending rowSelector="[data-row]" shape={stored}>
        <List />
      </SkeletonOf>,
    )
    expect(container.querySelectorAll('.bg-soft')).toHaveLength(3)
  })

  it('does not remember a block that has not been laid out', () => {
    // A hidden tab measures zero. Remembering it would draw nothing and claim
    // that was the shape.
    restore = stageHeights({ block: 0, rows: [0, 0] })
    const { container, rerender } = render(
      <SkeletonOf pending={false} rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )
    rerender(
      <SkeletonOf pending rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )
    expect(container.innerHTML).toBe('')
  })

  it('does not forget the shape over repeated loads', () => {
    // The loop this has to stay out of: measure the placeholder, remember
    // *that*, draw it next time, measure it again. Each load would remember a
    // little less of what the content actually looked like, and the decay is
    // invisible until the placeholder is a single thin bar.
    //
    // Staged so that anything measured during a pending pass is plainly wrong:
    // the placeholder carries no `data-row` nodes and would be recorded as one
    // short box.
    restore = stageHeights({ block: 132, rows: [44, 44, 44] })
    const { container, rerender } = render(
      <SkeletonOf pending={false} rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )

    restore()
    restore = stageHeights({ block: 7 })

    // Three loads in a row, with nothing real in between to refresh the memory.
    for (let load = 0; load < 3; load += 1) {
      rerender(
        <SkeletonOf pending rowSelector="[data-row]">
          <List />
        </SkeletonOf>,
      )
      rerender(
        <SkeletonOf pending rowSelector="[data-row]">
          <List />
        </SkeletonOf>,
      )
    }

    const boxes = [...container.querySelectorAll('.bg-soft')] as HTMLElement[]
    expect(boxes).toHaveLength(3)
    expect(boxes.map((box) => box.style.height)).toEqual(['44px', '44px', '44px'])
  })

  it('keeps the placeholder out of the accessibility tree', () => {
    // The loading fact belongs to the region and is said once, by whatever
    // owns it. A dozen empty boxes announced as content is noise on top of it.
    restore = stageHeights({ block: 132, rows: [44, 44, 44] })
    const { container, rerender } = render(
      <SkeletonOf pending={false} rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )
    rerender(
      <SkeletonOf pending rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
  })

  it('survives a platform without ResizeObserver', () => {
    // The mount measurement is still taken; only later changes go unnoticed.
    const held = globalThis.ResizeObserver
    // @ts-expect-error - removing it is the point of the test
    delete globalThis.ResizeObserver
    try {
      restore = stageHeights({ block: 132, rows: [44, 44, 44] })
      const { container, rerender } = render(
        <SkeletonOf pending={false} rowSelector="[data-row]">
          <List />
        </SkeletonOf>,
      )
      rerender(
        <SkeletonOf pending rowSelector="[data-row]">
          <List />
        </SkeletonOf>,
      )
      expect(container.querySelectorAll('.bg-soft')).toHaveLength(3)
    } finally {
      globalThis.ResizeObserver = held
    }
  })

  it('watches for a resize when the platform has one', () => {
    const observe = vi.fn()
    const held = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      observe = observe
      unobserve = vi.fn()
      disconnect = vi.fn()
    } as unknown as typeof ResizeObserver

    try {
      restore = stageHeights({ block: 132, rows: [44, 44, 44] })
      render(
        <SkeletonOf pending={false} rowSelector="[data-row]">
          <List />
        </SkeletonOf>,
      )
      expect(observe).toHaveBeenCalled()
    } finally {
      globalThis.ResizeObserver = held
    }
  })

  it('carries no colour outside the vocabulary', () => {
    restore = stageHeights({ block: 132, rows: [44, 44, 44] })
    const { container, rerender } = render(
      <SkeletonOf pending={false} rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )
    rerender(
      <SkeletonOf pending rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )
    const className = [...container.querySelectorAll('*')]
      .map((node) => node.className)
      .filter((name): name is string => typeof name === 'string')
      .join(' ')
    expect(className).toContain('bg-soft')
    expect(className).not.toMatch(/\bdark:/)
    expect(className).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes the accessibility gate', async () => {
    restore = stageHeights({ block: 132, rows: [44, 44, 44] })
    await expectNoA11yViolations(
      <SkeletonOf pending={false} rowSelector="[data-row]">
        <List />
      </SkeletonOf>,
    )
    // And drawing the placeholder, which is the state the boxes exist in.
    await expectNoA11yViolations(
      <SkeletonOf pending rowSelector="[data-row]" shape={{ height: 132, rows: [44, 44, 44] }}>
        <List />
      </SkeletonOf>,
    )
  })
})
