// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { EmptyState } from './empty-state'

/*
 * EmptyState.
 *
 * The tests are about the distinction the component exists for - three kinds
 * of nothing, which differ in what the reader should do next - and about the
 * mark being decoration rather than content.
 */

describe('the three kinds of nothing', () => {
  it('draws a dashed panel for what is not there yet', () => {
    const { container } = render(<EmptyState title="No works yet" />)
    expect(container.firstElementChild?.className).toContain('border-dashed')
  })

  it('draws a solid, tinted panel for a failure', () => {
    // A dashed border reads as a placeholder for something that belongs there,
    // and a failure is not that.
    const { container } = render(<EmptyState variant="error" title="Could not load" />)
    const className = container.firstElementChild?.className ?? ''
    expect(className).not.toContain('border-dashed')
    expect(className).toContain('bg-bad-soft/30')
  })

  it('says the failure in the failure colour', () => {
    render(<EmptyState variant="error" title="Could not load" />)
    expect(screen.getByText('Could not load').className).toContain('text-bad')
  })

  it('gives each kind its own mark', () => {
    const empty = render(<EmptyState title="a" />)
    const emptyMark = empty.container.querySelector('svg')?.innerHTML
    empty.unmount()

    const filtered = render(<EmptyState variant="filtered" title="a" />)
    const filteredMark = filtered.container.querySelector('svg')?.innerHTML
    filtered.unmount()

    const failed = render(<EmptyState variant="error" title="a" />)
    const errorMark = failed.container.querySelector('svg')?.innerHTML

    expect(new Set([emptyMark, filteredMark, errorMark]).size).toBe(3)
  })
})

describe('the way out', () => {
  it('renders the action it is given', () => {
    // An empty screen with no way out is a dead end.
    render(<EmptyState title="No works yet" action={<button>Add one</button>} />)
    expect(screen.getByRole('button', { name: 'Add one' })).toBeDefined()
  })

  it('takes a product’s own illustration in place of the mark', () => {
    const { container } = render(
      <EmptyState title="a" mark={<img alt="" src="data:," data-testid="own" />} />,
    )
    expect(screen.getByTestId('own')).toBeDefined()
    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('what it says to a screen reader', () => {
  it('keeps the mark out of the way', () => {
    // A watermark says nothing a reader needs, and announcing it would put a
    // shape between the reader and the sentence that matters.
    const { container } = render(<EmptyState title="No works yet" />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('passes axe in all three kinds', async () => {
    const empty = await expectNoA11yViolations(
      <EmptyState title="No works yet" body="Add one to begin." action={<button>Add</button>} />,
    )
    empty.unmount()

    const filtered = await expectNoA11yViolations(
      <EmptyState variant="filtered" title="Nothing matches" body="Try a wider filter." />,
    )
    filtered.unmount()

    await expectNoA11yViolations(
      <EmptyState variant="error" title="Could not load" body="The server said no." />,
    )
  })
})

describe('the rest', () => {
  it('shows a body only when there is one', () => {
    const withBody = render(<EmptyState title="a" body="b" />)
    expect(withBody.container.querySelectorAll('p')).toHaveLength(2)
    withBody.unmount()

    const without = render(<EmptyState title="a" />)
    expect(without.container.querySelectorAll('p')).toHaveLength(1)
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<EmptyState variant="error" title="a" body="b" />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(<EmptyState title="a" className="p-2" />)
    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('p-2')
    expect(className).not.toContain('p-8')
  })
})
