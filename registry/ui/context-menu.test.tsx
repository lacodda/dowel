// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './context-menu'
import { menuItemVariants, menuPopupVariants } from './menu'

/*
 * ContextMenu.
 *
 * Menu's own tests cover the keyboard inside the popup, and the popup here is
 * literally Menu's - so what is worth testing is the part that differs: the
 * gesture. A right click over an area opens it, an ordinary click does not,
 * and the menu that appears is the same one, wearing the same classes.
 */

function open(user: ReturnType<typeof userEvent.setup>, target: Element) {
  // `pointer` rather than a synthesised event, so the button number and the
  // `contextmenu` that follows it are the ones a browser would send.
  return user.pointer({ target, keys: '[MouseRight]' })
}

function Example({ onChoose }: { onChoose?: (what: string) => void } = {}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger data-testid="area">Right click here</ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuItem onClick={() => onChoose?.('rename')}>Rename</ContextMenuItem>
        <ContextMenuItem onClick={() => onChoose?.('duplicate')}>Duplicate</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem tone="danger" onClick={() => onChoose?.('delete')}>
          Delete
        </ContextMenuItem>
      </ContextMenuPopup>
    </ContextMenu>
  )
}

describe('ContextMenu', () => {
  it('is closed until the gesture', () => {
    render(<Example />)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens on a right click over the area', async () => {
    const user = userEvent.setup()
    render(<Example />)

    await open(user, screen.getByTestId('area'))
    expect(await screen.findByRole('menu')).toBeDefined()
  })

  it('does not open on an ordinary click', async () => {
    // The area is usually something the product already uses - a row that
    // selects, a tile that opens. A left click has to keep belonging to it.
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByTestId('area'))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('triggers an area rather than a button', async () => {
    // The point of this component against Menu: what opens it is a region,
    // not a control, so it must not be announced as one.
    const user = userEvent.setup()
    render(<Example />)

    const area = screen.getByTestId('area')
    expect(area.tagName).toBe('DIV')
    expect(screen.queryByRole('button')).toBeNull()

    await open(user, area)
    await screen.findByRole('menu')
  })

  it('walks the items with the arrows', async () => {
    const user = userEvent.setup()
    render(<Example />)

    await open(user, screen.getByTestId('area'))
    await screen.findByRole('menu')
    const items = screen.getAllByRole('menuitem')

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(document.activeElement).toBe(items[0]))

    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(items[1])

    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(items[0])
  })

  it('chooses with Enter and closes', async () => {
    const user = userEvent.setup()
    const chosen: string[] = []
    render(<Example onChoose={(what) => chosen.push(what)} />)

    await open(user, screen.getByTestId('area'))
    await screen.findByRole('menu')
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    await waitFor(() => expect(chosen).toEqual(['duplicate']))
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  it('closes on Escape without choosing anything', async () => {
    const user = userEvent.setup()
    const chosen: string[] = []
    render(<Example onChoose={(what) => chosen.push(what)} />)

    await open(user, screen.getByTestId('area'))
    await screen.findByRole('menu')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(chosen).toEqual([])
  })

  it('names a group by its label', async () => {
    const user = userEvent.setup()
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="area">Right click here</ContextMenuTrigger>
        <ContextMenuPopup>
          <ContextMenuGroup>
            <ContextMenuGroupLabel>Danger</ContextMenuGroupLabel>
            <ContextMenuItem tone="danger">Delete</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuPopup>
      </ContextMenu>,
    )

    await open(user, screen.getByTestId('area'))
    expect(await screen.findByRole('group', { name: 'Danger' })).toBeDefined()
  })

  it('wears the same clothes as Menu rather than its own', async () => {
    // The reuse is the decision this component is built on, so it is pinned:
    // if someone copies the class list back in, these stop matching and the
    // two menus have started to drift.
    const user = userEvent.setup()
    render(<Example />)

    await open(user, screen.getByTestId('area'))
    const popup = await screen.findByRole('menu')
    for (const cls of menuPopupVariants({ size: 'md' }).split(' ')) {
      expect(popup.className, `the popup dropped \`${cls}\``).toContain(cls)
    }

    const [first] = screen.getAllByRole('menuitem')
    for (const cls of menuItemVariants({ tone: 'default' }).split(' ')) {
      expect(first!.className, `the item dropped \`${cls}\``).toContain(cls)
    }
  })

  it('carries no colour outside the vocabulary', async () => {
    const user = userEvent.setup()
    render(<Example />)

    await open(user, screen.getByTestId('area'))
    const popup = await screen.findByRole('menu')
    const all = [popup.className, ...screen.getAllByRole('menuitem').map((i) => i.className)].join(
      ' ',
    )
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', async () => {
    const user = userEvent.setup()
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="area">Right click here</ContextMenuTrigger>
        <ContextMenuPopup className="rounded-full">
          <ContextMenuItem>Rename</ContextMenuItem>
        </ContextMenuPopup>
      </ContextMenu>,
    )

    await open(user, screen.getByTestId('area'))
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
      <ContextMenu>
        <ContextMenuTrigger data-testid="area">Right click here</ContextMenuTrigger>
        <ContextMenuPopup container={host}>
          <ContextMenuItem>Rename</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem tone="danger">Delete</ContextMenuItem>
        </ContextMenuPopup>
      </ContextMenu>,
    )

    await open(user, screen.getByTestId('area'))
    await screen.findByRole('menu')
    const results = await import('axe-core').then((axe) => axe.default.run(host))
    expect(results.violations, JSON.stringify(results.violations.map((v) => v.id))).toEqual([])
  })
})
