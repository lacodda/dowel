// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { TimeField, formatTime, parseTime } from './time-field'

/*
 * TimeField.
 *
 * The parser is the component, so it is tested directly. The cases that
 * matter are the ones a person actually types on a phone, where a colon is a
 * reach - and the ones that must be refused rather than guessed at.
 */

describe('reading what someone typed', () => {
  it.each([
    ['9:30', '09:30'],
    ['09:30', '09:30'],
    ['21:30', '21:30'],
    ['9.30', '09:30'],
  ])('reads %s as %s', (text, time) => {
    expect(parseTime(text)).toBe(time)
  })

  it('takes a bare hour as the hour', () => {
    // `9` is nine o'clock, not nine minutes past midnight.
    expect(parseTime('9')).toBe('09:00')
    expect(parseTime('21')).toBe('21:00')
  })

  it('takes the colonless spelling a phone keyboard invites', () => {
    expect(parseTime('930')).toBe('09:30')
    expect(parseTime('0930')).toBe('09:30')
    expect(parseTime('2130')).toBe('21:30')
  })

  it('takes am and pm, with or without a space', () => {
    expect(parseTime('9pm')).toBe('21:00')
    expect(parseTime('9 pm')).toBe('21:00')
    expect(parseTime('9:30 PM')).toBe('21:30')
    expect(parseTime('9am')).toBe('09:00')
  })

  it('gets midnight and noon right, which is where twelve-hour clocks break', () => {
    // 12am is midnight and 12pm is noon - the one pair that is not "add
    // twelve if pm".
    expect(parseTime('12am')).toBe('00:00')
    expect(parseTime('12pm')).toBe('12:00')
    expect(parseTime('12:30am')).toBe('00:30')
    expect(parseTime('12:30pm')).toBe('12:30')
  })

  it('reads empty as no time rather than midnight', () => {
    expect(parseTime('')).toBeNull()
    expect(parseTime('   ')).toBeNull()
  })

  it.each(['25:00', '9:60', '13pm', '0pm', 'banana', '9:3', '99999'])(
    'refuses %s rather than guessing',
    (text) => {
      expect(parseTime(text)).toBeUndefined()
    },
  )
})

describe('writing it back', () => {
  it('writes the reader own way, without changing what is stored', () => {
    expect(formatTime('21:30', 'en-GB')).toBe('21:30')
    expect(formatTime('21:30', 'en-US')).toMatch(/9:30\s?PM/i)
  })
})

describe('the field', () => {
  it('shows the value formatted', () => {
    /* Stored and shown are not the same string: `Intl` writes the hour
     * without a leading zero, so `09:30` is displayed as `9:30`. The value
     * that leaves the component is always the padded, sortable one. */
    render(<TimeField value="21:30" onValueChange={() => {}} locale="en-GB" aria-label="Start" />)
    expect(screen.getByLabelText('Start')).toHaveProperty('value', '21:30')

    render(<TimeField value="09:30" onValueChange={() => {}} locale="en-GB" aria-label="Morning" />)
    expect(screen.getByLabelText('Morning')).toHaveProperty('value', '9:30')
  })

  it('shows an empty box for no time', () => {
    render(<TimeField value={null} onValueChange={() => {}} aria-label="Start" />)
    expect(screen.getByLabelText('Start')).toHaveProperty('value', '')
  })

  it('does not reformat under the cursor while typing', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<TimeField value={null} onValueChange={onValueChange} aria-label="Start" />)

    const field = screen.getByLabelText('Start')
    await user.click(field)
    await user.keyboard('9:3')

    expect(field).toHaveProperty('value', '9:3')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('commits on blur', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<TimeField value={null} onValueChange={onValueChange} locale="en-GB" aria-label="Start" />)

    await user.click(screen.getByLabelText('Start'))
    await user.keyboard('930')
    await user.tab()

    // The value is `09:30`; what is shown is what `Intl` writes for it.
    expect(onValueChange).toHaveBeenCalledWith('09:30')
    expect(screen.getByLabelText('Start')).toHaveProperty('value', '9:30')
  })

  it('commits on Enter', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<TimeField value={null} onValueChange={onValueChange} aria-label="Start" />)

    await user.click(screen.getByLabelText('Start'))
    await user.keyboard('9pm{Enter}')

    expect(onValueChange).toHaveBeenCalledWith('21:00')
  })

  it('puts back the real value when what was typed cannot be read', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<TimeField value="09:30" onValueChange={onValueChange} locale="en-GB" aria-label="Start" />)

    const field = screen.getByLabelText('Start')
    await user.clear(field)
    await user.keyboard('25:00')
    await user.tab()

    expect(field).toHaveProperty('value', '9:30')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('does not clear itself when the parent lags a tick', async () => {
    /* The defect DurationField had: the box commits, tells the parent, and
     * the parent has not moved yet - comparing against `value` blanks the
     * field under the reader. */
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<TimeField value={null} onValueChange={onValueChange} locale="en-GB" aria-label="Start" />)

    await user.click(screen.getByLabelText('Start'))
    await user.keyboard('930')
    await user.tab()

    expect(screen.getByLabelText('Start')).toHaveProperty('value', '9:30')
  })

  it('follows a value changed from outside', () => {
    const { rerender } = render(
      <TimeField value="09:30" onValueChange={() => {}} locale="en-GB" aria-label="Start" />,
    )
    rerender(<TimeField value="14:00" onValueChange={() => {}} locale="en-GB" aria-label="Start" />)
    expect(screen.getByLabelText('Start')).toHaveProperty('value', '14:00')
  })

  it('is not a native time input', () => {
    // The browser draws its own control for `type="time"`, and no stylesheet
    // reaches inside it.
    render(<TimeField value="09:30" onValueChange={() => {}} aria-label="Start" />)
    expect(screen.getByLabelText('Start').getAttribute('type')).toBe('text')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(
      <TimeField value="09:30" onValueChange={() => {}} aria-label="Start" />,
    )
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(
      <TimeField value="09:30" onValueChange={() => {}} aria-label="Start" />,
    )
  })
})
