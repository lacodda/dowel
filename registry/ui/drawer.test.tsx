// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Button } from './button'
import {
  Drawer,
  DrawerActions,
  DrawerClose,
  DrawerDescription,
  DrawerPopup,
  DrawerTitle,
  drawerPopupVariants,
} from './drawer'

/*
 * Drawer.
 *
 * It is a modal, so it makes a modal's promises: focus goes in and comes back,
 * `Escape` works, and the page behind it is genuinely out of reach rather than
 * merely covered. Those are what is tested.
 *
 * Which edge it comes from is a class list, and jsdom resolves no layout, so
 * the `side` variant is checked as a class list rather than as a position -
 * the pictures on the stand are what show it actually sliding in from the
 * right. What can be asserted here is that the three sides differ and that
 * each one moves in the axis it claims to.
 */

describe('Drawer', () => {
  it('is closed until something opens it', () => {
    render(
      <Drawer>
        <DrawerPopup>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerPopup>
      </Drawer>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens, and is named by its own title', () => {
    render(
      <Drawer open>
        <DrawerPopup>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerPopup>
      </Drawer>,
    )
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeDefined()
  })

  it('is described by its description', () => {
    render(
      <Drawer open>
        <DrawerPopup>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Narrow the list down.</DrawerDescription>
        </DrawerPopup>
      </Drawer>,
    )
    const drawer = screen.getByRole('dialog')
    const describedBy = drawer.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toBe('Narrow the list down.')
  })

  it('closes on Escape', async () => {
    // The way out that does not need a mouse - and on a drawer it matters
    // more than on a dialog, because the other way out is a swipe.
    const user = userEvent.setup()
    const seen: boolean[] = []
    render(
      <Drawer defaultOpen onOpenChange={(open) => seen.push(open)}>
        <DrawerPopup>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerPopup>
      </Drawer>,
    )

    await user.keyboard('{Escape}')
    await waitFor(() => expect(seen).toContain(false))
  })

  it('closes when something inside asks it to', async () => {
    const user = userEvent.setup()
    const seen: boolean[] = []
    render(
      <Drawer defaultOpen onOpenChange={(open) => seen.push(open)}>
        <DrawerPopup>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerActions>
            <Button render={<DrawerClose />}>Cancel</Button>
          </DrawerActions>
        </DrawerPopup>
      </Drawer>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(seen).toContain(false))
  })

  it('moves focus into itself when it opens', async () => {
    render(
      <Drawer open>
        <DrawerPopup>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerActions>
            <Button>Apply</Button>
          </DrawerActions>
        </DrawerPopup>
      </Drawer>,
    )

    const drawer = screen.getByRole('dialog')
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true))
  })

  it('puts the page behind it out of reach', async () => {
    // The half that gets forgotten. A drawer covers only one edge of the
    // screen, so it looks like the rest of the page is still usable - and it
    // must not be, or Tab walks off into a page the user cannot see they are
    // editing.
    const user = userEvent.setup()
    render(
      <div>
        <button type="button">behind the scrim</button>
        <Drawer open>
          <DrawerPopup>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerActions>
              <Button render={<DrawerClose />}>Cancel</Button>
              <Button variant="primary">Apply</Button>
            </DrawerActions>
          </DrawerPopup>
        </Drawer>
      </div>,
    )

    const outside = screen.getByText('behind the scrim')
    expect(screen.queryByRole('button', { name: 'behind the scrim' })).toBeNull()

    for (let i = 0; i < 8; i++) {
      await user.tab()
      expect(document.activeElement, `Tab ${i + 1} landed behind the scrim`).not.toBe(outside)
    }
  })

  it('draws every side, and draws each one differently', () => {
    const base = drawerPopupVariants({ side: 'nonexistent' as never })
    const sides = ['right', 'left', 'bottom'] as const
    const drawn = new Map(sides.map((side) => [side, drawerPopupVariants({ side })]))

    for (const [side, classes] of drawn) {
      expect(classes, `\`${side}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two sides draw the same').toBe(sides.length)
  })

  it('slides along the axis each side claims', () => {
    // The one thing about the drawing worth asserting without a layout: a
    // side-mounted drawer has to move in X and a bottom sheet in Y. Getting
    // these crossed produces a panel that slides in from the wrong place
    // entirely, and every other test here still passes.
    expect(drawerPopupVariants({ side: 'right' })).toContain('translateX(100%)')
    expect(drawerPopupVariants({ side: 'left' })).toContain('translateX(-100%)')
    expect(drawerPopupVariants({ side: 'bottom' })).toContain('translateY(100%)')
  })

  it('comes from the right unless told otherwise', () => {
    expect(drawerPopupVariants({})).toBe(drawerPopupVariants({ side: 'right' }))
  })

  it('lets the caller win a conflict', () => {
    render(
      <Drawer open>
        <DrawerPopup className="rounded-full">
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerPopup>
      </Drawer>,
    )
    expect(screen.getByRole('dialog').className).toContain('rounded-full')
  })

  it('carries no colour outside the vocabulary', () => {
    const all = (['right', 'left', 'bottom'] as const)
      .map((side) => drawerPopupVariants({ side }))
      .join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe when open', async () => {
    await expectNoA11yViolations(
      <Drawer open>
        <DrawerPopup>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Narrow the list down.</DrawerDescription>
          <DrawerActions>
            <Button render={<DrawerClose />}>Cancel</Button>
            <Button variant="primary">Apply</Button>
          </DrawerActions>
        </DrawerPopup>
      </Drawer>,
    )
  })
})
