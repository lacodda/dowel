// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
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
    expect(screen.getByRole('button', { name: /^Release date/ }).textContent).toContain('Pick a date')
  })

  it('is named by its label and then by what it shows, so the name holds the words on it', () => {
    // WCAG 2.5.3: someone telling voice control what they see on the button
    // says the date, and a name of "Release date" alone does not have it.
    const { rerender } = render(<Example />)
    expect(screen.getByRole('button', { name: 'Release date Pick a date' })).toBeDefined()
    rerender(<Example value="2026-09-02" />)
    expect(screen.getByRole('button', { name: 'Release date 2 September 2026' })).toBeDefined()
  })

  it('writes the date the reader own way', () => {
    // `2026-09-02` is what is stored; "2 September 2026" is what is read.
    render(<Example value="2026-09-02" />)
    expect(screen.getByRole('button', { name: /^Release date/ }).textContent).toContain(
      '2 September 2026',
    )
  })

  it('opens from the keyboard on the chosen day, in a named dialog', async () => {
    // Not on the month-paging button, where the first focusable thing in the
    // popup put it: the days were two Tabs away from a reader who came to
    // choose one.
    const user = userEvent.setup()
    render(<Example value="2026-09-14" />)
    screen.getByRole('button', { name: /^Release date/ }).focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('dialog', { name: 'Release date' })).toBeDefined()
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /^14 September 2026/ })),
    )
    // And it stays there: the popup's own first focus, if it ran, would land
    // a few frames later and take it to the month-paging button.
    await new Promise((settle) => setTimeout(settle, 100))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^14 September 2026/ }))
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^15 September 2026/ }))
  })

  it('opens the calendar and chooses a day', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value="2026-09-02" onValueChange={onValueChange} />)

    await user.click(screen.getByRole('button', { name: /^Release date/ }))
    await user.click(screen.getByRole('button', { name: /^14 September 2026/ }))

    expect(onValueChange).toHaveBeenCalledWith('2026-09-14')
  })

  it('closes once a day is chosen', async () => {
    // Choosing is the whole errand; waiting for a second dismissing click is
    // one click too many.
    const user = userEvent.setup()
    render(<Example value="2026-09-02" onValueChange={() => {}} />)

    await user.click(screen.getByRole('button', { name: /^Release date/ }))
    expect(screen.getByRole('grid')).toBeDefined()

    await user.click(screen.getByRole('button', { name: /^14 September 2026/ }))
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('opens on the chosen month, not on this one', async () => {
    const user = userEvent.setup()
    render(<Example value="2026-12-24" />)

    await user.click(screen.getByRole('button', { name: /^Release date/ }))
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

  it('leaves the form alone without a name, and sends nothing for no date', () => {
    const { container, rerender } = render(<Example value="2026-09-02" />)
    expect(container.querySelector('input[type="hidden"]')).toBeNull()
    rerender(<Example name="released_on" />)
    expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe('')
  })

  it('says when it is showing its placeholder, and reads a value that is no date as none', () => {
    const shown = () => screen.getByText(/Pick a date|September/)
    const { rerender } = render(<Example />)
    expect(shown().hasAttribute('data-placeholder')).toBe(true)
    rerender(<Example value="2026-09-02" />)
    expect(shown().hasAttribute('data-placeholder')).toBe(false)
    rerender(<Example value={'2026-13-45' as never} />)
    expect(shown().textContent).toBe('Pick a date')
    expect(shown().hasAttribute('data-placeholder')).toBe(true)
  })

  it('names itself only through a label it was given', () => {
    // No label: nothing to point at, so no `aria-labelledby` pointing at the
    // trigger itself - a Field names it by its id instead.
    render(
      <DatePicker
        locale="en-GB"
        placeholder="Pick a date"
        previousMonthLabel="Previous month"
        nextMonthLabel="Next month"
      />,
    )
    expect(screen.getByRole('button').hasAttribute('aria-labelledby')).toBe(false)
  })

  it('names its popup and its month for the field, without a notch', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <>
        <span id="field-label">Released on</span>
        <DatePicker
          aria-labelledby="field-label"
          locale="en-GB"
          placeholder="Pick a date"
          previousMonthLabel="Previous month"
          nextMonthLabel="Next month"
        />
      </>,
    )
    await user.click(screen.getByRole('button', { name: /^Released on/ }))
    const popup = await screen.findByRole('dialog', { name: 'Released on' })
    expect(popup.hasAttribute('aria-label')).toBe(false)
    expect(popup.querySelector('.rotate-45')).toBeNull()
    // The month is named by the placeholder when the field gave no label of
    // its own words.
    expect(screen.getByRole('grid', { name: 'Pick a date' })).toBeDefined()
    unmount()

    render(<Example />)
    await user.click(screen.getByRole('button', { name: /^Release date/ }))
    expect(await screen.findByRole('grid', { name: 'Release date' })).toBeDefined()
  })

  it('takes the date back with nobody listening, and closes', async () => {
    const user = userEvent.setup()
    render(<Example value="2026-09-02" clearLabel="Clear" />)
    await user.click(screen.getByRole('button', { name: /^Release date/ }))
    await user.click(await screen.findByRole('button', { name: 'Clear' }))
    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull())
  })

  it('chooses with nobody listening, and closes', async () => {
    const user = userEvent.setup()
    render(<Example value="2026-09-02" />)
    await user.click(screen.getByRole('button', { name: /^Release date/ }))
    await user.click(await screen.findByRole('button', { name: /^14 September 2026/ }))
    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull())
  })

  it('does not open when disabled', async () => {
    const user = userEvent.setup()
    render(<Example disabled />)

    await user.click(screen.getByRole('button', { name: /^Release date/ }))
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

describe('DatePicker, taking a date back', () => {
  const trigger = () => screen.getByRole('button', { name: /^Release date/ })

  it('offers it under the month, in the product’s words, while a day is chosen', async () => {
    const user = userEvent.setup()
    render(<Example value="2026-09-02" clearLabel="Clear" />)
    await user.click(trigger())
    expect(await screen.findByRole('button', { name: 'Clear' })).toBeDefined()
  })

  it('tells the product nothing is chosen, and closes', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value="2026-09-02" clearLabel="Clear" onValueChange={onValueChange} />)
    await user.click(trigger())
    await user.click(await screen.findByRole('button', { name: 'Clear' }))
    expect(onValueChange).toHaveBeenCalledWith(undefined)
    await vi.waitFor(() => expect(screen.queryByRole('grid')).toBeNull())
  })

  it('has nothing to offer with nothing chosen, or without the words', async () => {
    // A button that does nothing is worse than none; and a required field
    // gives no words, so its date cannot be emptied.
    const user = userEvent.setup()
    const { unmount } = render(<Example clearLabel="Clear" />)
    await user.click(trigger())
    await screen.findByRole('grid')
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull()
    unmount()
    render(<Example value="2026-09-02" />)
    await user.click(trigger())
    const grid = await screen.findByRole('grid')
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull()
    // Not a button without words either: the days and the two month buttons
    // are all there is.
    const days = grid.querySelectorAll('button').length
    expect(within(screen.getByRole('dialog')).getAllByRole('button')).toHaveLength(days + 2)
  })

  it('hands nothing only to a handler that can take it', () => {
    const day = (value: string) => value.length
    // Without the words a picker is never emptied, and a handler of days is
    // enough.
    expect(<Example onValueChange={day} />).toBeDefined()
    // @ts-expect-error - a picker that can be emptied tells its handler so.
    expect(<DatePicker clearLabel="Clear" onValueChange={day} placeholder="" previousMonthLabel="" nextMonthLabel="" />).toBeDefined()
  })
})
