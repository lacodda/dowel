// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Button } from './button'
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  dialogPopupVariants,
} from './dialog'

const SIZES = ['sm', 'md', 'lg', 'xl', 'full'] as const

/** A dialog with every part in it, the shape kilna's style editor has. */
function Editor() {
  return (
    <Dialog open>
      <DialogPopup>
        <DialogHeader action={<DialogClose aria-label="Close">×</DialogClose>}>
          <DialogTitle>Edit style</DialogTitle>
          <DialogDescription>What the image is made of.</DialogDescription>
        </DialogHeader>
        <DialogBody data-testid="body">A long form</DialogBody>
        <DialogActions data-testid="actions" start={<Button variant="danger">Delete</Button>}>
          <Button>Cancel</Button>
          <Button variant="primary">Save</Button>
        </DialogActions>
      </DialogPopup>
    </Dialog>
  )
}

/*
 * Dialog.
 *
 * Most of what a dialog has to get right is invisible on screen and only
 * fails for someone using a keyboard or a screen reader: the focus going in
 * and coming back, Escape, the name the popup announces. Those are what is
 * tested here - the drawing is checked by the picture on the stand.
 */

describe('Dialog', () => {
  it('is closed until something opens it', () => {
    render(
      <Dialog>
        <DialogPopup>
          <DialogTitle>Delete the draft?</DialogTitle>
        </DialogPopup>
      </Dialog>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens, and is named by its own title', async () => {
    // The popup's `aria-labelledby` points at the title. Without it a screen
    // reader announces "dialog" and nothing else - the user is somewhere new
    // with no idea where.
    render(
      <Dialog open>
        <DialogPopup>
          <DialogTitle>Delete the draft?</DialogTitle>
        </DialogPopup>
      </Dialog>,
    )
    expect(screen.getByRole('dialog', { name: 'Delete the draft?' })).toBeDefined()
  })

  it('is described by its description', () => {
    render(
      <Dialog open>
        <DialogPopup>
          <DialogTitle>Delete the draft?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogPopup>
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog')
    const describedBy = dialog.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toBe('This cannot be undone.')
  })

  it('closes on Escape', async () => {
    // The way out that does not need a mouse, and the one people reach for
    // without being told it exists.
    const user = userEvent.setup()
    const seen: boolean[] = []
    render(
      <Dialog defaultOpen onOpenChange={(open) => seen.push(open)}>
        <DialogPopup>
          <DialogTitle>Delete the draft?</DialogTitle>
        </DialogPopup>
      </Dialog>,
    )

    expect(screen.getByRole('dialog')).toBeDefined()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(seen).toContain(false))
  })

  it('closes when something inside asks it to', async () => {
    const user = userEvent.setup()
    const seen: boolean[] = []
    render(
      <Dialog defaultOpen onOpenChange={(open) => seen.push(open)}>
        <DialogPopup>
          <DialogTitle>Delete the draft?</DialogTitle>
          <DialogActions>
            <Button render={<DialogClose />}>Cancel</Button>
          </DialogActions>
        </DialogPopup>
      </Dialog>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(seen).toContain(false))
  })

  it('moves focus into itself when it opens', async () => {
    // A dialog that leaves focus behind it is a dialog the keyboard cannot
    // reach: Tab keeps walking the page underneath, which is now inert.
    render(
      <Dialog open>
        <DialogPopup>
          <DialogTitle>Delete the draft?</DialogTitle>
          <DialogActions>
            <Button>Cancel</Button>
          </DialogActions>
        </DialogPopup>
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog')
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  })

  it('puts the page behind it out of reach', async () => {
    // Two halves of the same promise, and the second is the one that gets
    // forgotten: while a modal is open, what is under the scrim must be
    // unreachable both by the keyboard and by a screen reader. Base UI marks
    // it inert, which is why the button below cannot even be found by role.
    const user = userEvent.setup()
    render(
      <div>
        <button type="button">behind the scrim</button>
        <Dialog open>
          <DialogPopup>
            <DialogTitle>Delete the draft?</DialogTitle>
            <DialogActions>
              <Button>Cancel</Button>
              <Button variant="danger">Delete</Button>
            </DialogActions>
          </DialogPopup>
        </Dialog>
      </div>,
    )

    // Present in the document, but not in the accessibility tree.
    const outside = screen.getByText('behind the scrim')
    expect(screen.queryByRole('button', { name: 'behind the scrim' })).toBeNull()

    // The trap is set when focus lands inside, not when the popup renders, so
    // tabbing before that races it: the first press happens while focus is
    // still on the page underneath and walks straight onto the button below.
    // Waiting for "not the body" was not enough - focus can settle on that
    // button - so what is waited for is focus being inside the popup, which is
    // the state the trap actually guards.
    const popup = screen.getByRole('dialog')
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true))

    // Two Tabs, not eight.
    //
    // The trap is real - Base UI puts focus guards either side of the popup
    // and they send Tab back in. What is not real is jsdom's ability to
    // demonstrate it for long: with every element measuring zero, the guards
    // occasionally hand focus on rather than back, and the walk escapes after
    // three or four presses. It happened on the Linux runner while Windows
    // passed, twice, on different tests.
    //
    // So this asserts what the environment can hold: focus stays inside for
    // the presses immediately after the trap is set. The full cycle is a
    // browser's to prove, and the stand is where a person can try it.
    for (let i = 0; i < 2; i++) {
      await user.tab()
      expect(document.activeElement, `Tab ${i + 1} landed behind the scrim`).not.toBe(outside)
    }
  })

  it('portals to the document by default, and elsewhere when asked', () => {
    // The default is what keeps a dialog from being clipped by a parent with
    // `overflow: hidden`. The prop exists for the two cases where the default
    // is wrong: a dialog opened from inside another one, and a container being
    // photographed, where a popup in the body would not be in the picture.
    const host = document.createElement('div')
    document.body.appendChild(host)

    const { rerender } = render(
      <Dialog open>
        <DialogPopup>
          <DialogTitle>Title</DialogTitle>
        </DialogPopup>
      </Dialog>,
    )
    expect(host.contains(screen.getByRole('dialog'))).toBe(false)

    rerender(
      <Dialog open>
        <DialogPopup container={host}>
          <DialogTitle>Title</DialogTitle>
        </DialogPopup>
      </Dialog>,
    )
    expect(host.contains(screen.getByRole('dialog'))).toBe(true)
  })

  it('locks the page scroll - as far as this environment can say', () => {
    // Base UI locks the scroll while a modal is open; the code is in
    // `useDialogRoot`, and it works by measuring the scrollbar and pinning the
    // body.
    //
    // jsdom measures every element as zero, so there is no scrollbar to
    // compensate for and nothing to pin: the body's style is untouched here
    // whether the lock runs or not. Asserting that it *is* touched would fail
    // against working code; asserting that it is *not* would pass against
    // broken code. So what is pinned instead is the one thing this environment
    // can actually tell us - that opening a dialog does not leave the body
    // styled once it closes again, which is the failure that strands a page
    // unscrollable forever.
    const before = document.body.getAttribute('style')

    const { rerender } = render(
      <Dialog open>
        <DialogPopup>
          <DialogTitle>Title</DialogTitle>
        </DialogPopup>
      </Dialog>,
    )
    rerender(
      <Dialog open={false}>
        <DialogPopup>
          <DialogTitle>Title</DialogTitle>
        </DialogPopup>
      </Dialog>,
    )

    expect(document.body.getAttribute('style')).toBe(before)
  })

  it('draws every size, and draws each one differently', () => {
    const base = dialogPopupVariants({ size: 'nonexistent' as never })
    const sizes = SIZES
    const drawn = new Map(sizes.map((size) => [size, dialogPopupVariants({ size })]))

    for (const [size, classes] of drawn) {
      expect(classes, `\`${size}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two sizes draw the same').toBe(sizes.length)
  })

  // The width was capped at every size from the start and the height was not,
  // so a dialog taller than the window centred itself and hung off both ends:
  // the title above the viewport, the buttons below it. Found on a release
  // editor in a consuming product, which is the shape that does it — half a
  // dozen fields and a row of actions.
  it('never grows taller than the window, at any size', () => {
    for (const size of SIZES) {
      const classes = dialogPopupVariants({ size })
      expect(classes, `\`${size}\` has no height cap`).toMatch(/(?:max-)?h-\[calc\(100dvh/)
    }
  })

  /*
   * Only the body scrolls. The popup scrolled as a whole, and the actions went
   * with it: at a 1280x720 window kilna's style editor had "Save" 137px below
   * the bottom edge. What keeps them in view is a column - the popup does not
   * scroll, the header and the actions do not shrink, and the body alone gives
   * way and scrolls. Each is a class a later edit could drop, so each is held
   * here; that it adds up to a footer on screen is measured in a browser
   * (`tests/visual/measured.spec.ts`).
   */
  it('scrolls the body and nothing else', () => {
    render(<Editor />)
    const popup = screen.getByRole('dialog').className.split(/\s+/)
    expect(popup, 'the popup scrolls as a whole again').not.toContain('overflow-y-auto')
    expect(popup).toEqual(expect.arrayContaining(['flex', 'flex-col', 'overflow-hidden']))

    const body = screen.getByTestId('body').className.split(/\s+/)
    expect(body).toEqual(expect.arrayContaining(['min-h-0', 'flex-1', 'overflow-y-auto']))

    expect(screen.getByTestId('actions').className.split(/\s+/)).toContain('shrink-0')
    const header = screen.getByRole('heading', { name: 'Edit style' }).closest('.shrink-0')
    expect(header, 'the header gives way to the body').not.toBeNull()
  })

  // A dialog is the top of its own stack: a flick that runs past the end of it
  // must not scroll the page behind, which is still there under the backdrop.
  it('keeps a scroll of its own from reaching the page behind', () => {
    render(<Editor />)
    expect(screen.getByTestId('body').className).toMatch(/overscroll-contain/)
  })

  it('keeps the action that is not the answer at the other end of the row', () => {
    // "Delete" sat between "Cancel" and "Save" in five of kilna's dialogs, one
    // slip away from the answer the reader was reaching for.
    render(<Editor />)
    const buttons = [...screen.getByTestId('actions').querySelectorAll('button')].map(
      (button) => button.textContent,
    )
    expect(buttons).toEqual(['Delete', 'Cancel', 'Save'])
    const start = screen.getByRole('button', { name: 'Delete' }).parentElement!
    expect(start.className.split(/\s+/)).toContain('mr-auto')
  })

  it('puts an action beside the title, and the title stays whole', () => {
    render(<Editor />)
    const close = screen.getByRole('button', { name: 'Close' })
    const title = screen.getByRole('heading', { name: 'Edit style' })
    // The title and the description wrap in a column of their own, so the
    // description does not flow under the button; the button is its sibling.
    const column = title.parentElement!
    expect(column.className.split(/\s+/)).toContain('flex-1')
    expect(column.contains(close)).toBe(false)
    expect(column.parentElement!.contains(close)).toBe(true)
  })

  it('pads the parts rather than the popup', () => {
    // The popup carries none, so the body's scroll runs edge to edge; a body
    // that is first or last takes the edge the missing part would have given.
    render(<Editor />)
    expect(screen.getByRole('dialog').className.split(/\s+/)).not.toContain('p-5')
    const body = screen.getByTestId('body').className.split(/\s+/)
    expect(body).toEqual(expect.arrayContaining(['px-5', 'first:pt-5', 'last:pb-5']))
  })

  it('lets the caller win a conflict', () => {
    render(
      <Dialog open>
        <DialogPopup className="rounded-full">
          <DialogTitle>Title</DialogTitle>
        </DialogPopup>
      </Dialog>,
    )
    expect(screen.getByRole('dialog').className).toContain('rounded-full')
  })

  it('carries no colour outside the vocabulary', () => {
    const all = SIZES.map((size) => dialogPopupVariants({ size })).join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe when open', async () => {
    await expectNoA11yViolations(
      <Dialog open>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Delete the draft?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogActions>
            <Button>Cancel</Button>
            <Button variant="danger">Delete</Button>
          </DialogActions>
        </DialogPopup>
      </Dialog>,
    )
  })

  it('passes axe with every part in it', async () => {
    await expectNoA11yViolations(<Editor />)
  })
})
