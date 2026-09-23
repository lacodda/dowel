// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { LineMark, ProductMark } from './product-mark'

/*
 * ProductMark.
 *
 * The level is the component's whole judgement, so the sizes on either side of
 * each boundary are the first thing checked. The second is the one defect a
 * mark drawn from markup can have and a picture cannot: two marks sharing a
 * gradient because SVG ids are global.
 */

const mark = (container: HTMLElement) => container.querySelector('svg')!

describe('ProductMark', () => {
  it('draws the level its size calls for', () => {
    const levels = [16, 27, 28, 63, 64, 128].map((size) => {
      const { container, unmount } = render(<ProductMark product="kasl" size={size} />)
      const level = mark(container).getAttribute('data-level')
      unmount()
      return level
    })
    expect(levels).toEqual(['S', 'S', 'M', 'M', 'L', 'L'])
  })

  it('draws the master, not a lookalike', () => {
    // S is the tile filled with the product's colour and the code on it.
    const { container } = render(<ProductMark product="kasl" size={16} />)
    expect(mark(container).innerHTML).toContain('#A9C23F')
    expect(mark(container).textContent).toBe('ka')
  })

  it('is square at the size it is asked for', () => {
    const { container } = render(<ProductMark product="nitid" size={40} />)
    expect(mark(container).getAttribute('width')).toBe('40')
    expect(mark(container).getAttribute('height')).toBe('40')
  })

  it('gives each two-colour mark a gradient of its own', () => {
    // scheda's pair is a gradient. With the master's own id, the second mark
    // on a screen would paint with the first one's.
    const { container } = render(
      <>
        <ProductMark product="scheda" size={24} />
        <ProductMark product="furca" size={24} />
      </>,
    )
    const ids = [...container.querySelectorAll('linearGradient')].map((node) => node.id)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    for (const svg of container.querySelectorAll('svg')) {
      const own = svg.querySelector('linearGradient')!.id
      expect(svg.innerHTML).toContain(`url(#${own})`)
      expect(svg.innerHTML).not.toContain('{{id}}')
    }
  })

  it('stays out of the reading beside a name', () => {
    const { container } = render(<ProductMark product="kilna" />)
    expect(mark(container).getAttribute('aria-hidden')).toBe('true')
  })

  it('is an image with a name when it stands alone', () => {
    render(<ProductMark product="kilna" label="kilna" />)
    expect(screen.getByRole('img', { name: 'kilna' })).toBeDefined()
  })

  it('passes the accessibility gate, both ways', async () => {
    await expectNoA11yViolations(<ProductMark product="dowel" />)
    await expectNoA11yViolations(<ProductMark product="dowel" size={96} label="dowel" />)
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(<ProductMark product="dowel" className="shrink" />)
    expect(mark(container).getAttribute('class')).toContain('shrink')
    expect(mark(container).getAttribute('class')).not.toContain('shrink-0')
  })
})

describe('LineMark', () => {
  it('is the line itself', () => {
    const { container } = render(<LineMark size={32} />)
    expect(mark(container).getAttribute('data-mark')).toBe('lacodda')
    expect(mark(container).textContent).toBe('λ')
  })
})
