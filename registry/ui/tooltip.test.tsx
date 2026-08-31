// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Button } from './button'
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
  tooltipPopupVariants,
} from './tooltip'

/*
 * Tooltip.
 *
 * The test that earns its place is the keyboard one. A tooltip that opens only
 * on hover is invisible to the person most likely to need it - someone tabbing
 * through a row of icon buttons with no visible labels - and nothing about the
 * component looks wrong when it happens.
 *
 * The queries here go by text rather than by `role`, and that is a finding
 * rather than a convenience: Base UI puts no `role="tooltip"` on the popup and
 * no `aria-describedby` on the trigger. It is deliberate - their own guidance
 * is that a tooltip is a visual aid for sighted mouse and keyboard users, and
 * that the trigger must carry its own `aria-label`. The last test in this file
 * is what holds that line: it asserts the trigger is named without the tooltip.
 */

describe('Tooltip', () => {
  it('is closed until the trigger is reached', () => {
    render(
      <Tooltip>
        <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />} delay={0} />
        <TooltipPopup>Move to the archive</TooltipPopup>
      </Tooltip>,
    )
    expect(screen.queryByText('Move to the archive')).toBeNull()
  })

  it('appears on hover', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip>
        <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />} delay={0} />
        <TooltipPopup>Move to the archive</TooltipPopup>
      </Tooltip>,
    )

    await user.hover(screen.getByRole('button', { name: 'Archive' }))
    await waitFor(() => expect(screen.getByText('Move to the archive')).toBeDefined())
  })

  it('appears on focus, which is the half that gets forgotten', async () => {
    // The reason this component is not just a hover effect. Someone tabbing
    // through a toolbar of icon buttons never hovers anything, and a tooltip
    // that waits for a pointer tells them nothing at all.
    const user = userEvent.setup()
    render(
      <Tooltip>
        <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />} delay={0} />
        <TooltipPopup>Move to the archive</TooltipPopup>
      </Tooltip>,
    )

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Archive' }))
    await waitFor(() => expect(screen.getByText('Move to the archive')).toBeDefined())
  })

  it('goes away when focus leaves', async () => {
    // The other half: a tooltip that stays after the tab has moved on is a
    // label pointing at the wrong control.
    const user = userEvent.setup()
    render(
      <div>
        <Tooltip>
          <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />} delay={0} />
          <TooltipPopup>Move to the archive</TooltipPopup>
        </Tooltip>
        <Button>Next</Button>
      </div>,
    )

    await user.tab()
    await waitFor(() => expect(screen.getByText('Move to the archive')).toBeDefined())
    await user.tab()
    await waitFor(() => expect(screen.queryByText('Move to the archive')).toBeNull())
  })

  it('closes on Escape while the trigger still has focus', async () => {
    // The way out for someone who can see the tooltip covering what they were
    // reading and cannot move the pointer off it.
    const user = userEvent.setup()
    render(
      <Tooltip>
        <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />} delay={0} />
        <TooltipPopup>Move to the archive</TooltipPopup>
      </Tooltip>,
    )

    await user.tab()
    await waitFor(() => expect(screen.getByText('Move to the archive')).toBeDefined())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText('Move to the archive')).toBeNull())
  })

  it('does not rename the control it labels', async () => {
    // A tooltip is not the trigger's accessible name and must not become one.
    // The button is called "Archive" before the tooltip opens and after, so a
    // screen reader user hears the name they were told to look for rather than
    // a longer phrase that happens to be on screen.
    const user = userEvent.setup()
    render(
      <Tooltip>
        <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />} delay={0} />
        <TooltipPopup>Move to the archive</TooltipPopup>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: 'Archive' })
    await user.hover(trigger)
    await waitFor(() => expect(screen.getByText('Move to the archive')).toBeDefined())
    expect(screen.getByRole('button', { name: 'Archive' })).toBe(trigger)
  })

  it('is a visual aid only, so the trigger has to name itself', async () => {
    // The contract this component is sold under, asserted rather than
    // described. Base UI gives the popup no `role="tooltip"` and the trigger
    // no `aria-describedby` - on purpose, because a tooltip cannot be reached
    // on a touch screen. So the tooltip's words are not in the accessibility
    // tree at all, and everything a screen reader gets comes from the
    // trigger's own `aria-label`.
    //
    // If this ever starts failing because Base UI wired the description up,
    // that is good news - but it is a change in what the component promises,
    // and the docs page says the opposite today.
    const user = userEvent.setup()
    render(
      <Tooltip>
        <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />} delay={0} />
        <TooltipPopup>Move to the archive</TooltipPopup>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: 'Archive' })
    await user.hover(trigger)
    const popup = await screen.findByText('Move to the archive')

    expect(popup.getAttribute('role')).toBeNull()
    expect(trigger.getAttribute('aria-describedby')).toBeNull()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shares a delay across a group', async () => {
    // What the provider is for. Two tooltips under one, and the second opens
    // the same way the first did - the grouping is behaviour, not decoration,
    // so it has to survive being wrapped.
    const user = userEvent.setup()
    render(
      <TooltipProvider delay={0}>
        <Tooltip>
          <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />} />
          <TooltipPopup>Move to the archive</TooltipPopup>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="icon" aria-label="Delete" />} />
          <TooltipPopup>Delete for good</TooltipPopup>
        </Tooltip>
      </TooltipProvider>,
    )

    await user.hover(screen.getByRole('button', { name: 'Archive' }))
    await waitFor(() => expect(screen.getByText('Move to the archive')).toBeDefined())
    await user.hover(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.getByText('Delete for good')).toBeDefined())
  })

  it('draws every size, and draws each one differently', () => {
    const base = tooltipPopupVariants({ size: 'nonexistent' as never })
    const sizes = ['sm', 'wide'] as const
    const drawn = new Map(sizes.map((size) => [size, tooltipPopupVariants({ size })]))

    for (const [size, classes] of drawn) {
      expect(classes, `\`${size}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two sizes draw the same').toBe(sizes.length)
  })

  it('keeps its text small', () => {
    // Not decoration. A tooltip sits over the thing it explains, so it has to
    // be readable without taking the page over.
    expect(tooltipPopupVariants({})).toContain('text-xs')
  })

  it('lets the caller win a conflict', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip>
        <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />} delay={0} />
        <TooltipPopup className="rounded-full">Move to the archive</TooltipPopup>
      </Tooltip>,
    )

    await user.hover(screen.getByRole('button', { name: 'Archive' }))
    const popup = await screen.findByText('Move to the archive')
    expect(popup.className).toContain('rounded-full')
  })

  it('carries no colour outside the vocabulary', () => {
    const all = (['sm', 'wide'] as const).map((size) => tooltipPopupVariants({ size })).join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe when open', async () => {
    await expectNoA11yViolations(
      <Tooltip open>
        <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />} delay={0} />
        <TooltipPopup>Move to the archive</TooltipPopup>
      </Tooltip>,
    )
  })
})
