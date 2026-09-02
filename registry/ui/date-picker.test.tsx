// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { DatePicker } from './date-picker'

/*
 * DatePicker.
 *
 * The calendar inside is tested on its own, so these are about the field
 * around it: what the trigger says, that choosing closes the popup, and that
 * the date reaches a form.
 */

function Example(props: Partial<React.ComponentProps<typeof DatePicker>> = {}) {
  return (
    <DatePicker
      locale="en-GB"
      placeholder="Pick a date"
      previousMonthLabel="Previous month"
      nextMonthLabel="Next month"
      aria-label="Release date"
      {...props}
    />
  )
}

describe('DatePicker', () => {
  it('says the placeholder when nothing is chosen', () => {
    render(<Example />)
    expect(screen.getByRole('button', { name: 'Release date' }).textContent).toContain('Pick a date')
  })

  it('writes the date the reader own way', () => {
    // `2026-09-02` is what is stored; "2 September 2026" is what is read.
    render(<Example value="2026-09-02" />)
    expect(screen.getByRole('button', { name: 'Release date' }).textContent).toContain(
      '2 September 2026',
    )
  })

  it('opens the calendar and chooses a day', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value="2026-09-02" onValueChange={onValueChange} />)

    await user.click(screen.getByRole('button', { name: 'Release date' }))
    await user.click(screen.getByRole('button', { name: /^14 September 2026/ }))

    expect(onValueChange).toHaveBeenCalledWith('2026-09-14')
  })

  it('closes once a day is chosen', async () => {
    // Choosing is the whole errand; waiting for a second dismissing click is
    // one click too many.
    const user = userEvent.setup()
    render(<Example value="2026-09-02" onValueChange={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Release date' }))
    expect(screen.getByRole('grid')).toBeDefined()

    await user.click(screen.getByRole('button', { name: /^14 September 2026/ }))
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('opens on the chosen month, not on this one', async () => {
    const user = userEvent.setup()
    render(<Example value="2026-12-24" />)

    await user.click(screen.getByRole('button', { name: 'Release date' }))
    expect(screen.getByRole('button', { name: /^24 December 2026/ })).toBeDefined()
  })

  it('puts the value where a form can find it', () => {
    // The trigger is a button, and a button is not a field: without this the
    // form submits the screen and loses the date.
    const { container } = render(<Example value="2026-09-02" name="released_on" />)
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    expect(hidden.name).toBe('released_on')
    expect(hidden.value).toBe('2026-09-02')
  })

  it('does not open when disabled', async () => {
    const user = userEvent.setup()
    render(<Example disabled />)

    await user.click(screen.getByRole('button', { name: 'Release date' }))
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example value="2026-09-02" />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(<Example value="2026-09-02" />)
  })
})
