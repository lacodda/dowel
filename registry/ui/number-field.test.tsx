// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { NumberField } from './number-field'

/*
 * NumberField.
 *
 * Base UI carries the parsing and the keyboard, so what is tested here is the
 * part dowel decided: that the value is a number and not a string, that empty
 * is null rather than zero, and that the unit is a caption rather than
 * something a reader has to type around.
 */

describe('NumberField', () => {
  it('holds a number', () => {
    render(<NumberField value={42} aria-label="Width" />)
    expect(screen.getByLabelText('Width')).toHaveProperty('value', '42')
  })

  it('is a text box that says it holds a number', () => {
    /* Not `<input type="number">`, and deliberately: the native one shows its
     * own spinner outside a stylesheet's reach, rejects a pasted `1 234,50`,
     * and on some browsers silently blanks itself on anything it dislikes.
     * Base UI uses a text box, tells the keyboard it is numeric, and names
     * the kind of control it is - which is what a screen reader announces. */
    render(<NumberField value={5} min={0} max={10} aria-label="Width" />)
    const field = screen.getByLabelText('Width')
    expect(field.getAttribute('type')).toBe('text')
    expect(field.getAttribute('inputmode')).toBe('numeric')
    expect(field.getAttribute('aria-roledescription')).toBeTruthy()
  })

  it('steps with the arrow keys', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField defaultValue={5} step={1} onValueChange={onValueChange} aria-label="Width" />)

    await user.click(screen.getByLabelText('Width'))
    await user.keyboard('{ArrowUp}')
    expect(onValueChange.mock.calls[0]?.[0]).toBe(6)
  })

  it('reports an empty box as no number, not as zero', async () => {
    /* The distinction the value type exists for. A field that returns 0 for
     * an empty box makes "no price" and "free" the same the moment it saves. */
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField defaultValue={5} onValueChange={onValueChange} aria-label="Width" />)

    await user.clear(screen.getByLabelText('Width'))
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBeNull()
  })

  it('holds within its range', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <NumberField defaultValue={10} max={10} step={1} onValueChange={onValueChange} aria-label="Width" />,
    )

    await user.click(screen.getByLabelText('Width'))
    await user.keyboard('{ArrowUp}')
    const last = onValueChange.mock.calls.at(-1)?.[0]
    expect(last === undefined || last === 10).toBe(true)
  })

  it('shows the unit beside the field rather than inside it', () => {
    // Inside, it is something to parse and something to delete by accident.
    render(<NumberField value={16} unit="px" aria-label="Width" />)
    expect(screen.getByText('px')).toBeDefined()
    expect(screen.getByLabelText('Width')).toHaveProperty('value', '16')
  })

  it('hides the stepper when asked', () => {
    const { container } = render(<NumberField value={1000} hideStepper aria-label="Width" />)
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })

  it('has a stepper by default, and does not announce it twice', () => {
    /* The buttons are `aria-hidden`: the input already announces its value and
     * its range, so a reader hearing two more unlabelled controls learns
     * nothing it did not have. */
    const { container } = render(<NumberField value={5} aria-label="Width" />)
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) {
      expect(button.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('formats the number the way the reader writes it', () => {
    // `Intl` rather than a hand-rolled separator: a field showing 1234.5 to
    // someone who writes 1 234,5 is one they translate in their head.
    render(
      <NumberField
        value={1234.5}
        format={{ style: 'currency', currency: 'EUR' }}
        locale="de-DE"
        aria-label="Price"
      />,
    )
    expect(screen.getByLabelText('Price')).toHaveProperty('value', expect.stringContaining('1.234,5'))
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<NumberField value={5} unit="px" aria-label="Width" />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(<NumberField value={5} unit="px" aria-label="Width" />)
  })
})
