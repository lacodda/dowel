// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { TreeView } from './tree-view'
import type { TreeNode } from './tree-rows'

/*
 * TreeView.
 *
 * The tests are mostly about the keyboard, because that is the half a
 * hand-rolled tree leaves out - and it leaves it out invisibly: the tree looks
 * finished, and only someone without a mouse finds out that Left does nothing
 * and that there are four hundred tab stops before the editor.
 */

const nodes: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'app', label: 'App.tsx' },
      {
        id: 'ui',
        label: 'ui',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'input', label: 'Input.tsx' },
        ],
      },
    ],
  },
  { id: 'readme', label: 'README.md' },
  { id: 'empty', label: 'empty', empty: true },
]

const row = (name: string) => screen.getByRole('treeitem', { name })
const cursor = () => screen.getByRole('tree').getAttribute('aria-activedescendant')

describe('the keyboard, which is the half that gets left out', () => {
  it('is one tab stop, not one per node', async () => {
    // A `tabIndex` per row is how a sidebar of four hundred files becomes four
    // hundred stops between it and the editor.
    render(<TreeView nodes={nodes} label="Files" />)
    const stops = screen
      .getAllByRole('treeitem')
      .filter((node) => node.hasAttribute('tabindex'))
    expect(stops).toHaveLength(0)
    expect(screen.getByRole('tree').getAttribute('tabindex')).toBe('0')
  })

  it('moves the cursor down and up', async () => {
    render(<TreeView nodes={nodes} label="Files" />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}')
    expect(cursor()).toBe('tree-readme')
    await userEvent.keyboard('{ArrowUp}')
    expect(cursor()).toBe('tree-src')
  })

  it('opens a closed folder with Right, then steps into it', async () => {
    // Two presses rather than one that does both: opening a folder and moving
    // into it are different intents, and a reader who only wanted to look
    // inside would have lost the row they were on.
    render(<TreeView nodes={nodes} label="Files" />)
    await userEvent.tab()

    await userEvent.keyboard('{ArrowRight}')
    expect(row('src').getAttribute('aria-expanded')).toBe('true')
    expect(cursor()).toBe('tree-src')

    await userEvent.keyboard('{ArrowRight}')
    expect(cursor()).toBe('tree-app')
  })

  it('does nothing on Right at a leaf', async () => {
    render(<TreeView nodes={nodes} open={new Set(['src'])} label="Files" />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}{ArrowRight}')
    expect(cursor()).toBe('tree-app')
  })

  it('closes an open folder with Left', async () => {
    const onOpenChange = vi.fn()
    render(<TreeView nodes={nodes} label="Files" onOpenChange={onOpenChange} />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}{ArrowLeft}')
    expect(row('src').getAttribute('aria-expanded')).toBe('false')
  })

  it('jumps out to the parent with Left, rather than up one row', async () => {
    /* The escape from a deep folder, and the part hand-rolled trees leave out:
     * without it the only way back to the parent is through every sibling.
     *
     * The cursor starts on the *second* child on purpose. From the first,
     * "up one row" and "out to the parent" land on the same node, and the test
     * passes either way - which is what it did until a mutation showed it. */
    render(<TreeView nodes={nodes} open={new Set(['src', 'ui'])} label="Files" />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(cursor()).toBe('tree-input')

    await userEvent.keyboard('{ArrowLeft}')
    // Up one row would be `button`.
    expect(cursor()).toBe('tree-ui')
  })

  it('goes to the first and last visible row', async () => {
    render(<TreeView nodes={nodes} open={new Set(['src'])} label="Files" />)
    await userEvent.tab()
    await userEvent.keyboard('{End}')
    expect(cursor()).toBe('tree-empty')
    await userEvent.keyboard('{Home}')
    expect(cursor()).toBe('tree-src')
  })

  it('chooses a leaf with Enter, and opens a folder with it', async () => {
    // Uncontrolled, so the tree owns the open set: passing `open` makes it a
    // controlled component that deliberately does not change itself, which is
    // what "can be driven from outside" asserts below.
    const onSelect = vi.fn()
    render(<TreeView nodes={nodes} label="Files" onSelect={onSelect} />)
    await userEvent.tab()

    // Enter on a folder opens it.
    await userEvent.keyboard('{Enter}')
    expect(row('src').getAttribute('aria-expanded')).toBe('true')

    // Enter on a leaf chooses it.
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith('app')

    // And again on the folder closes it.
    await userEvent.keyboard('{Home}{Enter}')
    expect(row('src').getAttribute('aria-expanded')).toBe('false')
  })

  it('does not walk off either end', async () => {
    render(<TreeView nodes={nodes} label="Files" />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(cursor()).toBe('tree-src')
    await userEvent.keyboard('{End}{ArrowDown}{ArrowDown}')
    expect(cursor()).toBe('tree-empty')
  })
})

describe('what it announces', () => {
  it('says which folders open and which do not', () => {
    render(<TreeView nodes={nodes} open={new Set(['src'])} label="Files" />)
    expect(row('src').getAttribute('aria-expanded')).toBe('true')
    // A leaf must not claim to be collapsed - it never opens.
    expect(row('App.tsx').hasAttribute('aria-expanded')).toBe(false)
    // An empty folder does open, and says so.
    expect(row('empty').getAttribute('aria-expanded')).toBe('false')
  })

  it('says how deep a row is', () => {
    render(<TreeView nodes={nodes} open={new Set(['src', 'ui'])} label="Files" />)
    expect(row('src').getAttribute('aria-level')).toBe('1')
    expect(row('ui').getAttribute('aria-level')).toBe('2')
    expect(row('Button.tsx').getAttribute('aria-level')).toBe('3')
  })

  it('publishes the cursor rather than only drawing it', () => {
    // What makes the tree one control instead of a collection of rows: this is
    // the attribute a screen reader follows.
    render(<TreeView nodes={nodes} label="Files" />)
    expect(cursor()).toBe('tree-src')
  })

  it('starts the cursor on what is selected, not at the top', async () => {
    // Arrowing into a tree continues from the file being edited rather than
    // from the first row, which is halfway up a long sidebar.
    render(<TreeView nodes={nodes} open={new Set(['src'])} selected="app" label="Files" />)
    expect(cursor()).toBe('tree-app')
  })

  it('says which row is chosen rather than only colouring it', () => {
    render(<TreeView nodes={nodes} open={new Set(['src'])} selected="app" label="Files" />)
    expect(row('App.tsx').getAttribute('aria-selected')).toBe('true')
    expect(row('README.md').hasAttribute('aria-selected')).toBe(false)
  })

  it('keeps the twisty out of the reader’s way', () => {
    // The arrow is the sighted half of `aria-expanded`; announcing both reads
    // the state out twice.
    render(<TreeView nodes={nodes} label="Files" />)
    expect(row('src').textContent).toContain('▸')
    expect(screen.getByRole('treeitem', { name: 'src' })).toBeDefined()
  })
})

describe('the rest', () => {
  it('can be driven from outside', async () => {
    const onOpenChange = vi.fn()
    render(<TreeView nodes={nodes} open={new Set()} onOpenChange={onOpenChange} label="Files" />)
    await userEvent.click(row('src'))
    expect(onOpenChange).toHaveBeenCalled()
    // Controlled: the tree does not open itself behind the caller's back.
    expect(row('src').getAttribute('aria-expanded')).toBe('false')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<TreeView nodes={nodes} open={new Set(['src'])} label="Files" />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe, open and closed', async () => {
    const closed = await expectNoA11yViolations(<TreeView nodes={nodes} label="Files" />)
    closed.unmount()
    await expectNoA11yViolations(
      <TreeView nodes={nodes} open={new Set(['src', 'ui'])} selected="button" label="Files" />,
    )
  })
})
