// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Pagination, pageCount, pageRange, pageWindow } from './pagination'

/*
 * Pagination.
 *
 * The arithmetic is tested on its own, because it is what a product paging on
 * the server imports; the component is tested for the three things a row of
 * page buttons gets wrong - the gap that pretends to be a page, the current
 * page announced only by colour, and a row whose width changes as you use it.
 */

const labels = {
  region: 'Pages',
  previous: 'Previous page',
  next: 'Next page',
  page: (page: number) => `Page ${page}`,
}

describe('how many pages there are', () => {
  it('rounds a partial page up', () => {
    expect(pageCount(97, 20)).toBe(5)
    expect(pageCount(100, 20)).toBe(5)
    expect(pageCount(101, 20)).toBe(6)
  })

  it('says one page when there is nothing to show', () => {
    // Not zero. "Page 1 of 0" reads as broken, and every caller would have to
    // clamp it back to one anyway.
    expect(pageCount(0, 20)).toBe(1)
  })

  it('survives a page size of nothing', () => {
    // A `pageSize` of 0 divides to Infinity and draws Infinity buttons.
    expect(pageCount(50, 0)).toBe(1)
  })
})

describe('which rows a page holds', () => {
  it('counts from one, the way the sentence does', () => {
    expect(pageRange(1, 20, 97)).toEqual([1, 20])
    expect(pageRange(2, 20, 97)).toEqual([21, 40])
  })

  it('clamps the last page to what it actually holds', () => {
    // "81-100 of 97" is the defect this prevents.
    expect(pageRange(5, 20, 97)).toEqual([81, 97])
  })

  it('says nothing at all when there is nothing', () => {
    expect(pageRange(1, 20, 0)).toEqual([0, 0])
  })
})

describe('the row of pages', () => {
  it('draws every page when they all fit', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('leaves a gap for the rest', () => {
    expect(pageWindow(10, 40)).toEqual([1, 'gap', 9, 10, 11, 'gap', 40])
  })

  it('keeps a steady width wherever the reader is', () => {
    // The property that matters, and the one a naive window loses: near an end
    // the neighbourhood is pushed inward instead of being clipped, so the row
    // does not shrink and the next button does not move under the pointer.
    const widths = [1, 2, 3, 10, 20, 38, 39, 40].map((page) => pageWindow(page, 40).length)
    expect(new Set(widths).size).toBe(1)
  })

  it('never puts a gap next to the page it hides', () => {
    // A gap standing for a single page is a lie that costs a click: `1 … 3`
    // hides only page 2, which the row had room for.
    for (let page = 1; page <= 40; page += 1) {
      const steps = pageWindow(page, 40)
      steps.forEach((step, index) => {
        if (step !== 'gap') return
        const before = steps[index - 1]
        const after = steps[index + 1]
        expect(typeof before === 'number' && typeof after === 'number' && after - before).not.toBe(2)
      })
    }
  })

  it('never drops a page without leaving a gap where it was', () => {
    // The defect the first fix for the lying gap introduced: rather than draw
    // `1 … 3` for a single hidden page, it left the page out - and the row
    // then said 1 is followed by 3 with no sign that anything was missing,
    // which is worse than the gap it was avoiding.
    for (let page = 1; page <= 40; page += 1) {
      const steps = pageWindow(page, 40)
      steps.forEach((step, index) => {
        const before = steps[index - 1]
        if (typeof step !== 'number' || typeof before !== 'number') return
        expect(step - before, `page ${page}: ${JSON.stringify(steps)}`).toBe(1)
      })
    }
  })

  it('clamps a page outside the range instead of drawing a hole', () => {
    expect(pageWindow(0, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageWindow(99, 5)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('the control', () => {
  it('announces which page is current rather than only colouring it', async () => {
    render(<Pagination page={3} pageSize={10} total={100} onPageChange={vi.fn()} labels={labels} />)
    expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Page 2' }).hasAttribute('aria-current')).toBe(false)
  })

  it('does not make the gap something a keyboard stops on', () => {
    // Drawn as a disabled button it would give a keyboard three stops that
    // lead nowhere; hidden from the reader it would announce a jump from 2 to
    // 40 with no reason for it.
    render(<Pagination page={10} pageSize={10} total={400} onPageChange={vi.fn()} labels={labels} />)
    const buttons = screen.getAllByRole('button').map((button) => button.textContent)
    expect(buttons).not.toContain('…')
    expect(screen.getAllByText('…').length).toBe(2)
  })

  it('goes to the page that was clicked', async () => {
    const onPageChange = vi.fn()
    render(
      <Pagination page={1} pageSize={10} total={100} onPageChange={onPageChange} labels={labels} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('will not step off either end', () => {
    const first = render(
      <Pagination page={1} pageSize={10} total={100} onPageChange={vi.fn()} labels={labels} />,
    )
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveProperty('disabled', false)
    first.unmount()

    render(<Pagination page={10} pageSize={10} total={100} onPageChange={vi.fn()} labels={labels} />)
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveProperty('disabled', true)
  })

  it('clamps a page outside the range rather than showing none as current', () => {
    render(<Pagination page={99} pageSize={10} total={100} onPageChange={vi.fn()} labels={labels} />)
    expect(screen.getByRole('button', { name: 'Page 10' }).getAttribute('aria-current')).toBe('page')
  })

  it('names the region, so it is not an unlabelled navigation', () => {
    render(<Pagination page={1} pageSize={10} total={100} onPageChange={vi.fn()} labels={labels} />)
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeDefined()
  })

  it('passes axe with a gap in the row', async () => {
    await expectNoA11yViolations(
      <Pagination page={10} pageSize={10} total={400} onPageChange={vi.fn()} labels={labels} />,
    )
  })
})
