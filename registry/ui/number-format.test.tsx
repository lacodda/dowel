// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NumberFormat, formatNumber } from './number-format'

/*
 * NumberFormat.
 *
 * A locale is passed explicitly in every test. Reading the machine's own would
 * make the file pass here and fail on the build agent, which is the kind of
 * test that gets deleted rather than fixed.
 */

describe('the separators are the reader’s', () => {
  it('groups thousands the way the language does', () => {
    render(<NumberFormat value={1234567} locale="en-US" />)
    expect(screen.getByText('1,234,567')).toBeDefined()
  })

  it('and differently in a language that groups differently', () => {
    // The reason this is not `toLocaleString()` at the call site with a
    // hard-coded locale: `1.234.567` is a string an English reader reads as
    // one and a bit.
    expect(formatNumber(1234567, 'de-DE')).toBe('1.234.567')
  })
})

describe('the figures line up', () => {
  it('sets tabular figures, which is the point in a column', () => {
    // Without it a proportional font gives `1` less room than `8`, the column
    // ripples, and 9,999 and 10,000 can only be told apart by counting. It
    // looks fine on the single number it is tried on and fails in a column,
    // which is where numbers live.
    const { container } = render(<NumberFormat value={1} locale="en-US" />)
    expect(container.firstElementChild?.className).toContain('tabular-nums')
  })

  it('keeps them when the caller adds classes of its own', () => {
    const { container } = render(
      <NumberFormat value={1} locale="en-US" className="text-dim" />,
    )
    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('tabular-nums')
    expect(className).toContain('text-dim')
  })
})

describe('what Intl is asked for', () => {
  it('writes money with its symbol', () => {
    render(<NumberFormat value={12.5} locale="en-US" style="currency" currency="USD" />)
    expect(screen.getByText('$12.50')).toBeDefined()
  })

  it('does not spread a formatting option onto the element', () => {
    // `style` is both a valid `Intl` option and a valid DOM attribute.
    // Spreading `style="currency"` onto a `<span>` is a runtime error, which
    // is why the options are listed out rather than collected by rest.
    const { container } = render(
      <NumberFormat value={12.5} locale="en-US" style="currency" currency="USD" />,
    )
    expect(container.firstElementChild?.getAttribute('style')).toBeNull()
  })

  it('writes a percentage', () => {
    render(<NumberFormat value={0.42} locale="en-US" style="percent" />)
    expect(screen.getByText('42%')).toBeDefined()
  })

  it('shortens a large number when asked, and not otherwise', () => {
    // Compactness costs precision, so it is the caller's decision rather than
    // something a number component does past a threshold of its own choosing.
    expect(formatNumber(1200000, 'en-US', { notation: 'compact' })).toBe('1.2M')
    expect(formatNumber(1200000, 'en-US')).toBe('1,200,000')
  })

  it('passes the rest through to the element', () => {
    render(<NumberFormat value={7} locale="en-US" data-testid="cell" aria-label="Seven" />)
    expect(screen.getByTestId('cell').getAttribute('aria-label')).toBe('Seven')
  })
})
