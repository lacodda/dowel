// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Tabs, TabsList, TabsPanel, TabsTab } from './tabs'

/*
 * Tabs.
 *
 * The behaviour is Base UI's and is not re-tested here beyond proving it is
 * wired. What this file holds is what dowel adds: the document tab that
 * closes without nesting one control in another, and the unsaved dot that a
 * reader hears as words.
 */

function Sections() {
  return (
    <Tabs defaultValue="general">
      <TabsList aria-label="Settings">
        <TabsTab value="general">General</TabsTab>
        <TabsTab value="storage">Storage</TabsTab>
        <TabsTab value="about">About</TabsTab>
      </TabsList>
      <TabsPanel value="general">General settings</TabsPanel>
      <TabsPanel value="storage">Storage settings</TabsPanel>
      <TabsPanel value="about">About this app</TabsPanel>
    </Tabs>
  )
}

function Documents({ onClose = () => undefined }: { onClose?: (name: string) => void }) {
  return (
    <Tabs defaultValue="notes.md">
      <TabsList variant="bar" aria-label="Open documents">
        <TabsTab value="notes.md" onClose={() => onClose('notes.md')} closeLabel="Close notes.md">
          notes.md
        </TabsTab>
        <TabsTab
          value="plan.md"
          modified
          modifiedLabel="unsaved changes"
          onClose={() => onClose('plan.md')}
          closeLabel="Close plan.md"
        >
          plan.md
        </TabsTab>
      </TabsList>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('is a tab list whose tabs show their panels', async () => {
    const user = userEvent.setup()
    render(<Sections />)
    expect(screen.getByRole('tablist', { name: 'Settings' })).toBeDefined()
    expect(screen.getByRole('tabpanel').textContent).toBe('General settings')

    await user.click(screen.getByRole('tab', { name: 'Storage' }))
    expect(screen.getByRole('tab', { name: 'Storage' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toBe('Storage settings')
  })

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<Sections />)
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'General' }))
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Storage' }))
  })

  it('draws the sliding rule under line tabs only', () => {
    // The bar marks its active tab with the tab's own ground and top edge; an
    // underline there would sit on the window's content.
    const holdsATab = (node: Element) => node.getAttribute('role') === 'tab' || node.querySelector('[role="tab"]')
    const { unmount } = render(<Sections />)
    expect([...screen.getByRole('tablist').children].filter((node) => !holdsATab(node))).toHaveLength(1)
    unmount()
    render(<Documents />)
    expect([...screen.getByRole('tablist').children].filter((node) => !holdsATab(node))).toHaveLength(0)
  })

  it('passes the accessibility gate, both shapes', async () => {
    await expectNoA11yViolations(<Sections />)
    // The one that matters: a closable tab must not nest its cross inside
    // itself, which axe reports as nested-interactive.
    await expectNoA11yViolations(<Documents />)
  })
})

describe('a document tab', () => {
  it('closes from its cross', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Documents onClose={onClose} />)
    await user.click(screen.getByTitle('Close plan.md'))
    expect(onClose).toHaveBeenCalledWith('plan.md')
  })

  it('keeps the cross out of the tab order and out of the reading', () => {
    render(<Documents />)
    const cross = screen.getByTitle('Close notes.md')
    expect(cross.getAttribute('tabindex')).toBe('-1')
    expect(cross.getAttribute('aria-hidden')).toBe('true')
    expect(cross.closest('[role="tab"]')).toBeNull()
  })

  it('closes with Delete, and says so', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Documents onClose={onClose} />)
    const tab = screen.getByRole('tab', { name: 'notes.md' })
    expect(tab.getAttribute('aria-keyshortcuts')).toBe('Delete')
    tab.focus()
    await user.keyboard('{Delete}')
    expect(onClose).toHaveBeenCalledWith('notes.md')
  })

  it('closes on a middle click', () => {
    const onClose = vi.fn()
    render(<Documents onClose={onClose} />)
    fireEvent(screen.getByRole('tab', { name: 'notes.md' }), new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    expect(onClose).toHaveBeenCalledWith('notes.md')
  })

  it('ignores other buttons', () => {
    const onClose = vi.fn()
    render(<Documents onClose={onClose} />)
    fireEvent(screen.getByRole('tab', { name: 'notes.md' }), new MouseEvent('auxclick', { bubbles: true, button: 2 }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('reads its unsaved changes as words', () => {
    render(<Documents />)
    expect(screen.getByRole('tab', { name: 'plan.md unsaved changes' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'notes.md' })).toBeDefined()
  })

  it('will not take a dot without its words', () => {
    // @ts-expect-error `modified` needs `modifiedLabel`
    const tab = <TabsTab value="x" modified>x</TabsTab>
    // @ts-expect-error `onClose` needs `closeLabel`
    const other = <TabsTab value="y" onClose={() => undefined}>y</TabsTab>
    expect([tab, other]).toHaveLength(2)
  })

  it('does not offer to close a tab that cannot', () => {
    render(<Sections />)
    expect(screen.getByRole('tab', { name: 'General' }).hasAttribute('aria-keyshortcuts')).toBe(false)
  })
})

describe('the shapes', () => {
  it('stands a line tab on the small control row, so density reaches it', () => {
    // It said `h-9` literally, and a compact screen kept 36px tabs over 28px
    // buttons.
    render(<Sections />)
    const tab = screen.getByRole('tab', { name: 'General' })
    expect(tab.className.split(/\s+/)).toContain('h-control-sm')
    expect(tab.className).not.toMatch(/\bh-\d/)
  })

  it('sizes an icon beside the name, and leaves a sized one alone', () => {
    render(<Sections />)
    expect(screen.getByRole('tab', { name: 'General' }).className).toContain(
      '[&_svg:not([class*=size-])]:size-3.5',
    )
  })

  it('lets the caller win a conflict', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList className="gap-4" aria-label="x">
          <TabsTab value="a" className="px-6">
            A
          </TabsTab>
        </TabsList>
      </Tabs>,
    )
    expect(screen.getByRole('tablist').className).toContain('gap-4')
    expect(screen.getByRole('tab').className).toContain('px-6')
    expect(screen.getByRole('tab').className).not.toContain('px-3')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Documents />)
    const classes = [...container.querySelectorAll('*')].map((node) => node.getAttribute('class') ?? '').join(' ')
    expect(classes).not.toMatch(/\bdark:/)
    expect(classes).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})
