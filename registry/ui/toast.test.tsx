// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toastVariants,
  useToastManager,
} from './toast'

/*
 * Toast.
 *
 * There is nothing to render on its own: a toast exists because something
 * raised it, so every test here goes through the manager, which is also how a
 * product uses it. The harness is the smallest thing that is still the real
 * arrangement - a provider, a button that raises one, a portalled viewport,
 * and a list mapping what the manager holds onto `Toast`.
 *
 * What is worth pinning is the announcement and the vocabulary.
 *
 * The announcement first: `Toast.Root` is `role="dialog"` inside a
 * `role="region"` viewport, and that nesting is what a screen reader is told
 * about. Assert either half alone and the test passes over the wrong thing -
 * a dialog floating outside any live region is announced once and then lost,
 * and a region with no dialog in it is a box with text in it.
 *
 * Then the vocabulary: `type` is Base UI's word for what happened and `tone`
 * is dowel's word for how it looks, and the map between them exists so a
 * product calling `manager.add({ type: 'success' })` does not also have to
 * say which colour that is. Both directions are checked - the map applies,
 * and an explicit `tone` still wins - because a map that could not be
 * overridden would be a component with an opinion instead of a default.
 *
 * `timeout: 0` throughout. Base UI's auto-dismiss is real and works, but
 * pinning it here would be pinning fake timers rather than the component, and
 * a toast that vanishes mid-assertion makes every other test in the file
 * flake. What is exercised is dismissal by the reader, which is the path that
 * has a button and a label in it.
 */

const TONES = ['neutral', 'good', 'warn', 'bad', 'info'] as const

/** The manager's `add`, wired to a button, because that is the only way a
 * toast comes into being. Everything the test wants to vary goes through it. */
function Raise({ options }: { options: Parameters<ReturnType<typeof useToastManager>['add']>[0] }) {
  const manager = useToastManager()
  return (
    <button type="button" onClick={() => manager.add({ timeout: 0, ...options })}>
      Raise
    </button>
  )
}

/** The list. A product writes exactly this: map what the manager holds, and
 * hand each one to `Toast`. */
function List({ tone }: { tone?: (typeof TONES)[number] } = {}) {
  const { toasts } = useToastManager()
  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} tone={tone}>
          <ToastTitle />
          <ToastDescription />
          <ToastAction>Undo</ToastAction>
          <ToastClose aria-label="Dismiss" />
        </Toast>
      ))}
    </>
  )
}

function Example({
  options = {},
  tone,
  container,
}: {
  options?: Parameters<ReturnType<typeof useToastManager>['add']>[0]
  tone?: (typeof TONES)[number]
  container?: HTMLElement
} = {}) {
  return (
    <ToastProvider>
      <Raise options={options} />
      <ToastViewport container={container}>
        <List tone={tone} />
      </ToastViewport>
    </ToastProvider>
  )
}

/** Press the button that raises one, and wait until it is there. */
async function raise(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Raise' }))
  return await screen.findByRole('dialog')
}

describe('Toast', () => {
  it('appears when something raises it, with what it was given', async () => {
    const user = userEvent.setup()
    render(<Example options={{ title: 'Saved', description: 'Two axes changed.' }} />)

    // Nothing before it is raised: the viewport is drawn from the start, so
    // an empty queue must not leave a toast-shaped hole in it.
    expect(screen.queryByRole('dialog')).toBeNull()

    const toast = await raise(user)
    expect(toast.textContent).toContain('Saved')
    expect(toast.textContent).toContain('Two axes changed.')
  })

  it('is a dialog inside a live region, which is what gets it announced', async () => {
    // Both halves at once - see the note at the top. The region is Base UI's
    // viewport and the dialog is the toast; either without the other is a
    // toast nobody hears.
    const user = userEvent.setup()
    render(<Example options={{ title: 'Saved' }} />)

    const toast = await raise(user)
    const region = screen.getByRole('region')
    expect(region.contains(toast), 'the toast is not inside the viewport').toBe(true)
    expect(region.getAttribute('aria-live')).toBe('polite')
  })

  it('is named and described by its own title and sentence', async () => {
    // `aria-labelledby` and `aria-describedby` are what turn the two lines
    // into one announcement instead of two stray strings inside a dialog.
    const user = userEvent.setup()
    render(<Example options={{ title: 'Saved', description: 'Two axes changed.' }} />)

    const toast = await raise(user)
    const labelledBy = toast.getAttribute('aria-labelledby')
    const describedBy = toast.getAttribute('aria-describedby')
    expect(document.getElementById(labelledBy ?? '')?.textContent).toBe('Saved')
    expect(document.getElementById(describedBy ?? '')?.textContent).toBe('Two axes changed.')
  })

  it('hides the close button until the reader is at the stack', async () => {
    // Base UI's own behaviour, and worth knowing about before the next test
    // reads oddly: `ToastClose` is `aria-hidden` while the viewport is
    // neither hovered nor focused. A collapsed stack is one announcement, not
    // one announcement plus a dismiss button per toast, and the toast goes
    // away on its own anyway - the cross is for the reader who has come over
    // to deal with it.
    const user = userEvent.setup()
    render(<Example options={{ title: 'Saved' }} />)

    await raise(user)
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull()

    await user.hover(screen.getByRole('region'))
    expect(await screen.findByRole('button', { name: 'Dismiss' })).toBeDefined()
  })

  it('is dismissed by the close button, which is announced by its label', async () => {
    // The label is the point. The button draws a cross and nothing else, so
    // without a word a screen reader announces it as "button" - and the only
    // control on the toast becomes unusable to the reader most likely to
    // want it gone. `hover` first for the reason above; in a browser that is
    // the mouse arriving at the stack, and jsdom fires the same event.
    const user = userEvent.setup()
    render(<Example options={{ title: 'Saved' }} />)

    await raise(user)
    await user.hover(screen.getByRole('region'))
    await user.click(await screen.findByRole('button', { name: 'Dismiss' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('runs the action it was given', async () => {
    // The undo case, which is the only reason a toast has a button that is
    // not a dismiss.
    const user = userEvent.setup()
    const undone: string[] = []

    function WithAction() {
      const manager = useToastManager()
      return (
        <>
          <button type="button" onClick={() => manager.add({ timeout: 0, title: 'Deleted' })}>
            Raise
          </button>
          <ToastViewport>
            {manager.toasts.map((toast) => (
              <Toast key={toast.id} toast={toast}>
                <ToastTitle />
                <ToastAction onClick={() => undone.push(String(toast.title))}>Undo</ToastAction>
              </Toast>
            ))}
          </ToastViewport>
        </>
      )
    }

    render(
      <ToastProvider>
        <WithAction />
      </ToastProvider>,
    )

    await raise(user)
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(undone).toEqual(['Deleted'])
  })

  it('takes the tone from the type, so the caller names it once', async () => {
    // `manager.add({ type: 'success' })` is what a product writes; it should
    // not also have to know that success is `good`.
    const user = userEvent.setup()
    render(<Example options={{ title: 'Saved', type: 'success' }} />)

    const toast = await raise(user)
    expect(toast.className).toContain('before:bg-good')
  })

  it('maps every type it knows, and leaves one it does not alone', async () => {
    // The whole map in one pass, and the fallback: a product's own `type`
    // string - Base UI takes any - must come out neutral rather than
    // undefined-coloured or crashing.
    const cases = [
      ['success', 'before:bg-good'],
      ['warning', 'before:bg-warn'],
      ['error', 'before:bg-bad'],
      ['info', 'before:bg-info'],
      ['loading', 'before:bg-info'],
      ['export-finished', 'before:bg-line-2'],
    ] as const

    for (const [type, expected] of cases) {
      const user = userEvent.setup()
      const { unmount } = render(<Example options={{ title: 'Saved', type }} />)
      const toast = await raise(user)
      expect(toast.className, `\`${type}\` did not draw \`${expected}\``).toContain(expected)
      unmount()
    }
  })

  it('lets an explicit tone beat the type', async () => {
    // A default that could not be overridden would be an opinion. A product
    // that raises a `loading` toast it wants read as a warning says so.
    const user = userEvent.setup()
    render(<Example options={{ title: 'Still going', type: 'loading' }} tone="warn" />)

    const toast = await raise(user)
    expect(toast.className).toContain('before:bg-warn')
    expect(toast.className).not.toContain('before:bg-info')
  })

  it('draws every tone, and draws each one differently', () => {
    const base = toastVariants({ tone: 'nonexistent' as never })
    const drawn = new Map(TONES.map((tone) => [tone, toastVariants({ tone })]))

    for (const [tone, classes] of drawn) {
      expect(classes, `\`${tone}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two tones draw the same').toBe(TONES.length)
  })

  it('carries no colour outside the vocabulary', () => {
    const all = TONES.map((tone) => toastVariants({ tone })).join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', async () => {
    const user = userEvent.setup()
    render(<Example options={{ title: 'Saved' }} tone="good" />)
    const toast = await raise(user)
    expect(toast.className).toContain('before:bg-good')
  })
})

describe('Toast, for a reader', () => {
  it('passes axe with one raised, collapsed and engaged', async () => {
    // The viewport is portalled, so it is not inside what `render` returns -
    // which is why it is pointed at a container of its own and axe is run
    // over that.
    //
    // Both states, because they are different trees: collapsed, the close
    // button is `aria-hidden`; hovered, it is not. Checking only one would
    // leave the other unexamined.
    const host = document.createElement('div')
    document.body.appendChild(host)

    const user = userEvent.setup()
    await expectNoA11yViolations(
      <Example
        options={{ title: 'Saved', description: 'Two axes changed.' }}
        container={host}
      />,
    )
    const toast = await raise(user)

    // Checked before axe runs, and not decoration: axe over an empty node
    // finds nothing and reports a pass. Without this the test would go on
    // being green if `container` were ever dropped on the way to the portal,
    // which is the whole thing it is here to exercise.
    expect(host.contains(toast), 'the toast did not land in the container').toBe(true)

    const axe = await import('axe-core').then((module) => module.default)
    const collapsed = await axe.run(host)
    expect(collapsed.violations, JSON.stringify(collapsed.violations.map((v) => v.id))).toEqual([])

    await user.hover(screen.getByRole('region'))
    await screen.findByRole('button', { name: 'Dismiss' })
    const engaged = await axe.run(host)
    expect(engaged.violations, JSON.stringify(engaged.violations.map((v) => v.id))).toEqual([])

    host.remove()
  })

  it('leaves one question axe cannot answer here, and it is a known one', async () => {
    // Honest about the hole rather than quiet about it.
    //
    // While the stack is collapsed, Base UI marks the close button
    // `aria-hidden` but leaves it in the tab order - reachable by Tab, and it
    // un-hides itself on focus. That is `aria-hidden-focus` territory, and in
    // a browser axe would decide it: the rule turns on whether the element is
    // actually visible, which jsdom cannot say because it measures everything
    // as zero.
    //
    // So the rule comes back `incomplete` rather than passed or failed, and
    // the green tick above does not cover it. This test pins that it is
    // *only* incomplete - if it ever became a violation, or if the button
    // stopped being hidden at all, this fails and says which - and records
    // that the real answer comes from the stand in a browser.
    const host = document.createElement('div')
    document.body.appendChild(host)

    const user = userEvent.setup()
    render(<Example options={{ title: 'Saved' }} container={host} />)
    await raise(user)

    const axe = await import('axe-core').then((module) => module.default)
    const results = await axe.run(host)
    expect(results.violations.map((v) => v.id)).not.toContain('aria-hidden-focus')
    expect(
      results.incomplete.map((v) => v.id),
      'axe now decides `aria-hidden-focus` here - jsdom used to leave it open',
    ).toContain('aria-hidden-focus')

    host.remove()
  })
})
