// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { BigCalendarDayContext, BigCalendarItem } from './big-calendar-item'

/*
 * BigCalendarItem.
 *
 * A line is either something to open or a fact, and it says which by what it
 * is: a button when it does something, a plain element when it does not. The
 * rest is how it is drawn - in the item's own colour, as a plan or as a thing
 * that has happened - and that it never takes more than its one line.
 */

describe('BigCalendarItem', () => {
  it('is a button when it opens something, and a plain line when it does not', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { rerender } = render(<BigCalendarItem onClick={onClick}>Clip</BigCalendarItem>)
    const button = screen.getByRole('button', { name: 'Clip' })
    // Not a submit button inside somebody's form.
    expect(button.getAttribute('type')).toBe('button')
    await user.click(button)
    expect(onClick).toHaveBeenCalledOnce()

    rerender(<BigCalendarItem>Clip</BigCalendarItem>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Clip').closest('[data-chip]')!.parentElement!.tagName).toBe('DIV')
  })

  it('draws as the product’s own element when given one', () => {
    render(<BigCalendarItem render={<a href="/releases/7" />}>Clip</BigCalendarItem>)
    expect(screen.getByRole('link', { name: 'Clip' }).getAttribute('href')).toBe('/releases/7')
  })

  it('keeps to one line: the words truncate, the marks do not shrink', () => {
    render(
      <BigCalendarItem start={<span>•</span>} end={<span>▶</span>}>
        A title far longer than any day is wide
      </BigCalendarItem>,
    )
    const words = screen.getByText('A title far longer than any day is wide')
    expect(words.className).toContain('truncate')
    expect(words.className).toContain('min-w-0')
    expect(words.closest('[data-chip]')!.parentElement!.className).toMatch(/(^|\s)h-6(\s|$)/)
    expect(screen.getByText('▶').parentElement!.className).toContain('shrink-0')
    expect(screen.getByText('•').parentElement!.className).toContain('shrink-0')
  })

  it('reaches the pointer floor by its own size, and draws its chip inside', () => {
    // Twenty-four to hit, twenty drawn: the box is the line, so a measurement
    // of it - the only one anything takes inside a day that is a target too -
    // sees the floor. Lines stand edge to edge and the chips come out four
    // apart.
    render(<BigCalendarItem onClick={() => {}}>Clip</BigCalendarItem>)
    const line = screen.getByRole('button')
    expect(line.className).toMatch(/(^|\s)h-6(\s|$)/)
    expect(line.className).toMatch(/(^|\s)py-0\.5(\s|$)/)
    expect(line.className).not.toMatch(/target-min/)
    expect(line.firstElementChild!.hasAttribute('data-chip')).toBe(true)
  })

  it('is drawn in its own colour, mixed with the theme rather than written down', () => {
    render(<BigCalendarItem color="var(--series-3)">Clip</BigCalendarItem>)
    const line = screen.getByText('Clip').parentElement!
    expect(line.style.background).toContain('var(--series-3) 30%')
    // The ink leans to the theme's text, so it reads on dark and on light.
    expect(line.style.color).toContain('var(--text)')
    expect(line.className).not.toContain('bg-soft')
  })

  it('is neutral without a colour', () => {
    render(<BigCalendarItem>Clip</BigCalendarItem>)
    const line = screen.getByText('Clip').parentElement!
    expect(line.className).toContain('bg-soft')
    expect(line.style.background).toBe('')
  })

  it('draws a plan as an outline, in its colour, with no fill', () => {
    render(
      <BigCalendarItem tentative color="var(--series-2)">
        Clip
      </BigCalendarItem>,
    )
    const line = screen.getByText('Clip').parentElement!
    expect(line.className).toContain('border-dashed')
    expect(line.parentElement!.hasAttribute('data-tentative')).toBe(true)
    expect(line.style.borderColor).toBe('var(--series-2)')
    expect(line.style.background).toBe('')
  })

  it('draws what has happened quieter, and still readable', () => {
    /* A weaker fill and the theme's dim ink - never opacity. Faded to 60%, as
     * kilna drew it, the words measured 2.7:1 in the light theme, and 1.7:1
     * on a day of the next month. */
    const { rerender } = render(
      <BigCalendarItem done color="var(--series-3)">
        Clip
      </BigCalendarItem>,
    )
    let line = screen.getByText('Clip').parentElement!
    expect(line.parentElement!.hasAttribute('data-done')).toBe(true)
    expect(line.className).not.toMatch(/\bopacity-/)
    expect(line.style.background).toContain('var(--series-3) 15%')
    // Halfway from the text to dim: quieter than a booking, and AA in every
    // series of every product (tests/palettes.test.ts).
    expect(line.style.color).toContain('var(--dim), var(--text)')

    rerender(<BigCalendarItem done>Clip</BigCalendarItem>)
    line = screen.getByText('Clip').parentElement!
    expect(line.style.color).toContain('var(--dim), var(--text)')
    expect(line.className).toContain('bg-softer')
    expect(line.className).not.toMatch(/\bopacity-/)
  })

  it('leaves the tab order only inside a day the keyboard is not on', () => {
    const { rerender } = render(<BigCalendarItem onClick={() => {}}>Clip</BigCalendarItem>)
    // Outside a month - the queue beside it - it is an ordinary button.
    expect(screen.getByRole('button').tabIndex).toBe(0)
    rerender(
      <BigCalendarDayContext.Provider value={false}>
        <BigCalendarItem onClick={() => {}}>Clip</BigCalendarItem>
      </BigCalendarDayContext.Provider>,
    )
    expect(screen.getByRole('button').tabIndex).toBe(-1)
    rerender(
      <BigCalendarDayContext.Provider value={true}>
        <BigCalendarItem onClick={() => {}}>Clip</BigCalendarItem>
      </BigCalendarDayContext.Provider>,
    )
    expect(screen.getByRole('button').tabIndex).toBe(0)
  })

  it('lets the caller win a conflict, on the line', () => {
    // The product's classes and style land on the element it renders - the
    // line - and the chip inside keeps its own drawing.
    render(
      <BigCalendarItem className="w-auto" style={{ opacity: 0.3 }}>
        Clip
      </BigCalendarItem>,
    )
    const line = screen.getByText('Clip').closest('[data-chip]')!.parentElement as HTMLElement
    expect(line.className).toContain('w-auto')
    expect(line.className).not.toContain('w-full')
    expect(line.style.opacity).toBe('0.3')
  })

  it('carries no colour of its own outside the vocabulary', () => {
    // The colour it is given is data; the classes it writes are tokens.
    const { container } = render(
      <BigCalendarItem tentative done onClick={() => {}}>
        Clip
      </BigCalendarItem>,
    )
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe, pressable and plain', async () => {
    await expectNoA11yViolations(
      <div>
        <BigCalendarItem onClick={() => {}} color="var(--series-1)">
          Clip
        </BigCalendarItem>
        <BigCalendarItem tentative>Single</BigCalendarItem>
      </div>,
    )
  })
})
