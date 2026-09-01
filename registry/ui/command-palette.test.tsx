// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPaletteCollection,
  CommandPaletteGroupLabel,
  CommandPalettePopup,
  CommandPaletteRow,
  commandPalettePopupVariants,
} from './command-palette'

/*
 * CommandPalette.
 *
 * What is worth pinning is the arrangement and the keyboard, because both are
 * what a hand-written palette gets wrong.
 *
 * The arrangement first: this is a Combobox with the field *inside* the
 * popup, which is what makes the popup announce itself as a dialog while the
 * field still announces itself as the combobox that owns the list. Write it
 * the obvious way round - a Dialog with a search field in it - and a screen
 * reader is told about a dialog containing a text box, with no relationship
 * between what is typed and the list that changes. So both roles are asserted
 * together: either one alone would pass over the wrong thing.
 *
 * Then the keyboard, which is the only way a palette is ever driven: typing
 * narrows, the arrows move the highlight, Enter runs what is highlighted,
 * Escape leaves without running anything.
 */

const commands = ['Open file', 'Open recent', 'Save', 'Save as', 'Close window']

function Example({
  onValueChange,
  container,
}: {
  // `string | null`, because Base UI reports the value going away as well as
  // arriving: a palette that is cleared reports `null`, and a handler typed
  // `string` would be lying about what it receives.
  onValueChange?: (value: string | null) => void
  container?: HTMLElement
} = {}) {
  const [open, setOpen] = useState(true)
  return (
    <CommandPalette
      items={commands}
      open={open}
      onOpenChange={setOpen}
      onValueChange={(value: string | null) => onValueChange?.(value)}
    >
      <CommandPalettePopup container={container} aria-label="Commands">
        <CommandPaletteInput aria-label="Command" placeholder="Type a command" hint={['Escape']} />
        <CommandPaletteEmpty>Nothing matched</CommandPaletteEmpty>
        <CommandPaletteList>
          {(item: string) => (
            <CommandPaletteItem key={item} value={item}>
              <CommandPaletteRow hint="File">{item}</CommandPaletteRow>
            </CommandPaletteItem>
          )}
        </CommandPaletteList>
      </CommandPalettePopup>
    </CommandPalette>
  )
}

/** The options, in the order they are drawn. */
function optionTexts(): string[] {
  return screen.getAllByRole('option').map((option) => option.textContent ?? '')
}

/** The option Base UI is pointing at. `aria-activedescendant` on the input is
 * how the highlight is announced - the option itself never takes focus, which
 * is the whole reason the field can still be typed into. */
function highlighted(): string | null {
  const id = screen.getByRole('combobox').getAttribute('aria-activedescendant')
  return id ? (document.getElementById(id)?.textContent ?? null) : null
}

describe('CommandPalette', () => {
  it('is a dialog with a combobox in it, not a dialog with a field in it', async () => {
    // The arrangement, and the reason for the component. Both roles at once:
    // the popup is what a screen reader announces as the thing that opened,
    // and the input is what owns the list that changes as it is typed.
    render(<Example />)

    const dialog = await screen.findByRole('dialog')
    const input = screen.getByRole('combobox')
    expect(dialog.contains(input), 'the field is not inside the popup').toBe(true)
    expect(input.tagName).toBe('INPUT')
  })

  it('is named by the product, because a dialog with no name is not announced', async () => {
    // The one thing the arrangement costs. A Dialog gets its name from a
    // visible title; a palette has no title - it opens straight onto a field
    // - so the popup has nothing to point `aria-labelledby` at, and axe fails
    // it as an unnamed dialog. The component cannot supply the word (it would
    // be English in the box), so the product does, and this pins that the
    // prop reaches the element rather than being swallowed on the way.
    render(<Example />)
    expect(await screen.findByRole('dialog', { name: 'Commands' })).toBeDefined()
  })

  it('is not a native select in disguise', () => {
    render(<Example />)
    expect(document.querySelectorAll('select, option, optgroup')).toHaveLength(0)
  })

  it('lists everything before anything is typed', async () => {
    render(<Example />)
    await screen.findByRole('listbox')
    expect(optionTexts()).toHaveLength(commands.length)
  })

  it('narrows as it is typed, and fills back up when the query goes', async () => {
    // Clearing is the half that gets forgotten: a palette that filters on the
    // way down and not on the way back up strands the reader on an empty list
    // with no way to see what else there was.
    const user = userEvent.setup()
    render(<Example />)

    const input = await screen.findByRole('combobox')
    await user.click(input)
    await user.keyboard('save')
    await waitFor(() => expect(optionTexts()).toHaveLength(2))
    expect(optionTexts().every((text) => text.includes('Save'))).toBe(true)

    await user.clear(input)
    await waitFor(() => expect(optionTexts()).toHaveLength(commands.length))
  })

  it('says so when nothing matched, in words the product gave it', async () => {
    // There is no default text: a palette that invents "No results" ships
    // that English to every reader who does not read English, and no amount
    // of i18n in the product reaches it.
    const user = userEvent.setup()
    render(<Example />)

    await user.click(await screen.findByRole('combobox'))
    await user.keyboard('zzzz')

    await waitFor(() => expect(screen.queryAllByRole('option')).toHaveLength(0))
    expect(await screen.findByText('Nothing matched')).toBeDefined()
  })

  it('moves the highlight with the arrows and runs what is highlighted', async () => {
    const user = userEvent.setup()
    const chosen: (string | null)[] = []
    render(<Example onValueChange={(value) => chosen.push(value)} />)

    await user.click(await screen.findByRole('combobox'))
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(highlighted()).toContain(commands[0]))

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(highlighted()).toContain(commands[1]))

    await user.keyboard('{ArrowUp}')
    await waitFor(() => expect(highlighted()).toContain(commands[0]))

    await user.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => expect(chosen).toEqual([commands[1]]))
  })

  it('runs the one thing left after typing', async () => {
    // The move the palette is actually used with: type enough, press Enter,
    // never look at the list.
    const user = userEvent.setup()
    const chosen: (string | null)[] = []
    render(<Example onValueChange={(value) => chosen.push(value)} />)

    await user.click(await screen.findByRole('combobox'))
    await user.keyboard('close')
    await waitFor(() => expect(optionTexts()).toHaveLength(1))

    await user.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => expect(chosen).toEqual(['Close window']))
  })

  it('walks to the last row, then back through the field to the first', async () => {
    // The loop has one more stop than the list does: past the last row the
    // highlight comes off the list and back onto the query, and the next Down
    // enters at the top again. That is right for a palette - the field is
    // where the reader edits what they typed, so walking off the end must
    // reach it rather than skip it - but it means "Down from the last row
    // highlights the first" is not what happens, and a test written that way
    // would be pinning a palette nobody has.
    //
    // The highlight is `aria-activedescendant` on the input throughout;
    // nothing in the list ever takes focus, which is what lets typing carry
    // on between arrow presses. `data-highlighted` is not readable here -
    // jsdom measures every element as zero, so Base UI never scrolls a row
    // into view and never marks one - so the announcement is what is read.
    const user = userEvent.setup()
    render(<Example />)

    await user.click(await screen.findByRole('combobox'))
    for (let i = 0; i < commands.length; i++) await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(highlighted()).toContain(commands.at(-1)))

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(highlighted(), 'walking off the end skipped the query').toBeNull())

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(highlighted()).toContain(commands[0]))
  })

  it('closes on Escape without running anything', async () => {
    const user = userEvent.setup()
    const chosen: (string | null)[] = []
    render(<Example onValueChange={(value) => chosen.push(value)} />)

    await user.click(await screen.findByRole('combobox'))
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(chosen).toEqual([])
  })

  it('names a group by its label', async () => {
    // What a palette listing more than one kind of thing is built out of.
    render(
      <CommandPalette items={commands} open>
        <CommandPalettePopup aria-label="Commands">
          <CommandPaletteInput aria-label="Command" />
          <CommandPaletteList>
            {() => null}
          </CommandPaletteList>
          <CommandPaletteGroup aria-label="Files">
            <CommandPaletteItem value="Open file">Open file</CommandPaletteItem>
          </CommandPaletteGroup>
        </CommandPalettePopup>
      </CommandPalette>,
    )

    const group = await screen.findByRole('group', { name: 'Files' })
    expect(within(group).getByRole('option', { name: 'Open file' })).toBeDefined()
  })

  it('draws a row as an icon, a name and where it lives', () => {
    render(
      <CommandPaletteRow icon={<span data-testid="icon" />} hint="File">
        Open file
      </CommandPaletteRow>,
    )
    expect(screen.getByTestId('icon')).toBeDefined()
    expect(screen.getByText('Open file')).toBeDefined()
    expect(screen.getByText('File')).toBeDefined()
  })

  it('shows the hint it is given, and draws none when it is given none', async () => {
    // Decorative, and `aria-hidden`: a screen reader reading "Escape" out of
    // the middle of a search box is noise, and the key works either way.
    const { container, unmount } = render(<Example />)
    await screen.findByRole('dialog')
    expect(document.querySelector('kbd')).not.toBeNull()
    expect(document.querySelector('kbd')?.closest('[aria-hidden]')).not.toBeNull()
    unmount()
    void container

    render(
      <CommandPalette items={commands} open>
        <CommandPalettePopup aria-label="Commands">
          <CommandPaletteInput aria-label="Command" />
        </CommandPalettePopup>
      </CommandPalette>,
    )
    await screen.findByRole('dialog')
    expect(document.querySelector('kbd')).toBeNull()
  })

  it('draws every size, and draws each one differently', () => {
    const sizes = ['md', 'lg'] as const
    const base = commandPalettePopupVariants({ size: 'nonexistent' as never })
    const drawn = new Map(sizes.map((size) => [size, commandPalettePopupVariants({ size })]))
    for (const [size, classes] of drawn) {
      expect(classes, `\`${size}\` adds nothing`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size).toBe(sizes.length)
  })

  it('carries no colour outside the vocabulary', () => {
    const all = (['md', 'lg'] as const).map((size) => commandPalettePopupVariants({ size })).join(' ')
    expect(all).not.toMatch(/\bdark:/)
    // `bg-black/55` on the backdrop is a dim rather than a colour, and it is
    // outside the variants; what is checked here is that no hex slipped into
    // the box itself.
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', async () => {
    render(
      <CommandPalette items={commands} open>
        <CommandPalettePopup aria-label="Commands" className="rounded-full">
          <CommandPaletteInput aria-label="Command" />
        </CommandPalettePopup>
      </CommandPalette>,
    )
    expect((await screen.findByRole('dialog')).className).toContain('rounded-full')
  })

  it('lists groups, and walks them as one list', async () => {
    // A palette that shows works, versions and notes together is a `List` over
    // the groups with a `Collection` inside each - not a `List` inside a
    // `List`, since the list *is* the listbox and there is one per palette.
    //
    // What this pins is that the arrow keys cross a group boundary: the walk
    // is over the flattened rows, so reaching the end of one group steps into
    // the next rather than stopping at the caption.
    const groups = [
      { kind: 'work', items: ['The long night'] },
      { kind: 'note', items: ['A line about rain'] },
    ]

    const user = userEvent.setup()
    render(
      <CommandPalette items={groups} open>
        <CommandPalettePopup aria-label="Commands">
          <CommandPaletteInput aria-label="Command" />
          <CommandPaletteList>
            {(group: { kind: string; items: string[] }) => (
              <CommandPaletteGroup key={group.kind} items={group.items}>
                <CommandPaletteGroupLabel>{group.kind}</CommandPaletteGroupLabel>
                <CommandPaletteCollection>
                  {(item: string) => (
                    <CommandPaletteItem key={item} value={item}>
                      {item}
                    </CommandPaletteItem>
                  )}
                </CommandPaletteCollection>
              </CommandPaletteGroup>
            )}
          </CommandPaletteList>
        </CommandPalettePopup>
      </CommandPalette>,
    )

    const options = await screen.findAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'The long night',
      'A line about rain',
    ])

    // One listbox, whatever the grouping.
    expect(screen.getAllByRole('listbox')).toHaveLength(1)

    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(
      screen.getByRole('combobox').getAttribute('aria-activedescendant'),
      'the walk stopped at the group boundary',
    ).toBe(options[1]?.id)
  })

  it('passes axe when open', async () => {
    // The popup is portalled, so it is not inside what `render` returns -
    // which is why the palette is opened into a container of its own and axe
    // is pointed at that.
    const host = document.createElement('div')
    document.body.appendChild(host)

    await expectNoA11yViolations(<Example container={host} />)
    const dialog = await screen.findByRole('dialog')

    // Checked before axe runs, and not decoration: axe over an empty node
    // finds nothing and reports a pass. Without this the test would go on
    // being green if `container` were ever dropped on the way to the portal,
    // which is the whole thing it is here to exercise.
    expect(host.contains(dialog), 'the palette did not open into the container').toBe(true)

    const results = await import('axe-core').then((axe) => axe.default.run(host))
    expect(results.violations, JSON.stringify(results.violations.map((v) => v.id))).toEqual([])
  })
})
