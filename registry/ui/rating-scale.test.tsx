// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { RatingScale } from './rating-scale'

/*
 * RatingScale.
 *
 * Most of these are about the state the component exists for: not judged yet.
 * A rating control that cannot express it is a five-option radio group, and
 * every one of the ways back to it - the pointer, the keyboard, the value it
 * reports - is tested here because losing any one of them loses the state.
 */

function Example({
  value,
  onValueChange = () => {},
}: {
  value?: number | undefined
  onValueChange?: (value: number | undefined) => void
}) {
  return (
    <RatingScale
      scale={5}
      value={value}
      onValueChange={onValueChange}
      label="Difficulty"
      emptyLabel="Not judged"
    />
  )
}

describe('RatingScale', () => {
  it('is one control with a name, not five', () => {
    render(<Example value={3} />)
    expect(screen.getByRole('slider', { name: 'Difficulty' })).toBeDefined()
  })

  it('reports its value and its range', () => {
    render(<Example value={3} />)
    const scale = screen.getByRole('slider')
    expect(scale.getAttribute('aria-valuenow')).toBe('3')
    expect(scale.getAttribute('aria-valuemin')).toBe('0')
    expect(scale.getAttribute('aria-valuemax')).toBe('5')
  })

  it('says in words that nothing has been judged', () => {
    /* The number is absent rather than zero, and `aria-valuetext` carries the
     * word - otherwise a screen reader announces nothing at all and the state
     * is invisible to it. */
    render(<Example value={undefined} />)
    const scale = screen.getByRole('slider')
    expect(scale.getAttribute('aria-valuenow')).toBeNull()
    expect(scale.getAttribute('aria-valuetext')).toBe('Not judged')
  })

  it('scores by clicking a mark', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(<Example value={undefined} onValueChange={onValueChange} />)

    const marks = container.querySelectorAll('[role="slider"] > *')
    await user.click(marks[2]!)
    expect(onValueChange).toHaveBeenCalledWith(3)
  })

  it('clears the score by clicking the mark already chosen', async () => {
    // The pointer's way back to not judged, and the reason this is not a
    // radio group: a radio cannot be unchosen.
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(<Example value={3} onValueChange={onValueChange} />)

    await user.click(container.querySelectorAll('[role="slider"] > *')[2]!)
    expect(onValueChange).toHaveBeenCalledWith(undefined)
  })

  it('clears the score with Backspace', async () => {
    // The keyboard's way back. Without it the state is reachable only by
    // pointer, which is not a control anyone can use.
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value={3} onValueChange={onValueChange} />)

    await user.tab()
    await user.keyboard('{Backspace}')
    expect(onValueChange).toHaveBeenCalledWith(undefined)
  })

  it('starts scoring from nothing with either arrow', async () => {
    const user = userEvent.setup()
    const forward = vi.fn()
    const { unmount } = render(<Example value={undefined} onValueChange={forward} />)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(forward).toHaveBeenCalledWith(1)
    unmount()

    const back = vi.fn()
    render(<Example value={undefined} onValueChange={back} />)
    await user.tab()
    await user.keyboard('{ArrowLeft}')
    expect(back).toHaveBeenCalledWith(5)
  })

  it('does not step past either end', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value={5} onValueChange={onValueChange} />)

    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenCalledWith(5)
  })

  it('jumps to either end with Home and End', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value={3} onValueChange={onValueChange} />)

    await user.tab()
    await user.keyboard('{Home}')
    expect(onValueChange).toHaveBeenCalledWith(0)
    await user.keyboard('{End}')
    expect(onValueChange).toHaveBeenCalledWith(5)
  })

  it('has one tab stop, and no control nested inside it', () => {
    /* The container is the control. A `<button>` per mark would be a nested
     * interactive element inside a `slider` - axe reports it, and rightly:
     * assistive technology is not promised to announce or reach the inner
     * one. The donor made them `aria-hidden` buttons, which hides them from a
     * reader without making them stop being controls. */
    const { container } = render(<Example value={3} />)
    expect(screen.getByRole('slider').getAttribute('tabindex')).toBe('0')
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(container.querySelectorAll('[role="slider"] > *')).toHaveLength(5)
  })

  it('is inert when disabled', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(
      <RatingScale
        scale={5}
        value={3}
        onValueChange={onValueChange}
        label="Difficulty"
        emptyLabel="Not judged"
        disabled
      />,
    )

    await user.click(container.querySelectorAll('[role="slider"] > *')[0]!)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example value={3} />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe, judged and not', async () => {
    await expectNoA11yViolations(<Example value={3} />)
    await expectNoA11yViolations(<Example value={undefined} />)
  })
})
