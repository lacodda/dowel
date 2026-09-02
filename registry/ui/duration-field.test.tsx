// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { DurationField, formatDuration, parseDuration } from './duration-field'

/*
 * DurationField.
 *
 * The parser is the component, so it is tested directly rather than through
 * the DOM: a test that types into the box and reads it back is checking
 * React's state handling, and what has to be right is which strings mean
 * which number.
 */

describe('reading what someone typed', () => {
  it.each([
    ['1h 30m', 90],
    ['1h30m', 90],
    ['1h', 60],
    ['45m', 45],
    ['2h 5m', 125],
  ])('reads %s as %i minutes', (text, minutes) => {
    expect(parseDuration(text)).toBe(minutes)
  })

  it('takes a bare number as minutes', () => {
    // `90` is an hour and a half, not ninety hours. Someone typing hours
    // writes the `h`; the common case is minutes.
    expect(parseDuration('90')).toBe(90)
  })

  it('takes the clock spelling', () => {
    expect(parseDuration('2:30')).toBe(150)
    expect(parseDuration('0:05')).toBe(5)
  })

  it('takes a decimal on the hours, with either separator', () => {
    // Half the world writes `1,5`. Rejecting it is rejecting people.
    expect(parseDuration('1.5h')).toBe(90)
    expect(parseDuration('1,5h')).toBe(90)
  })

  it('ignores spacing and case', () => {
    expect(parseDuration('  1H  30M  ')).toBe(90)
  })

  it('reads empty as no duration rather than zero', () => {
    // The distinction the value type exists for: no estimate is not an
    // estimate of nothing.
    expect(parseDuration('')).toBeNull()
    expect(parseDuration('   ')).toBeNull()
  })

  it('reads zero as zero', () => {
    expect(parseDuration('0m')).toBe(0)
    expect(parseDuration('0')).toBe(0)
  })

  it.each(['banana', '1h banana', 'h', '1x', '2:75', ''.padEnd(3, '-')])(
    'refuses %s rather than guessing',
    (text) => {
      if (text.trim() === '') return
      expect(parseDuration(text)).toBeUndefined()
    },
  )

  it('does not quietly drop the part it could not read', () => {
    // The dangerous failure: `1h banana` parsing as an hour means a typo
    // becomes a value nobody questions.
    expect(parseDuration('1h banana')).toBeUndefined()
  })
})

describe('writing it back', () => {
  it.each([
    [90, '1h 30m'],
    [60, '1h'],
    [45, '45m'],
    [0, '0m'],
    [125, '2h 5m'],
  ])('writes %i minutes as %s', (minutes, text) => {
    expect(formatDuration(minutes)).toBe(text)
  })

  it('round-trips every spelling to the canonical one', () => {
    // Loose in, strict out: whatever was typed, the column lines up.
    for (const text of ['90', '1h30m', '1.5h', '1:30', '90m']) {
      expect(formatDuration(parseDuration(text) as number)).toBe('1h 30m')
    }
  })
})

describe('the field', () => {
  it('shows the value in the canonical spelling', () => {
    render(<DurationField value={90} onValueChange={() => {}} aria-label="Estimate" />)
    expect(screen.getByLabelText('Estimate')).toHaveProperty('value', '1h 30m')
  })

  it('shows an empty box for no duration', () => {
    render(<DurationField value={null} onValueChange={() => {}} aria-label="Estimate" />)
    expect(screen.getByLabelText('Estimate')).toHaveProperty('value', '')
  })

  it('does not reformat under the cursor while typing', async () => {
    /* The classic controlled-input-with-parsing bug: reformat on every
     * keystroke and `1h 3` becomes `1h 3m` mid-word, moving the caret. */
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DurationField value={null} onValueChange={onValueChange} aria-label="Estimate" />)

    const field = screen.getByLabelText('Estimate')
    await user.click(field)
    await user.keyboard('1h 3')

    expect(field).toHaveProperty('value', '1h 3')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('commits on blur', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DurationField value={null} onValueChange={onValueChange} aria-label="Estimate" />)

    await user.click(screen.getByLabelText('Estimate'))
    await user.keyboard('90')
    await user.tab()

    expect(onValueChange).toHaveBeenCalledWith(90)
    expect(screen.getByLabelText('Estimate')).toHaveProperty('value', '1h 30m')
  })

  it('commits on Enter', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DurationField value={null} onValueChange={onValueChange} aria-label="Estimate" />)

    await user.click(screen.getByLabelText('Estimate'))
    await user.keyboard('2h{Enter}')

    expect(onValueChange).toHaveBeenCalledWith(120)
  })

  it('puts back the real value when what was typed cannot be read', async () => {
    // The box must not be left saying something the form does not believe.
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DurationField value={90} onValueChange={onValueChange} aria-label="Estimate" />)

    const field = screen.getByLabelText('Estimate')
    await user.clear(field)
    await user.keyboard('banana')
    await user.tab()

    expect(field).toHaveProperty('value', '1h 30m')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('follows a value changed from outside', () => {
    const { rerender } = render(
      <DurationField value={90} onValueChange={() => {}} aria-label="Estimate" />,
    )
    rerender(<DurationField value={30} onValueChange={() => {}} aria-label="Estimate" />)
    expect(screen.getByLabelText('Estimate')).toHaveProperty('value', '30m')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(
      <DurationField value={90} onValueChange={() => {}} aria-label="Estimate" />,
    )
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(
      <DurationField value={90} onValueChange={() => {}} aria-label="Estimate" />,
    )
  })
})
