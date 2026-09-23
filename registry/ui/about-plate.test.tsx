// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { AboutPlate } from './about-plate'

/*
 * AboutPlate.
 *
 * The point is sameness across the line, so the checks are about the parts
 * every plate must have, at the level every plate must draw them.
 */

const plate = (extra: Partial<Parameters<typeof AboutPlate>[0]> = {}) => (
  <AboutPlate
    product="nitid"
    name="nitid"
    version="v0.34.0"
    tagline="A fast image viewer with honest colour."
    lineLabel="Part of the lacodda line"
    {...extra}
  />
)

describe('AboutPlate', () => {
  it('names the product as a heading, with its version', () => {
    render(plate())
    expect(screen.getByRole('heading', { name: 'nitid' })).toBeDefined()
    expect(screen.getByText('v0.34.0').className).toContain('font-mono')
  })

  it('draws the mark with its metaphor', () => {
    // The About screen is where a person has time to see the full mark; a
    // plate that drew the small tile would be the size bug this exists to end.
    const { container } = render(plate())
    const marks = [...container.querySelectorAll('svg[data-mark]')]
    expect(marks.map((node) => [node.getAttribute('data-mark'), node.getAttribute('data-level')])).toEqual([
      ['nitid', 'L'],
      ['lacodda', 'S'],
    ])
  })

  it('says it belongs to the line, in the words it is given', () => {
    render(plate())
    expect(screen.getByText('Part of the lacodda line')).toBeDefined()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('makes those words a link when there is somewhere to go', () => {
    render(plate({ lineHref: 'https://example.com/line' }))
    expect(screen.getByRole('link', { name: 'Part of the lacodda line' }).getAttribute('href')).toBe(
      'https://example.com/line',
    )
  })

  it('keeps what the product adds', () => {
    render(plate({ children: <span>MIT licence</span> }))
    expect(screen.getByText('MIT licence')).toBeDefined()
  })

  it('passes the accessibility gate', async () => {
    await expectNoA11yViolations(plate({ lineHref: 'https://example.com/line' }))
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(plate({ className: 'gap-6' }))
    expect(container.firstElementChild?.className).toContain('gap-6')
    expect(container.firstElementChild?.className).not.toContain('gap-3')
  })
})
