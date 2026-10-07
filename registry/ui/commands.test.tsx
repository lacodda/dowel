// @vitest-environment jsdom
import { act, render } from '@testing-library/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  groupCommands,
  matchCommands,
  runCommand,
  setKeymap,
  useCommand,
  useCommandConflicts,
  useCommandKeys,
  useCommandList,
  useCommands,
  type Command,
} from './commands'

/*
 * Commands.
 *
 * The list is one truth read three ways - by the keyboard, the palette and
 * the sheet - so most of these tests are about the three agreeing: a key that
 * lost a conflict is gone from the keyboard *and* from the list, a rebinding
 * moves the key in both, a disabled command keeps its line in the sheet but
 * does not take the keystroke from anyone.
 *
 * The rest is about where a key is answered, which is the half every product
 * gets wrong once: into a field, into a menu that types ahead, over a dialog
 * that owns its own keys, on the button that Enter presses.
 */

/** A keydown as the DOM would deliver it, aimed at `target`. */
function press(
  key: string,
  { target = document.body, ...init }: KeyboardEventInit & { target?: Element } = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

function Declare({ commands, children }: { commands: Command[]; children?: ReactNode }) {
  useCommands(commands)
  return <>{children}</>
}

/** Renders the list the way a sheet reads it, so a test can read it back. */
function Listed() {
  const list = useCommandList()
  return (
    <ul data-testid="list">
      {list.map((command) => (
        <li key={command.id} data-id={command.id} data-runnable={command.run ? 'yes' : 'no'}>
          {command.label}={command.keys.join(',')}
        </li>
      ))}
    </ul>
  )
}

const readList = (container: HTMLElement) =>
  [...container.querySelectorAll('li')].map((item) => item.textContent)

/** Lets the conflict report, which waits for the commit to settle, run. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)))

let errors: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  setKeymap({})
  errors.mockRestore()
  vi.useRealTimers()
})

describe('answering a key', () => {
  it('runs the command on its keys, and not on a near miss', () => {
    const ran: string[] = []
    render(<Declare commands={[{ id: 'search', label: 'Search', keys: 'Mod+K', run: () => ran.push('search') }]} />)

    press('j', { ctrlKey: true })
    press('k', { ctrlKey: true, shiftKey: true })
    expect(ran).toEqual([])

    const event = press('k', { ctrlKey: true })
    expect(ran).toEqual(['search'])
    expect(event.defaultPrevented, 'the browser kept the keystroke too').toBe(true)
  })

  it('answers on a Russian layout, where the key types another letter', () => {
    // The defect this module was rewritten for: the old match compared
    // `event.key`, which is `л` here, and every shortcut died the moment
    // someone switched language to write.
    const ran: string[] = []
    render(<Declare commands={[{ id: 'search', label: 'Search', keys: 'Mod+K', run: () => ran.push('search') }]} />)
    press('л', { code: 'KeyK', ctrlKey: true })
    expect(ran).toEqual(['search'])
  })

  it('takes alternatives', () => {
    const ran: string[] = []
    render(<Declare commands={[{ id: 'find', label: 'Find', keys: ['Mod+K', 'Mod+P'], run: () => ran.push('find') }]} />)
    press('k', { ctrlKey: true })
    press('p', { ctrlKey: true })
    expect(ran).toEqual(['find', 'find'])
  })

  it('runs the newest handler, without declaring the command again', () => {
    // Inline handlers close over the render they were written in. The one
    // that runs has to be the latest, or the command acts on stale state.
    let renders = 0
    function Counter() {
      const [count, setCount] = useState(0)
      useCommand({ id: 'count', label: 'Count', keys: 'Mod+J', run: () => setCount(count + 1) })
      return <output>{count}</output>
    }
    // The subscriber itself is what is counted: a parent of the subscriber
    // does not re-render when the list does, and counted there, a list that
    // re-rendered on every keystroke would look quiet.
    function Sheet() {
      renders++
      useCommandList()
      return null
    }
    const { container } = render(
      <>
        <Counter />
        <Sheet />
      </>,
    )
    const before = renders
    press('j', { ctrlKey: true })
    press('j', { ctrlKey: true })
    press('j', { ctrlKey: true })
    expect(container.querySelector('output')?.textContent).toBe('3')
    expect(renders, 'a fresh handler re-rendered every list').toBe(before)
  })

  it('lets go of the keyboard when the component goes away', () => {
    const ran: string[] = []
    const { unmount } = render(
      <Declare commands={[{ id: 'search', label: 'Search', keys: 'Mod+K', run: () => ran.push('search') }]} />,
    )
    const removed = vi.spyOn(document, 'removeEventListener')
    unmount()
    const event = press('k', { ctrlKey: true })
    expect(ran).toEqual([])
    expect(event.defaultPrevented, 'the listener outlived the component').toBe(false)
    // Nothing declared, nothing listening: the window is the page's again.
    expect(removed.mock.calls.some(([type]) => type === 'keydown')).toBe(true)
    removed.mockRestore()
  })

  it('leaves a key alone that something nearer already handled', () => {
    const ran: string[] = []
    render(<Declare commands={[{ id: 'search', label: 'Search', keys: 'Mod+K', run: () => ran.push('search') }]} />)
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true })
    event.preventDefault()
    act(() => {
      document.body.dispatchEvent(event)
    })
    expect(ran).toEqual([])
  })

  it('does not answer while disabled, and does not take the key from anyone', () => {
    const ran: string[] = []
    const { container } = render(
      <Declare commands={[{ id: 'undo', label: 'Undo', keys: 'Mod+Z', enabled: false, run: () => ran.push('undo') }]}>
        <Listed />
      </Declare>,
    )
    const event = press('z', { ctrlKey: true })
    expect(ran).toEqual([])
    expect(event.defaultPrevented).toBe(false)
    // Still a key the application has: the sheet lists it.
    expect(readList(container)).toEqual(['Undo=Mod+Z'])
  })
})

describe('sequences', () => {
  it('runs G then D', () => {
    const ran: string[] = []
    render(<Declare commands={[{ id: 'go-dashboard', label: 'Dashboard', keys: 'G D', run: () => ran.push('d') }]} />)
    expect(press('g').defaultPrevented, 'the first step was left to the page').toBe(true)
    expect(ran).toEqual([])
    press('d')
    expect(ran).toEqual(['d'])
  })

  it('spends a key that does not continue the sequence on ending it', () => {
    // A `g` pressed by mistake must not turn the next keystroke into
    // something else - and the next keystroke must not act on its own either.
    const ran: string[] = []
    render(
      <Declare
        commands={[
          { id: 'go-dashboard', label: 'Dashboard', keys: 'G D', run: () => ran.push('d') },
          { id: 'help', label: 'Help', keys: '?', run: () => ran.push('help') },
        ]}
      />,
    )
    press('g')
    press('?')
    expect(ran).toEqual([])
    press('d')
    expect(ran, 'the sequence outlived the key that ended it').toEqual([])
    press('?')
    expect(ran).toEqual(['help'])
  })

  it('forgets the first step after a second and a half', () => {
    vi.useFakeTimers()
    const ran: string[] = []
    render(<Declare commands={[{ id: 'go-dashboard', label: 'Dashboard', keys: 'G D', run: () => ran.push('d') }]} />)
    press('g')
    act(() => {
      vi.advanceTimersByTime(1600)
    })
    press('d')
    expect(ran).toEqual([])
  })

  it('reads a held key as one key, not as the next step', () => {
    const ran: string[] = []
    render(<Declare commands={[{ id: 'go-dashboard', label: 'Dashboard', keys: 'G D', run: () => ran.push('d') }]} />)
    press('g')
    press('g', { repeat: true })
    press('d')
    expect(ran).toEqual(['d'])
  })
})

describe('where a key is answered', () => {
  const field = (make: () => HTMLElement) => {
    const element = make()
    document.body.append(element)
    return element
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('not in a field someone is typing in', () => {
    const ran: string[] = []
    const input = field(() => document.createElement('input'))
    render(<Declare commands={[{ id: 'search', label: 'Search', keys: 'Mod+K', run: () => ran.push('search') }]} />)
    const event = press('k', { ctrlKey: true, target: input })
    expect(ran).toEqual([])
    expect(event.defaultPrevented, 'the field lost the keystroke anyway').toBe(false)
  })

  it('in a field, for a command that belongs wherever the person is', () => {
    const ran: string[] = []
    const input = field(() => document.createElement('textarea'))
    render(
      <Declare commands={[{ id: 'save', label: 'Save', keys: 'Mod+S', whileTyping: true, run: () => ran.push('save') }]} />,
    )
    press('s', { ctrlKey: true, target: input })
    expect(ran).toEqual(['save'])
  })

  it('refuses a key a field types with, declared to fire while typing', () => {
    // It would take that letter from every field in the application.
    expect(() =>
      render(<Declare commands={[{ id: 'help', label: 'Help', keys: '?', whileTyping: true, run: () => {} }]} />),
    ).toThrow(/fires while typing/)
  })

  it.each(['dialog', 'alertdialog', 'menu', 'listbox', 'tree'])(
    'not a plain key inside a %s, which owns its own letters',
    (role) => {
      const ran: string[] = []
      const surface = field(() => {
        const element = document.createElement('div')
        element.setAttribute('role', role)
        element.append(document.createElement('button'))
        return element
      })
      render(
        <Declare
          commands={[
            { id: 'help', label: 'Help', keys: '?', run: () => ran.push('help') },
            { id: 'search', label: 'Search', keys: 'Mod+K', run: () => ran.push('search') },
          ]}
        />,
      )
      press('?', { target: surface.firstElementChild! })
      expect(ran, 'a letter was taken from a place that types ahead').toEqual([])
      // A key with a command modifier types nothing, and is still answered.
      press('k', { ctrlKey: true, target: surface.firstElementChild! })
      expect(ran).toEqual(['search'])
    },
  )

  it('a plain key inside a dialog, for a command declared in that dialog', () => {
    const ran: string[] = []
    function InDialog() {
      const dialog = useRef<HTMLDivElement>(null)
      useCommand({ id: 'next', label: 'Next', keys: 'J', within: dialog, run: () => ran.push('next') })
      return (
        <div role="dialog" ref={dialog}>
          <button type="button">inside</button>
        </div>
      )
    }
    const { getByText } = render(<InDialog />)
    press('j', { target: getByText('inside') })
    expect(ran).toEqual(['next'])
  })

  it('not Enter on the button it presses, but Enter with nothing focused', () => {
    const ran: string[] = []
    const button = field(() => document.createElement('button'))
    render(<Declare commands={[{ id: 'open', label: 'Open', keys: 'Enter', run: () => ran.push('open') }]} />)
    press('Enter', { target: button })
    expect(ran).toEqual([])
    press('Enter')
    expect(ran).toEqual(['open'])
  })

  it('only inside the element a command is declared within, and there before the rest', () => {
    const ran: string[] = []
    function Panel() {
      const panel = useRef<HTMLDivElement>(null)
      useCommands([
        { id: 'close-panel', label: 'Close the panel', keys: 'Escape', within: panel, run: () => ran.push('panel') },
      ])
      return (
        <div ref={panel}>
          <button type="button">in the panel</button>
        </div>
      )
    }
    const { getByText, container } = render(
      <Declare commands={[{ id: 'deselect', label: 'Deselect', keys: 'Escape', run: () => ran.push('window') }]}>
        <Panel />
        <Listed />
      </Declare>,
    )
    press('Escape', { target: getByText('in the panel') })
    press('Escape')
    expect(ran).toEqual(['panel', 'window'])
    // Not a conflict: the inner one is meant to win where it is.
    expect(errors).not.toHaveBeenCalled()
    // Tied to the focus, so the palette cannot run it from elsewhere.
    expect(container.querySelector('[data-id="close-panel"]')?.getAttribute('data-runnable')).toBe('no')
  })
})

describe('conflicts', () => {
  it('keeps the keys with the command declared first, everywhere', async () => {
    const ran: string[] = []
    const { container } = render(
      <Declare
        commands={[
          { id: 'search', label: 'Search', keys: 'Mod+K', run: () => ran.push('search') },
          { id: 'link', label: 'Insert a link', keys: 'mod+k', run: () => ran.push('link') },
        ]}
      >
        <Listed />
      </Declare>,
    )
    press('k', { ctrlKey: true })
    expect(ran).toEqual(['search'])
    // The loser shows no key: a sheet that lists it would promise a key that
    // runs something else.
    expect(readList(container)).toEqual(['Search=Mod+K', 'Insert a link='])

    await settle()
    expect(errors).toHaveBeenCalledTimes(1)
    expect(String(errors.mock.calls[0]![0])).toMatch(/`link` cannot answer to `Mod\+K`: `search`/)
  })

  it('gives the keys to the outer component when both mount together', async () => {
    // Effects run children first. Ordered by effect, the screen inside the
    // shell would take the shell's own key - and the winner would be whichever
    // component happened to be deepest.
    const ran: string[] = []
    const { container } = render(
      <Declare commands={[{ id: 'search', label: 'Search', keys: 'Mod+K', run: () => ran.push('shell') }]}>
        <Declare commands={[{ id: 'link', label: 'Insert a link', keys: 'Mod+K', run: () => ran.push('screen') }]} />
        <Listed />
      </Declare>,
    )
    press('k', { ctrlKey: true })
    expect(ran).toEqual(['shell'])
    expect(readList(container)).toEqual(['Search=Mod+K', 'Insert a link='])
    await settle()
  })

  it('sees a key that only one platform spells differently', async () => {
    // Off a Mac, Ctrl+K and Mod+K are one keystroke.
    render(
      <Declare
        commands={[
          { id: 'search', label: 'Search', keys: 'Mod+K', run: () => {} },
          { id: 'kill', label: 'Kill the line', keys: 'Ctrl+K', run: () => {} },
        ]}
      />,
    )
    await settle()
    expect(errors).toHaveBeenCalledTimes(1)
  })

  it('counts a sequence that begins with another command as a conflict', async () => {
    // `G` fires the moment it is pressed, so `G D` could never finish.
    const ran: string[] = []
    render(
      <Declare
        commands={[
          { id: 'grid', label: 'Grid', keys: 'G', run: () => ran.push('grid') },
          { id: 'go-dashboard', label: 'Dashboard', keys: 'G D', run: () => ran.push('d') },
        ]}
      />,
    )
    press('g')
    press('d')
    expect(ran).toEqual(['grid'])
    await settle()
    expect(errors).toHaveBeenCalledTimes(1)
  })

  it('counts a sequence declared before the key that begins it', async () => {
    const ran: string[] = []
    render(
      <Declare
        commands={[
          { id: 'go-dashboard', label: 'Dashboard', keys: 'G D', run: () => ran.push('d') },
          { id: 'grid', label: 'Grid', keys: 'G', run: () => ran.push('grid') },
        ]}
      />,
    )
    press('g')
    press('d')
    expect(ran).toEqual(['d'])
    await settle()
    expect(errors).toHaveBeenCalledTimes(1)
  })

  it('counts keys that something else answers, declared without a run', async () => {
    // Escape closes the dialog; the sheet says so, and a command bound to
    // Escape in the same place is told it never will be.
    render(
      <Declare
        commands={[
          { id: 'close', label: 'Close', keys: 'Escape' },
          { id: 'clear', label: 'Clear the selection', keys: 'Escape', run: () => {} },
        ]}
      />,
    )
    await settle()
    expect(errors).toHaveBeenCalledTimes(1)
    const event = press('Escape')
    expect(event.defaultPrevented, 'a key nobody here runs was taken from the dialog').toBe(false)
  })

  it('reports one conflict once, however often the list changes', async () => {
    function Shell({ label }: { label: string }) {
      useCommands([
        { id: 'search', label, keys: 'Mod+K', run: () => {} },
        { id: 'link', label: 'Link', keys: 'Mod+K', run: () => {} },
      ])
      return null
    }
    const { rerender } = render(<Shell label="Search" />)
    await settle()
    rerender(<Shell label="Find" />)
    await settle()
    expect(errors).toHaveBeenCalledTimes(1)
  })

  it('hands the conflicts to whoever asks', () => {
    let seen: ReturnType<typeof useCommandConflicts> = []
    function Watch() {
      const conflicts = useCommandConflicts()
      useEffect(() => {
        seen = conflicts
      })
      return null
    }
    render(
      <Declare
        commands={[
          { id: 'search', label: 'Search', keys: 'Mod+K', run: () => {} },
          { id: 'link', label: 'Link', keys: 'Mod+K', run: () => {} },
        ]}
      >
        <Watch />
      </Declare>,
    )
    expect(seen).toEqual([{ keys: 'Mod+K', lost: 'link', against: 'Mod+K', kept: 'search' }])
  })
})

describe('rebinding', () => {
  it('moves the key in the keyboard and in the list together', () => {
    const ran: string[] = []
    const { container } = render(
      <Declare commands={[{ id: 'search', label: 'Search', keys: 'Mod+K', run: () => ran.push('search') }]}>
        <Listed />
      </Declare>,
    )
    act(() => setKeymap({ search: 'Mod+P' }))
    press('k', { ctrlKey: true })
    expect(ran).toEqual([])
    press('p', { ctrlKey: true })
    expect(ran).toEqual(['search'])
    expect(readList(container)).toEqual(['Search=Mod+P'])
  })

  it('does not let a rebinding carry a typing key into fields', () => {
    // Declared on Mod+S it may fire while typing; rebound by a person to a
    // plain letter, it would take that letter from every field.
    const ran: string[] = []
    const input = document.createElement('input')
    document.body.append(input)
    render(
      <Declare commands={[{ id: 'save', label: 'Save', keys: 'Mod+S', whileTyping: true, run: () => ran.push('save') }]} />,
    )
    act(() => setKeymap({ save: 'S' }))
    press('s', { target: input })
    expect(ran).toEqual([])
    press('s')
    expect(ran).toEqual(['save'])
    input.remove()
  })

  it('unbinds with an empty list', () => {
    const { container } = render(
      <Declare commands={[{ id: 'search', label: 'Search', keys: 'Mod+K', run: () => {} }]}>
        <Listed />
      </Declare>,
    )
    act(() => setKeymap({ search: [] }))
    expect(readList(container)).toEqual(['Search='])
  })

  it('skips what does not parse in stored keys, and says so, rather than throwing', () => {
    // A settings file written by an older version must not take the
    // application down.
    act(() => setKeymap({ search: 'Cmd+K', palette: 'Mod+P' }))
    expect(errors).toHaveBeenCalledTimes(1)
    const ran: string[] = []
    render(<Declare commands={[{ id: 'palette', label: 'Palette', keys: 'Mod+O', run: () => ran.push('palette') }]} />)
    press('p', { ctrlKey: true })
    expect(ran).toEqual(['palette'])
  })
})

describe('the list', () => {
  it('lists in the order declared, one line per command', () => {
    const { container } = render(
      <>
        <Declare commands={[{ id: 'search', label: 'Search', keys: 'Mod+K', run: () => {} }]} />
        <Declare
          commands={[
            { id: 'help', label: 'Help', keys: '?', run: () => {} },
            { id: 'close', label: 'Close', keys: 'Escape' },
          ]}
        />
        <Listed />
      </>,
    )
    expect(readList(container)).toEqual(['Search=Mod+K', 'Help=?', 'Close=Escape'])
    // Something to run or not: the palette offers only the first two.
    expect(
      [...container.querySelectorAll('li')].map((item) => item.getAttribute('data-runnable')),
    ).toEqual(['yes', 'yes', 'no'])
  })

  it('lists a command declared by two mounted copies once', () => {
    // Two panes of one editor each declare their own reading-mode key, inside
    // themselves: one command, in two places.
    function Pane() {
      const pane = useRef<HTMLDivElement>(null)
      useCommand({ id: 'reading', label: 'Reading mode', keys: 'Mod+E', within: pane, run: () => {} })
      return <div ref={pane} />
    }
    const { container } = render(
      <>
        <Pane />
        <Pane />
        <Listed />
      </>,
    )
    expect(readList(container)).toEqual(['Reading mode=Mod+E'])
    expect(errors).not.toHaveBeenCalled()
  })

  it('re-renders when a label changes', () => {
    function Shell({ label }: { label: string }) {
      useCommand({ id: 'search', label, keys: 'Mod+K', run: () => {} })
      return <Listed />
    }
    const { container, rerender } = render(<Shell label="Search" />)
    rerender(<Shell label="Поиск" />)
    expect(readList(container)).toEqual(['Поиск=Mod+K'])
  })

  it('gives one command its keys, for a hint beside a button', () => {
    let keys: string[] = []
    function Hint() {
      const answered = useCommandKeys('search')
      useEffect(() => {
        keys = answered
      })
      return null
    }
    render(
      <Declare commands={[{ id: 'search', label: 'Search', keys: ['mod+k', 'Ctrl+P'], run: () => {} }]}>
        <Hint />
      </Declare>,
    )
    expect(keys).toEqual(['Mod+K', 'Mod+P'])
  })

  it('runs a command by id, for a menu item that does the same', () => {
    const ran: string[] = []
    render(
      <Declare
        commands={[
          { id: 'search', label: 'Search', run: () => ran.push('search') },
          { id: 'undo', label: 'Undo', enabled: false, run: () => ran.push('undo') },
        ]}
      />,
    )
    expect(runCommand('search')).toBe(true)
    expect(runCommand('undo')).toBe(false)
    expect(runCommand('nothing')).toBe(false)
    expect(ran).toEqual(['search'])
  })
})

describe('matchCommands', () => {
  const commands = [
    { label: 'Critical issues' },
    { label: 'Open the calendar' },
    { label: 'Calendar' },
    { label: 'Switch to the dark theme' },
  ]

  it('puts a label that begins with the query first, then words that begin with it', () => {
    expect(matchCommands('cal', commands).map((command) => command.label)).toEqual([
      'Calendar',
      'Open the calendar',
      'Critical issues',
    ])
  })

  it('finds every term in any order', () => {
    expect(matchCommands('theme dark', commands).map((command) => command.label)).toEqual([
      'Switch to the dark theme',
    ])
  })

  it('matches everything, in order, on an empty query', () => {
    expect(matchCommands('  ', commands)).toEqual(commands)
  })

  it('reads words in any alphabet', () => {
    expect(matchCommands('тём', [{ label: 'Тёмная тема' }, { label: 'Светлая тема' }])).toEqual([
      { label: 'Тёмная тема' },
    ])
  })
})

describe('groupCommands', () => {
  it('keeps the headings in the order they first appear', () => {
    const grouped = groupCommands([
      { id: 'a', group: 'Go' },
      { id: 'b', group: 'Edit' },
      { id: 'c', group: 'Go' },
      { id: 'd' },
    ])
    expect(grouped.map((entry) => [entry.group, entry.commands.map((command) => command.id)])).toEqual([
      ['Go', ['a', 'c']],
      ['Edit', ['b']],
      [undefined, ['d']],
    ])
  })
})
