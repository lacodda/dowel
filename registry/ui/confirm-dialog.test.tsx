// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Button } from './button'
import {
  ConfirmDialog,
  ConfirmDialogActions,
  ConfirmDialogClose,
  ConfirmDialogDescription,
  ConfirmDialogPopup,
  ConfirmDialogTitle,
  confirmDialogPopupVariants,
} from './confirm-dialog'

/*
 * ConfirmDialog.
 *
 * Almost the same tests as Dialog, and the two that differ are the reason the
 * component exists: the role it announces, and the fact that neither `Escape`
 * nor a click outside gets rid of it. Those two are asserted rather than
 * assumed - they are the whole difference, and a Base UI release that quietly
 * made this dismissible would otherwise pass every other check here.
 */

describe('ConfirmDialog', () => {
  it('is closed until something opens it', () => {
    render(
      <ConfirmDialog>
        <ConfirmDialogPopup>
          <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
        </ConfirmDialogPopup>
      </ConfirmDialog>,
    )
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('announces itself as an alert dialog, not a dialog', () => {
    // The semantic difference, and the only one a screen reader can hear.
    // `alertdialog` tells it the popup is interrupting and that its
    // description should be read without being asked for.
    render(
      <ConfirmDialog open>
        <ConfirmDialogPopup>
          <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
        </ConfirmDialogPopup>
      </ConfirmDialog>,
    )
    expect(screen.getByRole('alertdialog', { name: 'Delete the project?' })).toBeDefined()
  })

  it('is described by its description', () => {
    render(
      <ConfirmDialog open>
        <ConfirmDialogPopup>
          <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
          <ConfirmDialogDescription>Everything in it goes too.</ConfirmDialogDescription>
        </ConfirmDialogPopup>
      </ConfirmDialog>,
    )
    const dialog = screen.getByRole('alertdialog')
    const describedBy = dialog.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toBe('Everything in it goes too.')
  })

  it('still closes on Escape', async () => {
    // Worth pinning down, because it is the half of "not dismissible" that is
    // not true. Base UI forces `modal` and `disablePointerDismissal` for an
    // alert dialog but leaves the escape key alone, and it is right to: a
    // popup with no keyboard way out is a trap, and `Escape` is a deliberate
    // keypress in a way that clicking beside a dialog is not.
    const user = userEvent.setup()
    const seen: boolean[] = []
    render(
      <ConfirmDialog defaultOpen onOpenChange={(open) => seen.push(open)}>
        <ConfirmDialogPopup>
          <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
          <ConfirmDialogActions>
            <Button render={<ConfirmDialogClose />}>Cancel</Button>
          </ConfirmDialogActions>
        </ConfirmDialogPopup>
      </ConfirmDialog>,
    )

    await user.keyboard('{Escape}')
    await waitFor(() => expect(seen).toContain(false))
  })

  it('does not close on a press outside itself', async () => {
    // Where it parts company with Dialog, and the difference that survives:
    // clicking beside a dialog is how people dismiss one absentmindedly, and
    // an irreversible choice should not be answerable absentmindedly. There is
    // no prop that turns this back on - `AlertDialog.Root` omits
    // `disablePointerDismissal` from Dialog's props and forces it true.
    const user = userEvent.setup()
    const seen: boolean[] = []
    render(
      <ConfirmDialog defaultOpen onOpenChange={(open) => seen.push(open)}>
        <ConfirmDialogPopup>
          <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
          <ConfirmDialogActions>
            <Button render={<ConfirmDialogClose />}>Cancel</Button>
          </ConfirmDialogActions>
        </ConfirmDialogPopup>
      </ConfirmDialog>,
    )

    await user.click(document.body)
    expect(seen).toEqual([])
    expect(screen.getByRole('alertdialog')).toBeDefined()
  })

  it('closes when something inside asks it to', async () => {
    // The only way out, which is why the close has to be there.
    const user = userEvent.setup()
    const seen: boolean[] = []
    render(
      <ConfirmDialog defaultOpen onOpenChange={(open) => seen.push(open)}>
        <ConfirmDialogPopup>
          <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
          <ConfirmDialogActions>
            <Button render={<ConfirmDialogClose />}>Cancel</Button>
          </ConfirmDialogActions>
        </ConfirmDialogPopup>
      </ConfirmDialog>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(seen).toContain(false))
  })

  it('moves focus into itself when it opens', async () => {
    render(
      <ConfirmDialog open>
        <ConfirmDialogPopup>
          <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
          <ConfirmDialogActions>
            <Button render={<ConfirmDialogClose />}>Cancel</Button>
          </ConfirmDialogActions>
        </ConfirmDialogPopup>
      </ConfirmDialog>,
    )

    const dialog = screen.getByRole('alertdialog')
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  })

  it('puts the page behind it out of reach', async () => {
    // A confirm dialog that can be tabbed out of is worse than a dialog that
    // can: there is a question on screen and the keyboard is answering
    // something else.
    const user = userEvent.setup()
    render(
      <div>
        <button type="button">behind the scrim</button>
        <ConfirmDialog open>
          <ConfirmDialogPopup>
            <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
            <ConfirmDialogActions>
              <Button render={<ConfirmDialogClose />}>Cancel</Button>
              <Button variant="danger">Delete</Button>
            </ConfirmDialogActions>
          </ConfirmDialogPopup>
        </ConfirmDialog>
      </div>,
    )

    const outside = screen.getByText('behind the scrim')
    expect(screen.queryByRole('button', { name: 'behind the scrim' })).toBeNull()

    // The trap is set when focus lands inside, not when the popup renders.
    // Tabbing before that races it: on a fast machine the first press happens
    // while focus is still on the page underneath, and walks straight onto the
    // button below - which is what CI caught on Linux while Windows passed.
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))

    for (let i = 0; i < 8; i++) {
      await user.tab()
      expect(document.activeElement, `Tab ${i + 1} landed behind the scrim`).not.toBe(outside)
    }
  })

  it('draws every size, and draws each one differently', () => {
    const base = confirmDialogPopupVariants({ size: 'nonexistent' as never })
    const sizes = ['sm', 'md', 'lg'] as const
    const drawn = new Map(sizes.map((size) => [size, confirmDialogPopupVariants({ size })]))

    for (const [size, classes] of drawn) {
      expect(classes, `\`${size}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two sizes draw the same').toBe(sizes.length)
  })

  it('lets the caller win a conflict', () => {
    render(
      <ConfirmDialog open>
        <ConfirmDialogPopup className="rounded-full">
          <ConfirmDialogTitle>Title</ConfirmDialogTitle>
        </ConfirmDialogPopup>
      </ConfirmDialog>,
    )
    expect(screen.getByRole('alertdialog').className).toContain('rounded-full')
  })

  it('carries no colour outside the vocabulary', () => {
    const all = (['sm', 'md', 'lg'] as const)
      .map((size) => confirmDialogPopupVariants({ size }))
      .join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe when open', async () => {
    await expectNoA11yViolations(
      <ConfirmDialog open>
        <ConfirmDialogPopup>
          <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
          <ConfirmDialogDescription>Everything in it goes too.</ConfirmDialogDescription>
          <ConfirmDialogActions>
            <Button render={<ConfirmDialogClose />}>Cancel</Button>
            <Button variant="danger">Delete</Button>
          </ConfirmDialogActions>
        </ConfirmDialogPopup>
      </ConfirmDialog>,
    )
  })
})
