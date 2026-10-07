// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { runCommand, setKeymap, useCommands, type Command } from './commands'
import { SHORTCUTS_COMMAND, ShortcutList, ShortcutsDialog } from './shortcuts-dialog'

/*
 * ShortcutsDialog.
 *
 * The sheet has no rows of its own, so what is tested is that it says exactly
 * what the keyboard does: what is declared appears, what is not declared any
 * more disappears, a rebound key is shown rebound, a key lost to a conflict
 * is not promised. And that it opens where a sheet should - on the list,
 * not on the button that closes it.
 */

const SHELL: Command[] = [
  { id: 'search', label: 'Search', group: 'Everywhere', keys: 'Mod+K', run: () => {} },
  { id: 'go-dashboard', label: 'Dashboard', group: 'Going places', keys: 'G D', run: () => {} },
  { id: 'go-calendar', label: 'Calendar', group: 'Going places', keys: 'G C', run: () => {} },
  { id: 'close', label: 'Close a dialog', group: 'Everywhere', keys: 'Escape' },
  { id: 'quiet', label: 'Something with no key', group: 'Everywhere', run: () => {} },
]

function Declare({ commands, children }: { commands: Command[]; children?: ReactNode }) {
  useCommands(commands)
  return <>{children}</>
}

/** A sheet the way a product mounts it: once, in the shell. */
function Shell({ children, commands = SHELL }: { children?: ReactNode; commands?: Command[] }) {
  return (
    <Declare commands={commands}>
      <ShortcutsDialog title="Keyboard shortcuts" closeLabel="Close" group="Everywhere" />
      {children}
    </Declare>
  )
}

/** The rows of the sheet, as label and keys. */
const rows = () =>
  [...document.querySelectorAll('[role="dialog"] dl > div, [data-testid="list"] dl > div')].map(
    (row) => `${row.querySelector('dt')!.textContent}=${row.querySelector('dd')!.textContent}`,
  )

/** The headings, in the order they are drawn. */
const headings = () => [...document.querySelectorAll('h3')].map((heading) => heading.textContent)

afterEach(() => {
  setKeymap({})
})

describe('ShortcutsDialog', () => {
  it('opens on ?, with no wiring', async () => {
    const user = userEvent.setup()
    render(<Shell />)
    expect(screen.queryByRole('dialog')).toBeNull()
    await user.keyboard('?')
    expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeDefined()
  })

  it('lists what is declared, under the headings the commands give themselves', async () => {
    render(<Shell />)
    act(() => {
      runCommand(SHORTCUTS_COMMAND)
    })
    await screen.findByRole('dialog')
    expect(headings()).toEqual(['Everywhere', 'Going places'])
    // Itself included, and the key something else answers. Not the command
    // with no key: a sheet of keys has nothing to say about it.
    expect(rows()).toEqual([
      'Search=CtrlK',
      'Close a dialog=Esc',
      'Keyboard shortcuts=?',
      'Dashboard=G›D',
      'Calendar=G›C',
    ])
  })

  it('opens with the focus on the list, not on the button that closes it', async () => {
    // With the focus on the cross, the Enter pressed to see what happens
    // closes the sheet, and the arrows that should scroll it do nothing.
    const user = userEvent.setup()
    render(<Shell />)
    await user.keyboard('?')
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(document.activeElement).toBe(dialog.querySelector('dl')!.closest('[tabindex="-1"]')))
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Close' }))
  })

  it('closes on Escape and on its button', async () => {
    const user = userEvent.setup()
    render(<Shell />)
    await user.keyboard('?')
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    await user.keyboard('?')
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('shows a screen’s commands while the screen is open, and not after', async () => {
    function App() {
      const [onWork, setOnWork] = useState(true)
      return (
        <Shell commands={[]}>
          {onWork && <Declare commands={[{ id: 'score', label: 'Score this work', keys: 'S', run: () => {} }]} />}
          <button type="button" onClick={() => setOnWork(false)}>
            leave
          </button>
        </Shell>
      )
    }
    const user = userEvent.setup()
    render(<App />)
    await user.keyboard('?')
    await screen.findByRole('dialog')
    expect(rows()).toContain('Score this work=S')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    await user.click(screen.getByRole('button', { name: 'leave' }))
    await user.keyboard('?')
    await screen.findByRole('dialog')
    expect(rows()).not.toContain('Score this work=S')
  })

  it('shows a rebound key as rebound', async () => {
    render(<Shell />)
    act(() => setKeymap({ search: 'Mod+P', [SHORTCUTS_COMMAND]: 'F1' }))
    act(() => {
      runCommand(SHORTCUTS_COMMAND)
    })
    await screen.findByRole('dialog')
    expect(rows()).toContain('Search=CtrlP')
    expect(rows()).toContain('Keyboard shortcuts=F1')
  })

  it('does not promise a key a command lost to a conflict', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<Shell commands={[...SHELL, { id: 'link', label: 'Insert a link', keys: 'Mod+K', run: () => {} }]} />)
    act(() => {
      runCommand(SHORTCUTS_COMMAND)
    })
    await screen.findByRole('dialog')
    expect(rows().filter((row) => row.startsWith('Insert a link'))).toEqual([])
    errors.mockRestore()
  })

  it('can be opened from elsewhere, controlled', async () => {
    function App() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            help
          </button>
          <ShortcutsDialog title="Keys" closeLabel="Close" open={open} onOpenChange={setOpen} />
        </>
      )
    }
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'help' }))
    expect(await screen.findByRole('dialog', { name: 'Keys' })).toBeDefined()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    // `?` drives the same state.
    await user.keyboard('?')
    expect(await screen.findByRole('dialog', { name: 'Keys' })).toBeDefined()
  })

  it('puts what keys cannot say after the list', async () => {
    render(
      <ShortcutsDialog title="Keys" closeLabel="Close" description="Letters wait while you type.">
        <p>Alt and a click on a vowel marks the stress.</p>
      </ShortcutsDialog>,
    )
    act(() => {
      runCommand(SHORTCUTS_COMMAND)
    })
    const dialog = await screen.findByRole('dialog', { description: 'Letters wait while you type.' })
    expect(dialog.textContent).toContain('Alt and a click on a vowel marks the stress.')
  })

  it('passes axe, open', async () => {
    const { baseElement } = await expectNoA11yViolations(
      <Declare commands={SHELL}>
        <ShortcutsDialog title="Keyboard shortcuts" closeLabel="Close" open onOpenChange={() => {}} />
      </Declare>,
    )
    expect(baseElement.querySelector('[role="dialog"]')).not.toBeNull()
  })
})

describe('ShortcutList', () => {
  it('stands on its own, for a settings page', () => {
    render(
      <Declare commands={SHELL}>
        <ShortcutList data-testid="list" />
      </Declare>,
    )
    expect(rows()).toEqual(['Search=CtrlK', 'Close a dialog=Esc', 'Dashboard=G›D', 'Calendar=G›C'])
  })

  it('puts alternatives one under another', () => {
    // Side by side, `G S` and `Ctrl ,` read as one shortcut of four keys.
    render(
      <Declare commands={[{ id: 'settings', label: 'Settings', keys: ['G S', 'Mod+,'], run: () => {} }]}>
        <ShortcutList />
      </Declare>,
    )
    const keys = document.querySelector('dd')!
    expect(keys.children).toHaveLength(2)
    expect(keys.className).toContain('flex-col')
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(
      <Declare commands={SHELL}>
        <ShortcutList />
      </Declare>,
    )
  })
})
