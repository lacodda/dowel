// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { NavGroup, NavRail, NavSpacer, navRailVariants, type NavRailItem } from './nav-rail'

const items: NavRailItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'calendar', label: 'Calendar' },
]

describe('NavRail', () => {
  it('draws every destination it is given', () => {
    render(<NavRail label="Screens" items={items} />)
    for (const item of items) expect(screen.getByText(item.label as string)).toBeDefined()
  })

  it('names the landmark, so two navs on one page are told apart', () => {
    // A product with a rail AND a phone's bottom bar has exactly that.
    render(<NavRail label="Screens" items={items} />)
    expect(screen.getByRole('navigation', { name: 'Screens' })).toBeDefined()
  })

  it('announces the current destination, not only tints it', () => {
    // Colour says it to nobody who cannot see it.
    render(<NavRail label="Screens" items={items} activeId="calendar" />)
    expect(screen.getByRole('button', { name: 'Calendar' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Dashboard' }).getAttribute('aria-current')).toBeNull()
  })

  it('says which entry was pressed', async () => {
    const onSelect = vi.fn()
    render(<NavRail label="Screens" items={items} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Catalogue' }))
    expect(onSelect).toHaveBeenCalledWith('catalogue')
  })

  it('draws an entry as the element the product navigates with', () => {
    // The registry has no business installing a router: the product hands in
    // its own link and the rail puts the clothes on it.
    render(
      <NavRail
        label="Screens"
        items={items}
        activeId="dashboard"
        render={(item) => <a href={`/${item.id}`} />}
      />,
    )
    const link = screen.getByRole('link', { name: 'Dashboard' })
    expect(link.getAttribute('href')).toBe('/dashboard')
    expect(link.getAttribute('aria-current')).toBe('page')
    expect(link.className, 'the row lost its clothes').toContain('rounded-md')
  })

  it('leaves a destination that does not exist yet out of the tab order', () => {
    render(<NavRail label="Screens" items={[{ id: 'notes', label: 'Notes', soon: true }]} />)
    expect(screen.queryByRole('button', { name: 'Notes' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Notes' })).toBeNull()
    // The entry itself, not the label span inside it.
    expect(screen.getByText('Notes').parentElement!.getAttribute('aria-disabled')).toBe('true')
  })

  it('does not make a link of a destination that is not built', async () => {
    // Even when the product hands one in: a link to a screen that does not
    // exist is a dead end wearing a working entry's clothes.
    const onSelect = vi.fn()
    render(
      <NavRail
        label="Screens"
        items={[{ id: 'notes', label: 'Notes', soon: true }]}
        render={(item) => <a href={`/${item.id}`} />}
        onSelect={onSelect}
      />,
    )
    expect(screen.queryByRole('link')).toBeNull()
    await userEvent.click(screen.getByText('Notes'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('draws all three shapes, and draws each one differently', () => {
    const base = navRailVariants({ layout: 'nonexistent' as never })
    const layouts = ['column', 'row', 'bar'] as const
    const drawn = new Map(layouts.map((layout) => [layout, navRailVariants({ layout })]))
    for (const [layout, classes] of drawn) {
      expect(classes, `\`${layout}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two shapes draw the same').toBe(layouts.length)
  })

  it('runs the column the height of the window', () => {
    // Its foot sits at the bottom because the nav reaches it, not because the
    // content does.
    expect(navRailVariants({ layout: 'column' })).toContain('h-full')
  })

  it('clears the phone bar of the home indicator', () => {
    // Without it the last row of entries sits under the bar with no way to
    // scroll out from under it.
    expect(navRailVariants({ layout: 'bar' })).toContain('env(safe-area-inset-bottom)')
  })

  it('keeps a label to one line', () => {
    // A rail is a fixed-width column; a label that wraps makes one row taller
    // than the rest, which in a two-language product happens to one entry.
    render(<NavRail label="Screens" items={[{ id: 'a', label: 'A very long destination name' }]} />)
    const label = screen.getByText('A very long destination name')
    expect(label.className).toContain('truncate')
    expect(label.className, 'a flex child will not shrink below its content without this').toContain(
      'min-w-0',
    )
  })

  /*
   * Found on the stand, not here: the `row` entry had no `flex`, so the icon
   * and the label stacked and the header stood at twice its height. Every
   * class-list assertion passed - they read the string the component builds,
   * and `display` is not in it unless somebody asks.
   *
   * So the question is asked of all three shapes at once. An entry is an icon
   * and a word, and the only argument is which way they run: side by side in
   * a rail and a tab, stacked in a phone bar where the width is a quarter of
   * the screen.
   */
  it.each([
    ['column', false],
    ['row', false],
    ['bar', true],
  ] as const)('lays out a %s entry as a flex box, stacking only in the bar', (layout, stacks) => {
    render(
      <NavRail
        layout={layout}
        label="Screens"
        items={[{ id: 'a', label: 'Dashboard', icon: <svg /> }]}
      />,
    )
    const entry = screen.getByRole('button', { name: 'Dashboard' })
    expect(entry.className, `a \`${layout}\` entry is a block - its icon and label stack`).toMatch(
      /\bflex\b/,
    )
    expect(entry.className.includes('flex-col'), `a \`${layout}\` entry runs the wrong way`).toBe(
      stacks,
    )
  })

  it('clears the pointer target floor where the entry is small', () => {
    // A column entry is already taller than 24px; a tab in a header and a
    // cell in a phone bar are the two that need help.
    render(<NavRail layout="row" label="Screens" items={items} />)
    expect(screen.getByRole('button', { name: 'Dashboard' }).className).toContain('target-min')
  })

  it('draws the end slot only where there is width for it', () => {
    const withEnd: NavRailItem[] = [{ id: 'journal', label: 'Journal', end: '12' }]
    const { unmount } = render(<NavRail label="Screens" items={withEnd} />)
    expect(screen.getByText('12')).toBeDefined()
    unmount()

    render(<NavRail layout="bar" label="Screens" items={withEnd} />)
    expect(screen.queryByText('12'), 'a phone bar has no room for a count').toBeNull()
  })
})

describe('NavGroup and NavSpacer', () => {
  it('captions a run of entries without entering the outline', () => {
    // Six `h3`s inside a nav put six entries into a reader's document map
    // that lead nowhere.
    render(<NavGroup>Library</NavGroup>)
    expect(screen.getByText('Library').tagName).toBe('DIV')
    expect(screen.getByText('Library').className).toContain('caption')
  })

  it('pushes the foot of the rail to the bottom', () => {
    render(<NavSpacer>settings</NavSpacer>)
    expect(screen.getByText('settings').className).toContain('mt-auto')
  })
})

describe('NavRail, for a reader', () => {
  it('passes axe in every shape', async () => {
    for (const layout of ['column', 'row', 'bar'] as const) {
      const { unmount } = await expectNoA11yViolations(
        <NavRail layout={layout} label="Screens" items={items} activeId="dashboard" />,
      )
      unmount()
    }
  })

  it('passes axe with links, a group, a spacer and a roadmap entry', async () => {
    await expectNoA11yViolations(
      <NavRail
        label="Screens"
        items={[...items, { id: 'notes', label: 'Notes', soon: true }]}
        activeId="calendar"
        render={(item) => <a href={`/${item.id}`} />}
      />,
    )
  })
})

describe('NavRail, collapsed', () => {
  it('keeps every name in the entry, off the screen', () => {
    // A reader hears the same rail wide or narrow.
    render(<NavRail label="Screens" items={items} activeId="catalogue" collapsed />)
    const entry = screen.getByRole('button', { name: 'Catalogue' })
    expect(entry.getAttribute('aria-current')).toBe('page')
    expect(screen.getByText('Catalogue').className).toContain('sr-only')
  })

  it('draws each entry as a square around its icon', () => {
    render(<NavRail label="Screens" items={items} collapsed />)
    expect(screen.getByRole('button', { name: 'Dashboard' }).className).toContain('size-9')
  })

  it('shows the name in a tooltip on keyboard focus, not only on hover', async () => {
    render(<NavRail label="Screens" items={items} collapsed />)
    expect(screen.getAllByText('Dashboard')).toHaveLength(1)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Dashboard' }))
    // The entry's own hidden name, and now the visible one beside it.
    await waitFor(() => expect(screen.getAllByText('Dashboard')).toHaveLength(2))
  })

  it('still selects on a press through the tooltip wrapper', async () => {
    const onSelect = vi.fn()
    render(<NavRail label="Screens" items={items} collapsed onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Calendar' }))
    expect(onSelect).toHaveBeenCalledWith('calendar')
  })

  it('keeps the product link as the entry', () => {
    render(
      <NavRail label="Screens" items={items} collapsed render={(item) => <a href={`/${item.id}`} />} />,
    )
    const link = screen.getByRole('link', { name: 'Calendar' })
    expect(link.getAttribute('href')).toBe('/calendar')
    expect(link.hasAttribute('type')).toBe(false)
  })

  it('drops the end slot, which has no room', () => {
    render(<NavRail label="Screens" items={[{ id: 'journal', label: 'Journal', end: '12' }]} collapsed />)
    expect(screen.queryByText('12')).toBeNull()
  })

  it('has no narrow form of a row or a bar', () => {
    // Tabs and a phone bar are made of their names.
    render(<NavRail layout="row" label="Screens" items={items} collapsed />)
    expect(screen.getByText('Dashboard').className).not.toContain('sr-only')
  })

  it('marks a group with a hairline and keeps its word for a reader', () => {
    render(<NavGroup collapsed>Library</NavGroup>)
    const word = screen.getByText('Library')
    expect(word.className).toContain('sr-only')
    expect(word.parentElement?.className).toContain('h-px')
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(
      <div>
        <NavRail label="Screens" items={items} activeId="catalogue" collapsed />
        <NavGroup collapsed>Library</NavGroup>
      </div>,
    )
  })
})

describe('NavRail, collapsed, with an entry that has no icon', () => {
  it('draws the initial rather than an empty square', () => {
    // Measured on the stand: a foot entry with no icon collapsed into a 36px
    // button with nothing in it.
    render(<NavRail label="Settings" items={[{ id: 'settings', label: 'Settings' }]} collapsed />)
    const entry = screen.getByRole('button', { name: 'Settings' })
    const initial = entry.querySelector('[aria-hidden]')
    expect(initial?.textContent).toBe('S')
  })

  it('draws no initial while the rail is wide', () => {
    render(<NavRail label="Settings" items={[{ id: 'settings', label: 'Settings' }]} />)
    expect(screen.getByRole('button', { name: 'Settings' }).querySelector('[aria-hidden]')).toBeNull()
  })
})
