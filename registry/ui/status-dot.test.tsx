// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge, StatusDot } from './status-dot'
import { expectNoA11yViolations } from '../../tests/a11y'

describe('StatusDot', () => {
  it('names the state even when the word is not printed', () => {
    // The defect the component exists to prevent: a coloured circle and
    // nothing else, which is a state only a sighted reader who separates the
    // hues can read.
    render(<StatusDot status="bad" label="Failed" />)
    expect(screen.getByRole('img', { name: 'Failed' })).toBeDefined()
    expect(screen.queryByText('Failed')).toBeNull()
  })

  it('says the word once when it is printed', () => {
    // Printed, the word is in the tree twice over unless the visible copy is
    // hidden from the reader: once from the container's label, once as text.
    render(<StatusDot status="good" label="Online" showLabel />)
    const named = screen.getAllByRole('img', { name: 'Online' })
    expect(named).toHaveLength(1)

    const text = screen.getByText('Online')
    expect(text.getAttribute('aria-hidden')).toBe('true')
  })

  it('draws each state in its own token and nothing outside the vocabulary', () => {
    for (const [status, token] of [
      ['good', 'bg-good'],
      ['warn', 'bg-warn'],
      ['bad', 'bg-bad'],
      ['info', 'bg-info'],
      ['neutral', 'bg-line-2'],
    ] as const) {
      const { container, unmount } = render(<StatusDot status={status} label={status} />)
      const dot = container.querySelector('span > span')
      expect(dot?.className, status).toContain(token)
      expect(dot?.className, status).not.toMatch(/\bdark:/)
      expect(dot?.className, status).not.toMatch(/#[0-9a-f]{3,8}\b/i)
      unmount()
    }
  })

  it('lets an icon stand in for the dot, in the state colour', () => {
    // The second channel: a shape a reader can tell apart without the hue.
    const { container } = render(
      <StatusDot status="bad" label="Failed" icon={<svg data-testid="cross" />} />,
    )
    expect(screen.getByTestId('cross')).toBeDefined()

    // The circle is gone rather than drawn behind the glyph.
    expect(container.querySelector('.bg-bad')).toBeNull()
    expect(container.querySelector('.text-bad')).not.toBeNull()
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(<StatusDot label="Away" className="gap-4" />)
    expect(container.firstElementChild?.className).toContain('gap-4')
    expect(container.firstElementChild?.className).not.toContain('gap-1.5')
  })

  it('passes the accessibility gate', async () => {
    await expectNoA11yViolations(<StatusDot status="warn" label="Degraded" showLabel />)
  })
})

describe('StatusBadge', () => {
  it('is read as its words, not as an image of them', () => {
    // The word is on the screen. Naming the element would replace the text a
    // reader can already hear with a duplicate.
    const { container } = render(<StatusBadge status="bad">Failed</StatusBadge>)
    expect(screen.getByText('Failed')).toBeDefined()
    expect(container.firstElementChild?.getAttribute('role')).toBeNull()
    expect(container.firstElementChild?.getAttribute('aria-label')).toBeNull()
  })

  it('drops the dot when an icon carries the state', () => {
    // Two marks for one condition is noise, and the icon is the better of the
    // two because it differs by shape.
    const { container } = render(
      <StatusBadge status="good" icon={<svg data-testid="tick" />}>
        Passed
      </StatusBadge>,
    )
    expect(screen.getByTestId('tick')).toBeDefined()
    expect(container.querySelector('.bg-current')).toBeNull()
  })

  it('draws the dot in the text colour rather than a second token', () => {
    // A separate fill token would drift from the text the first time either
    // changed, and the badge would carry two greens.
    const { container } = render(<StatusBadge status="good">Passed</StatusBadge>)
    expect(container.querySelector('.bg-current')).not.toBeNull()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<StatusBadge status="warn">Degraded</StatusBadge>)
    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('bg-warn-soft')
    expect(className).not.toMatch(/\bdark:/)
    expect(className).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes the accessibility gate', async () => {
    await expectNoA11yViolations(<StatusBadge status="bad">Failed</StatusBadge>)
  })
})
