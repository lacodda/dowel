// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Radio, RadioGroup } from './radio-group'

/*
 * RadioGroup.
 *
 * The group is the control, so the tests are about the group: that it is
 * announced as one thing, that the arrow keys move within it, and that only
 * one option is ever chosen. A radio that behaves like a checkbox passes any
 * test written about a single button.
 */

function Example({ onValueChange }: { onValueChange?: (value: string) => void } = {}) {
  return (
    <RadioGroup aria-label="Ripeness" defaultValue="ripe" onValueChange={onValueChange}>
      <Radio value="green">Green</Radio>
      <Radio value="ripe">Ripe</Radio>
      <Radio value="soft">Soft</Radio>
    </RadioGroup>
  )
}

describe('RadioGroup', () => {
  it('is announced as one group with a name', () => {
    render(<Example />)
    expect(screen.getByRole('radiogroup', { name: 'Ripeness' })).toBeDefined()
  })

  it('holds exactly one choice', () => {
    render(<Example />)
    // The dot carries the state; its *name* carries the words, because the
    // label is a sibling rather than a child.
    const chosen = screen
      .getAllByRole('radio')
      .filter((radio) => radio.getAttribute('aria-checked') === 'true')
    expect(chosen).toHaveLength(1)
    expect(screen.getByRole('radio', { name: 'Ripe' })).toBe(chosen[0])
  })

  it('moves the choice with the arrow keys', async () => {
    // What makes it a radio group rather than three buttons: one tab stop,
    // and the arrows move within it.
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example onValueChange={onValueChange} />)

    await user.tab()
    await user.keyboard('{ArrowDown}')
    expect(onValueChange.mock.calls[0]?.[0]).toBe('soft')
  })

  it('is operated by clicking an option label', () => {
    render(<Example />)
    expect(screen.getByRole('radio', { name: 'Green' })).toBeDefined()
  })

  it('replaces the choice rather than adding to it', async () => {
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByText('Green'))
    const chosen = screen
      .getAllByRole('radio')
      .filter((radio) => radio.getAttribute('aria-checked') === 'true')
    expect(chosen).toHaveLength(1)
    expect(screen.getByRole('radio', { name: 'Green' })).toBe(chosen[0])
  })

  it('lays out in a row when asked, and a column by default', () => {
    const { container: column } = render(
      <RadioGroup aria-label="a">
        <Radio value="x">X</Radio>
      </RadioGroup>,
    )
    expect(column.firstElementChild?.className).toContain('flex-col')

    const { container: row } = render(
      <RadioGroup aria-label="b" orientation="horizontal">
        <Radio value="x">X</Radio>
      </RadioGroup>,
    )
    expect(row.firstElementChild?.className).toContain('flex-row')
  })

  it('does not fire when disabled', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <RadioGroup aria-label="Ripeness" disabled onValueChange={onValueChange}>
        <Radio value="green">Green</Radio>
      </RadioGroup>,
    )

    await user.click(screen.getByText('Green'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(<Example />)
  })
})
