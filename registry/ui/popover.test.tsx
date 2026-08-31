// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Button } from './button'
import {
  Popover,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
  popoverPopupVariants,
} from './popover'

/*
 * Popover.
 *
 * What is tested is what fails silently for a keyboard or a screen reader: the
 * trigger's `aria-expanded`, the name the panel announces, the way in and the
 * way back out. Where it lands on screen is Floating UI's job and needs a real
 * layout to mean anything - jsdom measures everything as zero - so that is
 * left to the pictures on the stand.
 */

describe('Popover', () => {
  it('is closed until something opens it', () => {
    render(
      <Popover>
        <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
        </PopoverPopup>
      </Popover>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens from its trigger, by keyboard', async () => {
    // A popover reachable only by mouse is a popover half the users cannot
    // open. The trigger is a button, so Enter has to work on it.
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
        </PopoverPopup>
      </Popover>,
    )

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Filters' }))
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Filters' })).toBeDefined())
  })

  it('says on the trigger whether it is open', async () => {
    // `aria-expanded` is the only way a screen reader learns that pressing
    // this button revealed something, rather than doing something.
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
        </PopoverPopup>
      </Popover>,
    )

    const trigger = screen.getByRole('button', { name: 'Filters' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await user.click(trigger)
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'))
  })

  it('is named by its own title and described by its description', () => {
    render(
      <Popover open>
        <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
          <PopoverDescription>Narrow the list down.</PopoverDescription>
        </PopoverPopup>
      </Popover>,
    )

    const popup = screen.getByRole('dialog', { name: 'Filters' })
    const describedBy = popup.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toBe('Narrow the list down.')
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const seen: boolean[] = []
    render(
      <Popover defaultOpen onOpenChange={(open) => seen.push(open)}>
        <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
        </PopoverPopup>
      </Popover>,
    )

    await user.keyboard('{Escape}')
    await waitFor(() => expect(seen).toContain(false))
  })

  it('closes when something inside asks it to', async () => {
    const user = userEvent.setup()
    const seen: boolean[] = []
    render(
      <Popover defaultOpen onOpenChange={(open) => seen.push(open)}>
        <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
          <Button render={<PopoverClose />}>Done</Button>
        </PopoverPopup>
      </Popover>,
    )

    await user.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(seen).toContain(false))
  })

  it('leaves the page behind it reachable', async () => {
    // The difference from Dialog that matters, and the one that is invisible:
    // a popover is not modal. What is underneath stays in the accessibility
    // tree and stays clickable, because a filter panel is not a decision the
    // page has to wait on.
    render(
      <div>
        <button type="button">still here</button>
        <Popover open>
          <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
          <PopoverPopup>
            <PopoverTitle>Filters</PopoverTitle>
          </PopoverPopup>
        </Popover>
      </div>,
    )

    expect(screen.getByRole('button', { name: 'still here' })).toBeDefined()
  })

  it('takes the content that was given to it', () => {
    render(
      <Popover open>
        <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
          <Button>Reset</Button>
        </PopoverPopup>
      </Popover>,
    )
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDefined()
  })

  it('draws every size, and draws each one differently', () => {
    const base = popoverPopupVariants({ size: 'nonexistent' as never })
    const sizes = ['sm', 'md', 'lg'] as const
    const drawn = new Map(sizes.map((size) => [size, popoverPopupVariants({ size })]))

    for (const [size, classes] of drawn) {
      expect(classes, `\`${size}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two sizes draw the same').toBe(sizes.length)
  })

  it('lets the caller win a conflict', () => {
    render(
      <Popover open>
        <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
        <PopoverPopup className="rounded-full">
          <PopoverTitle>Filters</PopoverTitle>
        </PopoverPopup>
      </Popover>,
    )
    expect(screen.getByRole('dialog').className).toContain('rounded-full')
  })

  it('carries no colour outside the vocabulary', () => {
    const all = (['sm', 'md', 'lg'] as const)
      .map((size) => popoverPopupVariants({ size }))
      .join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe when open', async () => {
    await expectNoA11yViolations(
      <Popover open>
        <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
          <PopoverDescription>Narrow the list down.</PopoverDescription>
          <Button render={<PopoverClose />}>Done</Button>
        </PopoverPopup>
      </Popover>,
    )
  })
})
