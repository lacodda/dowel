// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Slider } from './slider'

/*
 * Slider.
 *
 * The range case is what these are mostly about. Base UI addresses thumbs by
 * index, so a range needs one per value - and the failure when it does not
 * have them is quiet: a handle appears, it moves the first value, and the
 * second is simply unreachable by anyone.
 */

describe('Slider', () => {
  it('is one thumb for one value', () => {
    render(<Slider defaultValue={30} aria-label="Volume" />)
    expect(screen.getAllByRole('slider')).toHaveLength(1)
  })

  it('is two thumbs for a range', () => {
    // The quiet failure this prevents: one handle that moves the first value
    // and leaves the second unreachable.
    render(<Slider defaultValue={[10, 40]} aria-label="Price" />)
    expect(screen.getAllByRole('slider')).toHaveLength(2)
  })

  it('reports each thumb with its own value and the shared range', () => {
    // The thumbs are hidden `<input type="range">`, so the bounds are the
    // native `min`/`max` rather than the ARIA spelling - equivalent, and what
    // a range input actually carries.
    render(<Slider defaultValue={[10, 40]} min={0} max={100} aria-label="Price" />)
    const [low, high] = screen.getAllByRole('slider')
    expect(low!.getAttribute('aria-valuenow')).toBe('10')
    expect(high!.getAttribute('aria-valuenow')).toBe('40')
    expect(low!.getAttribute('min')).toBe('0')
    expect(low!.getAttribute('max')).toBe('100')
  })

  it('names each thumb of a range', () => {
    /* The group's `aria-label` names the pair and leaves the two controls
     * unnamed: axe reports it, and a reader tabbing to the second thumb is
     * told a number and nothing else. */
    render(
      <Slider
        defaultValue={[10, 40]}
        aria-label="Price"
        getThumbLabel={(index) => (index === 0 ? 'Lowest price' : 'Highest price')}
      />,
    )
    expect(screen.getByRole('slider', { name: 'Lowest price' })).toBeDefined()
    expect(screen.getByRole('slider', { name: 'Highest price' })).toBeDefined()
  })

  it('moves with the arrow keys', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Slider defaultValue={30} step={1} onValueChange={onValueChange} aria-label="Volume" />)

    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(onValueChange.mock.calls[0]?.[0]).toBe(31)
  })

  it('gives each thumb of a range its own tab stop', async () => {
    // Two values need two ways in; one stop would make the second reachable
    // only by pointer.
    const user = userEvent.setup()
    render(<Slider defaultValue={[10, 40]} aria-label="Price" />)
    const [low, high] = screen.getAllByRole('slider')

    await user.tab()
    expect(document.activeElement).toBe(low)
    await user.tab()
    expect(document.activeElement).toBe(high)
  })

  it('holds within its range', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Slider defaultValue={100} min={0} max={100} step={1} onValueChange={onValueChange} aria-label="Volume" />,
    )

    await user.tab()
    await user.keyboard('{ArrowRight}')
    const last = onValueChange.mock.calls.at(-1)?.[0]
    expect(last === undefined || last === 100).toBe(true)
  })

  it('jumps to either end with Home and End', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Slider defaultValue={30} min={0} max={100} onValueChange={onValueChange} aria-label="Volume" />)

    await user.tab()
    await user.keyboard('{Home}')
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(0)
    await user.keyboard('{End}')
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(100)
  })

  it('shows the value only when asked', () => {
    const { container: without } = render(<Slider defaultValue={30} aria-label="Volume" />)
    expect(without.textContent).toBe('')

    const { container: with_ } = render(<Slider defaultValue={30} showValue aria-label="Volume" />)
    expect(with_.textContent).toContain('30')
  })

  it('does not fire when disabled', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Slider defaultValue={30} disabled onValueChange={onValueChange} aria-label="Volume" />)

    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Slider defaultValue={[10, 40]} showValue aria-label="Price" />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe, single and range', async () => {
    await expectNoA11yViolations(<Slider defaultValue={30} aria-label="Volume" />)
    await expectNoA11yViolations(
      <Slider
        defaultValue={[10, 40]}
        aria-label="Price"
        getThumbLabel={(index) => (index === 0 ? 'Lowest price' : 'Highest price')}
      />,
    )
  })
})
