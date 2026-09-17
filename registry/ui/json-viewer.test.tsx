// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { JsonViewer } from './json-viewer'

/*
 * What has to be true of a JSON viewer.
 *
 * Two families of defect. The ones that make it lie about the data - a number
 * that arrived as a string drawn like a number, a null drawn as an absence -
 * and the ones that make it unusable from the keyboard, which is how a tree
 * built out of click handlers always ends up.
 */

const deep = { a: { b: { c: 1 } } }

describe('JsonViewer', () => {
  it('opens the top levels rather than the whole document', () => {
    // Expanding everything on arrival is how a viewer freezes the screen it
    // sits on. Two levels is the shape of an answer.
    render(<JsonViewer value={deep} label="Payload" />)
    expect(screen.getByText('"a"')).toBeDefined()
    expect(screen.queryByText('"c"')).toBeNull()
  })

  it('tells a string that looks like a number from a number', () => {
    /*
     * The commonest bug in any payload: `"1"` where `1` was meant. The quotes
     * say it to every reader, the colour says it faster to those who see it -
     * and a viewer that draws them alike is worse than useless, because it
     * hides exactly what the reader opened it to find.
     */
    const { container } = render(<JsonViewer value={{ a: '1', b: 1 }} label="Payload" />)
    expect(screen.getByText('"1"')).toBeDefined()
    expect(container.querySelector('.text-syntax-string')?.textContent).toBe('"1"')
    expect(container.querySelector('.text-syntax-number')?.textContent).toBe('1')
  })

  it('draws a null as the word, not as an empty cell', () => {
    // A key present and null is not a key missing. An empty cell says the
    // second when the data says the first.
    render(<JsonViewer value={{ a: null }} label="Payload" />)
    expect(screen.getByText('null')).toBeDefined()
  })

  it('says how many a branch holds without opening it', () => {
    render(<JsonViewer value={{ xs: [1, 2, 3] }} label="Payload" open={new Set(['$'])} />)
    expect(screen.getByText('[ 3 ]')).toBeDefined()
  })

  it('shows an array position as a position, not as a name', () => {
    // `0` as a key and `0` as an index are not the same thing, and quoting the
    // index would claim the array is an object.
    render(<JsonViewer value={{ xs: ['a'] }} label="Payload" open={new Set(['$', '$.xs'])} />)
    expect(screen.getByText('0')).toBeDefined()
    expect(screen.queryByText('"0"')).toBeNull()
  })

  it('is one tab stop, not one per row', () => {
    /*
     * A document of four hundred rows with a `tabIndex` on each is four
     * hundred stops between whatever is above it and whatever is below. The
     * container is what the keyboard reaches; the arrows move a cursor inside
     * it.
     */
    const { container } = render(<JsonViewer value={deep} label="Payload" />)
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(1)
    expect(container.querySelector('[role="tree"]')?.getAttribute('tabindex')).toBe('0')
  })

  it('moves the cursor with the arrows', async () => {
    render(<JsonViewer value={{ a: 1, b: 2 }} label="Payload" />)
    const tree = screen.getByRole('tree')
    tree.focus()

    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('treeitem')[1]!.getAttribute('aria-selected')).toBe('true')
  })

  it('opens a closed branch with Right and steps into an open one', async () => {
    render(<JsonViewer value={deep} label="Payload" />)
    const tree = screen.getByRole('tree')
    tree.focus()

    // Cursor starts on the root, which is open: Right steps in.
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getAllByRole('treeitem')[1]!.getAttribute('aria-selected')).toBe('true')

    // `$.a` is open too (two levels), so this steps into `$.a.b`, which is
    // closed - and the next Right opens it.
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByText('"c"')).toBeDefined()
  })

  it('does nothing on Right at a leaf, rather than acting as a second Down', async () => {
    // Falling through to the next row would make Right a second Down and lose
    // the reader their place in the nesting - which is the thing the arrows
    // exist to keep.
    render(<JsonViewer value={{ a: 1, b: 2 }} label="Payload" />)
    const tree = screen.getByRole('tree')
    tree.focus()

    // Down onto `a`, a leaf. Right must leave the cursor there.
    await userEvent.keyboard('{ArrowDown}')
    const selected = () =>
      screen.getAllByRole('treeitem').findIndex((row) => row.getAttribute('aria-selected') === 'true')
    expect(selected()).toBe(1)

    await userEvent.keyboard('{ArrowRight}')
    expect(selected()).toBe(1)
  })

  it('leaves a branch with Left, which is how a deep document is navigable', async () => {
    /*
     * The half of the pattern every hand-rolled tree omits. Without it, coming
     * back up from a deep branch means walking through every sibling on the
     * way.
     */
    render(<JsonViewer value={deep} label="Payload" open={new Set(['$', '$.a', '$.a.b'])} />)
    const tree = screen.getByRole('tree')
    tree.focus()

    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    // On `$.a.b.c`, a leaf: Left goes to its parent rather than doing nothing.
    await userEvent.keyboard('{ArrowLeft}')
    const rows = screen.getAllByRole('treeitem')
    expect(rows[2]!.getAttribute('aria-selected')).toBe('true')
  })

  it('closes an open branch with Left before leaving it', async () => {
    // Uncontrolled, because this is about the component changing what it
    // shows. Given `open` it must NOT move on its own - which is the test
    // below.
    render(<JsonViewer value={deep} label="Payload" />)
    const tree = screen.getByRole('tree')
    tree.focus()

    // `$.a` is open on arrival (two levels), so `"b"` is on screen.
    expect(screen.getByText('"b"')).toBeDefined()
    await userEvent.keyboard('{ArrowDown}{ArrowLeft}')
    expect(screen.queryByText('"b"')).toBeNull()
  })

  it('jumps to the ends with Home and End', async () => {
    render(<JsonViewer value={{ a: 1, b: 2, c: 3 }} label="Payload" />)
    const tree = screen.getByRole('tree')
    tree.focus()

    await userEvent.keyboard('{End}')
    const rows = screen.getAllByRole('treeitem')
    expect(rows.at(-1)!.getAttribute('aria-selected')).toBe('true')

    await userEvent.keyboard('{Home}')
    expect(screen.getAllByRole('treeitem')[0]!.getAttribute('aria-selected')).toBe('true')
  })

  it('leaves keys it does not handle to the browser', async () => {
    /*
     * A tree that calls `preventDefault` on every keystroke swallows Tab, and
     * the reader is trapped in it. Only the handled keys are consumed.
     */
    const onKeyDown = vi.fn()
    render(
      <div onKeyDown={onKeyDown}>
        <JsonViewer value={{ a: 1 }} label="Payload" />
      </div>,
    )
    screen.getByRole('tree').focus()

    await userEvent.keyboard('{Tab}')
    const events = onKeyDown.mock.calls.map(([event]) => event as { key: string; defaultPrevented: boolean })
    for (const event of events) {
      if (event.key === 'Tab') expect(event.defaultPrevented).toBe(false)
    }
  })

  it('reports the row that was activated, with its path', async () => {
    // What a product hangs "copy this value" or "copy this path" on.
    const onActivate = vi.fn()
    render(
      <JsonViewer
        value={{ name: 'kilna' }}
        label="Payload"
        open={new Set(['$'])}
        onActivate={onActivate}
      />,
    )
    await userEvent.click(screen.getByText('"kilna"'))
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ path: '$.name', value: 'kilna' }))
  })

  it('tells a controlled product what the reader opened', async () => {
    const onOpenChange = vi.fn()
    render(
      <JsonViewer
        value={{ a: { b: 1 } }}
        label="Payload"
        open={new Set(['$'])}
        onOpenChange={onOpenChange}
      />,
    )
    await userEvent.click(screen.getByText('"a"'))
    expect(onOpenChange).toHaveBeenCalledWith(new Set(['$', '$.a']))
  })

  it('does not open itself when the product holds the state', async () => {
    // A controlled component that also moves on its own is two sources of
    // truth, and the screen flickers between them.
    render(<JsonViewer value={{ a: { b: 1 } }} label="Payload" open={new Set(['$'])} />)
    await userEvent.click(screen.getByText('"a"'))
    expect(screen.queryByText('"b"')).toBeNull()
  })

  it('says how deep each row is, for a screen reader', () => {
    render(<JsonViewer value={deep} label="Payload" />)
    const rows = screen.getAllByRole('treeitem')
    expect(rows[0]!.getAttribute('aria-level')).toBe('1')
    expect(rows[1]!.getAttribute('aria-level')).toBe('2')
  })

  it('says which rows open, and which are open now', () => {
    render(<JsonViewer value={{ a: { b: 1 }, c: 1 }} label="Payload" open={new Set(['$'])} />)
    const rows = screen.getAllByRole('treeitem')
    expect(rows[1]!.getAttribute('aria-expanded')).toBe('false')
    // A leaf is not a branch that happens to be shut: it has no state at all.
    expect(rows[2]!.hasAttribute('aria-expanded')).toBe(false)
  })

  it('is named by the product, not by this component', () => {
    render(<JsonViewer value={{}} label="Webhook payload" />)
    expect(screen.getByRole('tree', { name: 'Webhook payload' })).toBeDefined()
  })

  it('hands selection back, because data is read to be taken away', () => {
    const { container } = render(<JsonViewer value={{}} label="Payload" />)
    expect(container.firstElementChild?.className).toContain('select-text')
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(<JsonViewer value={{}} label="Payload" className="rounded-full" />)
    expect(container.firstElementChild?.className).toContain('rounded-full')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(
      <JsonViewer value={{ a: 'x', b: 1, c: true, d: null }} label="Payload" />,
    )
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('has no accessibility violations', async () => {
    // The ARIA tree pattern is the whole point of this component, so the gate
    // that reads roles and states is the one most worth running on it.
    const { unmount } = await expectNoA11yViolations(
      <JsonViewer value={{ a: { b: 1 }, xs: [1, 2], n: null }} label="Payload" />,
    )
    unmount()
  })
})
