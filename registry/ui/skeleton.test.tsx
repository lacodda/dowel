// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Skeleton, SkeletonGrid, SkeletonList, SkeletonText } from './skeleton'

/*
 * Skeleton.
 *
 * `<Skeleton />` on its own is four lines and hardly worth a test. What is
 * worth testing is the part a product gets wrong: that the shapes are shapes,
 * that they are silent to a screen reader, and that a count of zero does not
 * render an empty box pretending to be content.
 */

describe('what it says to a screen reader', () => {
  it('says nothing at all', () => {
    // The loading fact belongs to the region - `QueryState` says it once with
    // `aria-busy`. A dozen empty boxes announced as content is noise on top of
    // something the reader already knows.
    const { container } = render(
      <div>
        <Skeleton className="h-4 w-20" />
        <SkeletonText />
        <SkeletonList />
        <SkeletonGrid />
      </div>,
    )
    const hidden = container.querySelectorAll('[aria-hidden="true"]')
    // Every top-level shape, and the single block.
    expect(hidden.length).toBeGreaterThanOrEqual(4)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(
      <div>
        <SkeletonText lines={4} />
        <SkeletonList rows={3} />
        <SkeletonGrid cells={6} columns={3} />
      </div>,
    )
  })
})

describe('the shapes', () => {
  it('draws the number of lines asked for', () => {
    // Counted by the class the block carries, not by `div > div`: the testing
    // library's own wrapper is a div too, and the selector quietly counts it.
    const { container } = render(<SkeletonText lines={4} />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
  })

  it('varies the widths, so it reads as text rather than as a loading bar', () => {
    // A stack of equal bars is an indicator; ragged ones are a paragraph.
    const { container } = render(<SkeletonText lines={4} />)
    const widths = [...container.querySelectorAll('.animate-pulse')].map((node) =>
      [...node.classList].find((name) => name.startsWith('w-')),
    )
    expect(new Set(widths).size).toBeGreaterThan(1)
  })

  it('ends a paragraph on a short line, the way a paragraph ends', () => {
    const { container } = render(<SkeletonText lines={3} />)
    const last = [...container.querySelectorAll('.animate-pulse')].at(-1)
    expect(last?.className).toContain('w-1/2')
  })

  it('varies the row widths of a list too, for the same reason', () => {
    // The property is the same as for a paragraph, and it was only asserted
    // there: a mutation that gave every row of `SkeletonList` one width stayed
    // green. A rule that holds in two places has to be checked in two places.
    const { container } = render(<SkeletonList rows={4} secondary={false} />)
    const widths = [...container.querySelectorAll('.animate-pulse')].map((node) =>
      [...node.classList].find((name) => name.startsWith('w-')),
    )
    expect(new Set(widths).size).toBeGreaterThan(1)
  })

  it('draws the rows of a list, with a second line when asked', () => {
    const withSecond = render(<SkeletonList rows={3} />)
    expect(withSecond.container.querySelectorAll('.animate-pulse')).toHaveLength(6)
    withSecond.unmount()

    const without = render(<SkeletonList rows={3} secondary={false} />)
    expect(without.container.querySelectorAll('.animate-pulse')).toHaveLength(3)
  })

  it('keeps a row the same width between renders', () => {
    // A placeholder whose widths are random flickers whenever anything above
    // it re-renders, which is exactly when a placeholder is on screen.
    const first = render(<SkeletonList rows={4} />)
    const before = [...first.container.querySelectorAll('.animate-pulse')].map((n) => n.className)
    first.unmount()

    const second = render(<SkeletonList rows={4} />)
    const after = [...second.container.querySelectorAll('.animate-pulse')].map((n) => n.className)
    expect(after).toEqual(before)
  })

  it('lays a grid out in the number of columns asked for', () => {
    // A style rather than a class, because Tailwind cannot generate
    // `grid-cols-${n}` for a value it never sees.
    const { container } = render(<SkeletonGrid cells={9} columns={3} />)
    const grid = container.firstElementChild as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(9)
  })

  it('lets a cell be shaped by the caller', () => {
    const { container } = render(<SkeletonGrid cells={2} cellClassName="aspect-video" />)
    expect(container.querySelector('.animate-pulse')?.className).toContain('aspect-video')
  })
})

describe('the counts nobody passes on purpose', () => {
  it('draws one row rather than none', () => {
    // `rows={works.length}` before anything arrived is zero, and an empty box
    // where a placeholder should be is the jump the component exists to
    // prevent.
    const { container } = render(<SkeletonList rows={0} />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('survives a negative count', () => {
    const { container } = render(<SkeletonText lines={-3} />)
    expect(container.querySelectorAll('.animate-pulse').length).toBe(1)
  })

  it('survives a grid of zero columns', () => {
    // `repeat(0, …)` is invalid and collapses the grid to one column of
    // nothing.
    const { container } = render(<SkeletonGrid cells={4} columns={0} />)
    const grid = container.firstElementChild as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))')
  })
})

describe('the rest', () => {
  it('lets the caller win a conflict', () => {
    const { container } = render(<Skeleton className="rounded-full" />)
    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('rounded-full')
    expect(className).not.toContain('rounded-md')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<SkeletonList />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})
