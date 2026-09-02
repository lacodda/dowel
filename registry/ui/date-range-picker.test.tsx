// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { DateRangePicker, type DateRange } from './date-range-picker'

/*
 * DateRangePicker.
 *
 * Almost all of these are about the state between the two clicks. A range
 * picker that treats a half-made range as nothing appears to do nothing until
 * the second click, which is how a reader concludes it is broken.
 */

function Example(props: Partial<React.ComponentProps<typeof DateRangePicker>> = {}) {
  return (
    <DateRangePicker
      locale="en-GB"
      placeholder="Pick a range"
      previousMonthLabel="Previous month"
      nextMonthLabel="Next month"
      aria-label="Period"
      {...props}
    />
  )
}

describe('DateRangePicker', () => {
  it('says the placeholder when nothing is chosen', () => {
    render(<Example />)
    expect(screen.getByRole('button', { name: 'Period' }).textContent).toContain('Pick a range')
  })

  it('shows the first day alone while the range is half made', () => {
    // Not "nothing chosen" and not a range of one day: the middle of the
    // interaction, and the reader has to see it.
    render(<Example value={{ start: '2026-09-02' }} />)
    expect(screen.getByRole('button', { name: 'Period' }).textContent).toContain('2 Sept 2026')
  })

  it('shows both days once the range is whole', () => {
    render(<Example value={{ start: '2026-09-02', end: '2026-09-10' }} />)
    const label = screen.getByRole('button', { name: 'Period' }).textContent ?? ''
    expect(label).toContain('2 Sept 2026')
    expect(label).toContain('10 Sept 2026')
  })

  it('reports the first click as a start with no end', async () => {
    /* Fires on both clicks, which is what lets a product show "from 2
     * September" while the reader is still deciding. */
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value={{}} onValueChange={onValueChange} />)

    await user.click(screen.getByRole('button', { name: 'Period' }))
    await user.click(screen.getByRole('button', { name: /^2 September 2026/ }))

    expect(onValueChange).toHaveBeenCalledWith({ start: '2026-09-02' })
  })

  it('completes the range on the second click', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value={{ start: '2026-09-02' }} onValueChange={onValueChange} />)

    await user.click(screen.getByRole('button', { name: 'Period' }))
    await user.click(screen.getByRole('button', { name: /^10 September 2026/ }))

    expect(onValueChange).toHaveBeenCalledWith({ start: '2026-09-02', end: '2026-09-10' })
  })

  it('accepts the two clicks in either order', async () => {
    // Clicking the 20th and then the 10th plainly means the span between
    // them; refusing it would be correct and unhelpful.
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value={{ start: '2026-09-20' }} onValueChange={onValueChange} />)

    await user.click(screen.getByRole('button', { name: 'Period' }))
    await user.click(screen.getByRole('button', { name: /^10 September 2026/ }))

    expect(onValueChange).toHaveBeenCalledWith({ start: '2026-09-10', end: '2026-09-20' })
  })

  it('starts a new range when one is already whole', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Example value={{ start: '2026-09-02', end: '2026-09-10' }} onValueChange={onValueChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'Period' }))
    await user.click(screen.getByRole('button', { name: /^20 September 2026/ }))

    expect(onValueChange).toHaveBeenCalledWith({ start: '2026-09-20' })
  })

  it('stays open until the range is whole', async () => {
    /* Driven by a real parent, because the popup's behaviour depends on the
     * value coming back: after the first click there is a start and no end,
     * and that is what keeps it open. */
    const user = userEvent.setup()
    function Host() {
      const [range, setRange] = useState<DateRange>({})
      return <Example value={range} onValueChange={setRange} />
    }
    render(<Host />)

    await user.click(screen.getByRole('button', { name: 'Period' }))
    await user.click(screen.getByRole('button', { name: /^2 September 2026/ }))
    expect(screen.getByRole('grid'), 'closed after the first click').toBeDefined()

    await user.click(screen.getByRole('button', { name: /^10 September 2026/ }))
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example value={{ start: '2026-09-02', end: '2026-09-10' }} />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(<Example value={{ start: '2026-09-02', end: '2026-09-10' }} />)
  })
})
