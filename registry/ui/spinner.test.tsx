// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Spinner, spinnerVariants } from './spinner'

describe('Spinner', () => {
  it('says that something is happening', () => {
    // A page that is busy has to be distinguishable from a page that is empty,
    // and a drawn spinner says nothing to a screen reader.
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeDefined()
  })

  it('takes the word for what is loading from the product', () => {
    render(<Spinner label="Loading versions" />)
    expect(screen.getByRole('status')).toHaveProperty('textContent', 'Loading versions')
  })

  it('draws every size, and draws each one differently', () => {
    const base = spinnerVariants({ size: 'nonexistent' as never })
    const sizes = ['sm', 'md', 'lg'] as const
    const drawn = new Map(sizes.map((size) => [size, spinnerVariants({ size })]))

    for (const [size, classes] of drawn) {
      expect(classes, `\`${size}\` adds nothing`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size).toBe(sizes.length)
  })

  it('keeps the ring open, or nothing appears to turn', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('[aria-hidden]')?.className).toContain('border-r-transparent')
  })

  it('carries no colour outside the vocabulary', () => {
    const all = (['current', 'dim', 'accent'] as const)
      .map((tone) => spinnerVariants({ tone }))
      .join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})

describe('Spinner, for a reader', () => {
  it('passes axe without a label', async () => {
    // Not focusable - nothing to press - only whether the busy state alone,
    // with no word for what is loading, still reads cleanly.
    await expectNoA11yViolations(<Spinner />)
  })

  it('passes axe with a label', async () => {
    await expectNoA11yViolations(<Spinner label="Loading versions" />)
  })
})
