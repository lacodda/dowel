// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Segment, SegmentedControl } from './segmented-control'

/*
 * SegmentedControl.
 *
 * The claim is that this is a radio group in segment's clothes, so the tests
 * are about the group: announced as one choice with a name, exactly one
 * option chosen, and the arrows moving the choice the way they do in every
 * other radio group.
 */

function Theme({ onValueChange }: { onValueChange?: (value: string) => void } = {}) {
  return (
    <SegmentedControl aria-label="Theme" defaultValue="dark" onValueChange={onValueChange}>
      <Segment value="light">Light</Segment>
      <Segment value="dark">Dark</Segment>
      <Segment value="system">System</Segment>
    </SegmentedControl>
  )
}

const checked = () =>
  screen
    .getAllByRole('radio')
    .filter((radio) => radio.getAttribute('aria-checked') === 'true')
    .map((radio) => radio.textContent)

describe('SegmentedControl', () => {
  it('is one radio group with a name', () => {
    render(<Theme />)
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeDefined()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('names each option by its words', () => {
    render(<Theme />)
    expect(screen.getByRole('radio', { name: 'System' })).toBeDefined()
  })

  it('holds exactly one choice', async () => {
    render(<Theme />)
    expect(checked()).toEqual(['Dark'])
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }))
    expect(checked()).toEqual(['Light'])
  })

  it('does not let go of the choice when it is pressed again', async () => {
    // The reason this is a radio group and not a toggle group: "no theme" is
    // not a theme.
    render(<Theme />)
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(checked()).toEqual(['Dark'])
  })

  it('reports the value it moved to', async () => {
    const onValueChange = vi.fn()
    render(<Theme onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'System' }))
    expect(onValueChange).toHaveBeenCalledWith('system')
  })

  it('moves and chooses with the arrows, as one stop on Tab', async () => {
    const onValueChange = vi.fn()
    render(
      <>
        <Theme onValueChange={onValueChange} />
        <button type="button">after</button>
      </>,
    )
    await userEvent.tab()
    expect(document.activeElement?.textContent).toBe('Dark')
    await userEvent.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith('system')
    await userEvent.tab()
    expect(document.activeElement?.textContent).toBe('after')
  })

  it('draws the choice from the state that announces it', () => {
    render(<Theme />)
    const dark = screen.getByRole('radio', { name: 'Dark' })
    expect(dark.hasAttribute('data-checked')).toBe(true)
    expect(dark.className).toContain('data-[checked]:bg-raise')
    // Weight as well as the lift: the choice has to survive a screen where
    // the two greys look alike.
    expect(dark.className).toContain('data-[checked]:font-semibold')
  })

  it('keeps its own width inside a column', () => {
    // Found on the stand: inside a FieldGroup the track stretched to the
    // column and ran on past its last segment.
    render(<Theme />)
    expect(screen.getByRole('radiogroup').className).toContain('w-fit')
  })

  it('stands on the small control row, so density reaches it', () => {
    render(<Theme />)
    expect(screen.getByRole('radiogroup').className).toContain('h-control-sm')
  })
})

describe('SegmentedControl, for a reader', () => {
  it('passes axe', async () => {
    await expectNoA11yViolations(<Theme />)
  })
})
