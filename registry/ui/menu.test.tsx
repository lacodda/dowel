// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Button } from './button'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
  menuItemVariants,
  menuPopupVariants,
} from './menu'

/*
 * Menu.
 *
 * What is worth testing is the keyboard. A menu that opens and closes is easy;
 * a menu that can be driven without a pointer is the whole reason not to write
 * one by hand, and it is what silently fails in every hand-written one.
 */

function Example({ onChoose }: { onChoose?: (what: string) => void } = {}) {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="ghost" />}>Actions</MenuTrigger>
      <MenuPopup>
        <MenuItem onClick={() => onChoose?.('rename')}>Rename</MenuItem>
        <MenuItem onClick={() => onChoose?.('duplicate')}>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" onClick={() => onChoose?.('delete')}>
          Delete
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

describe('Menu', () => {
  it('is closed until something opens it', () => {
    render(<Example />)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens on a click, and the trigger says so', async () => {
    // `aria-expanded` is what tells a screen reader the button is a menu
    // button rather than an action.
    const user = userEvent.setup()
    render(<Example />)

    const trigger = screen.getByRole('button', { name: 'Actions' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await user.click(trigger)
    expect(await screen.findByRole('menu')).toBeDefined()
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'))
  })

  it('opens on the keyboard, with the first item ready', async () => {
    // Enter or Down on the trigger opens and highlights - the difference
    // between a menu someone can use without a mouse and one they cannot.
    const user = userEvent.setup()
    render(<Example />)

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Actions' }))

    await user.keyboard('{Enter}')
    const menu = await screen.findByRole('menu')
    await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true))
  })

  it('walks the items with the arrows', async () => {
    // Opening with the pointer leaves focus on the popup rather than on an
    // item - deliberately, since a pointer user has not asked to be anywhere
    // in particular. The first arrow is what enters the list.
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await screen.findByRole('menu')

    const items = screen.getAllByRole('menuitem')

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(document.activeElement).toBe(items[0]))

    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(items[1])

    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(items[0])
  })

  it('reaches the last item, and does not fall off it', async () => {
    // Walking down to the end and pressing Down again must not lose the
    // highlight - a list that drops focus leaves the keyboard nowhere.
    //
    // Whether it *wraps* is not asserted: `loopFocus` defaults to true and
    // Base UI implements it, but the wrap does not fire under jsdom, where
    // every element measures zero. Pinning "it wraps" would fail against
    // working code here; pinning "it does not" would encode a jsdom artefact
    // as a promise. What is pinned is what this environment can see.
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await screen.findByRole('menu')
    const items = screen.getAllByRole('menuitem')

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(document.activeElement).toBe(items[0]))

    for (let i = 1; i < items.length; i++) await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(items.at(-1))

    await user.keyboard('{ArrowDown}')
    expect(
      items.includes(document.activeElement as HTMLElement),
      'the highlight left the list at the last item',
    ).toBe(true)
  })

  it('chooses with Enter and closes', async () => {
    const user = userEvent.setup()
    const chosen: string[] = []
    render(<Example onChoose={(what) => chosen.push(what)} />)

    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await screen.findByRole('menu')
    // One arrow to enter the list, a second to reach the item being chosen.
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    await waitFor(() => expect(chosen).toEqual(['duplicate']))
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  it('closes on Escape without choosing anything', async () => {
    const user = userEvent.setup()
    const chosen: string[] = []
    render(<Example onChoose={(what) => chosen.push(what)} />)

    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await screen.findByRole('menu')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(chosen).toEqual([])
  })

  it('returns focus to the trigger when it closes', async () => {
    // Otherwise the next Tab starts from the top of the page, and whoever was
    // driving with the keyboard has lost their place.
    const user = userEvent.setup()
    render(<Example />)

    const trigger = screen.getByRole('button', { name: 'Actions' })
    await user.click(trigger)
    await screen.findByRole('menu')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('names a group by its label', async () => {
    const user = userEvent.setup()
    render(
      <Menu>
        <MenuTrigger render={<Button variant="ghost" />}>Actions</MenuTrigger>
        <MenuPopup>
          <MenuGroup>
            <MenuGroupLabel>Danger</MenuGroupLabel>
            <MenuItem tone="danger">Delete</MenuItem>
          </MenuGroup>
        </MenuPopup>
      </Menu>,
    )

    await user.click(screen.getByRole('button', { name: 'Actions' }))
    expect(await screen.findByRole('group', { name: 'Danger' })).toBeDefined()
  })

  it('draws every size and tone, and draws each one differently', () => {
    const sizeBase = menuPopupVariants({ size: 'nonexistent' as never })
    const sizes = ['sm', 'md', 'lg'] as const
    const drawnSizes = new Map(sizes.map((size) => [size, menuPopupVariants({ size })]))
    for (const [size, classes] of drawnSizes) {
      expect(classes, `\`${size}\` adds nothing`).not.toBe(sizeBase)
    }
    expect(new Set(drawnSizes.values()).size).toBe(sizes.length)

    const tones = ['default', 'danger'] as const
    const drawnTones = new Set(tones.map((tone) => menuItemVariants({ tone })))
    expect(drawnTones.size, 'the danger item is drawn like the rest').toBe(tones.length)
  })

  it('carries no colour outside the vocabulary', () => {
    const all = [
      ...(['sm', 'md', 'lg'] as const).map((size) => menuPopupVariants({ size })),
      ...(['default', 'danger'] as const).map((tone) => menuItemVariants({ tone })),
    ].join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', async () => {
    const user = userEvent.setup()
    render(
      <Menu>
        <MenuTrigger render={<Button variant="ghost" />}>Actions</MenuTrigger>
        <MenuPopup className="rounded-full">
          <MenuItem>Rename</MenuItem>
        </MenuPopup>
      </Menu>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    expect((await screen.findByRole('menu')).className).toContain('rounded-full')
  })

  it('passes axe when open', async () => {
    // The popup is portalled, so it is not inside what `render` returns -
    // which is why the menu is opened into a container of its own and axe is
    // pointed at that.
    const host = document.createElement('div')
    document.body.appendChild(host)

    const user = userEvent.setup()
    await expectNoA11yViolations(
      <Menu>
        <MenuTrigger render={<Button variant="ghost" />}>Actions</MenuTrigger>
        <MenuPopup container={host}>
          <MenuItem>Rename</MenuItem>
          <MenuSeparator />
          <MenuItem tone="danger">Delete</MenuItem>
        </MenuPopup>
      </Menu>,
    )

    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await screen.findByRole('menu')
    const results = await import('axe-core').then((axe) => axe.default.run(host))
    expect(results.violations, JSON.stringify(results.violations.map((v) => v.id))).toEqual([])
  })
})
