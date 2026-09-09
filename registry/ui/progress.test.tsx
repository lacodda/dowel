// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Progress } from './progress'

/*
 * Progress.
 *
 * The distinction the component is built on is the whole test: a bar that
 * claims a fraction it does not know is a lie the reader learns to distrust,
 * after which no progress bar in the product means anything.
 */

const bar = () => screen.getByRole('progressbar')

describe('when the fraction is known', () => {
  it('announces it', () => {
    render(<Progress value={40} label="Uploading" />)
    expect(bar().getAttribute('aria-valuenow')).toBe('40')
    expect(bar().getAttribute('aria-valuemax')).toBe('100')
  })

  it('counts against the maximum it was given', () => {
    render(<Progress value={3} max={12} label="Uploading" />)
    expect(bar().getAttribute('aria-valuenow')).toBe('3')
    expect(bar().getAttribute('aria-valuemax')).toBe('12')
  })

  it('shows the percentage beside a visible label', () => {
    render(
      <Progress value={3} max={12} label="Uploading">
        Uploading
      </Progress>,
    )
    expect(screen.getByText('25%')).toBeDefined()
  })
})

describe('when it is not known', () => {
  it('says so rather than picking a number', () => {
    // The commonest version of this component creeps to 90% and waits there.
    render(<Progress label="Working" />)
    expect(bar().hasAttribute('aria-valuenow')).toBe(false)
  })

  it('treats null the same as nothing', () => {
    // What a product hands over when its own state is "unknown".
    render(<Progress value={null} label="Working" />)
    expect(bar().hasAttribute('aria-valuenow')).toBe(false)
  })

  it('shows no percentage next to the label', () => {
    // "0%" for an unknown amount is the same lie as the bar that creeps.
    render(<Progress label="Working">Working</Progress>)
    expect(screen.getByText('Working')).toBeDefined()
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('draws stripes, which cannot be read as a fraction at all', () => {
    /* The first version filled the whole track and pulsed. Measured on the
     * stand it drew 384px of a 384px track - a reader glancing at it sees
     * "done", the opposite of what the state means, and under
     * `prefers-reduced-motion` the pulse stops and only the full bar is left.
     *
     * Stripes have no edge to mistake for a boundary. */
    const { container } = render(<Progress label="Working" />)
    const striped = container.querySelector('[style*="repeating-linear-gradient"]')
    expect(striped).not.toBeNull()
    expect(striped?.className).not.toContain('bg-accent')
  })

  it('draws a plain fill when the fraction is known', () => {
    const { container } = render(<Progress value={40} label="Uploading" />)
    expect(container.querySelector('[style*="repeating-linear-gradient"]')).toBeNull()
  })
})

describe('the rest', () => {
  it('is named, because a bar with no name is a percentage of nothing', () => {
    render(<Progress value={40} label="Uploading the file" />)
    expect(screen.getByRole('progressbar', { name: 'Uploading the file' })).toBeDefined()
  })

  it('carries the tone through to the fill', () => {
    const { container } = render(<Progress value={40} tone="warn" label="a" />)
    expect(container.innerHTML).toContain('bg-warn')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Progress value={40} tone="bad" label="a" />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe both ways', async () => {
    const known = await expectNoA11yViolations(<Progress value={40} label="Uploading" />)
    known.unmount()
    await expectNoA11yViolations(<Progress label="Working" />)
  })
})
