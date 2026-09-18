// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ReorderGrip, ReorderIndicator, useReorder } from './reorderable-list'

/*
 * What has to be true of a reorderable list.
 *
 * The move is reported once, on the drop, with the index in the list as it
 * will be - not the slot in the list as it is, which is off by one for every
 * drop below the row's own place. The defects are that arithmetic, a move
 * fired on every crossed row, a line drawn where a drop would change
 * nothing, and a keyboard path that plain arrows cannot reach.
 */

beforeAll(() => {
  Object.assign(Element.prototype, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => false),
  })
})

const ROW = 20

/** Three rows of twenty pixels each, stacked from the top of the list. */
function List({ onMove, order = ['a', 'b', 'c'] }: { onMove: (id: string, to: number) => void; order?: string[] }) {
  const reorder = useReorder<string>({ order, onMove })
  return (
    <ul
      {...reorder.listProps}
      ref={(list) => {
        reorder.listProps.ref(list)
        if (list) list.getBoundingClientRect = () => ({ top: 0 }) as DOMRect
      }}
      className="relative"
      data-testid="list"
    >
      {order.map((id, index) => (
        <li
          key={id}
          tabIndex={0}
          {...reorder.rowProps(id)}
          ref={(row) => {
            reorder.rowProps(id).ref(row)
            if (row) row.getBoundingClientRect = () => ({ top: index * ROW, bottom: index * ROW + ROW }) as DOMRect
          }}
        >
          {id}
          <ReorderGrip {...reorder.gripProps(id)} data-testid={`grip-${id}`} />
        </li>
      ))}
      <ReorderIndicator offset={reorder.slotOffset} />
    </ul>
  )
}

const drag = (id: string, toY: number, release = true) => {
  const grip = screen.getByTestId(`grip-${id}`)
  fireEvent.pointerDown(grip, { button: 0, clientY: 5 })
  fireEvent.pointerMove(grip, { clientY: toY })
  if (release) fireEvent.pointerUp(grip, { clientY: toY })
}

describe('useReorder', () => {
  it('moves the row once, on the drop, to where it will be', () => {
    // Dropping the first row below the third: slot 3 in the list as drawn,
    // index 2 once the row is gone from the top.
    const onMove = vi.fn()
    render(<List onMove={onMove} />)
    drag('a', 55)
    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onMove).toHaveBeenCalledWith('a', 2)
  })

  it('moves a row up as well', () => {
    const onMove = vi.fn()
    render(<List onMove={onMove} />)
    drag('c', 2)
    expect(onMove).toHaveBeenCalledWith('c', 0)
  })

  it('reports nothing during the drag', () => {
    const onMove = vi.fn()
    render(<List onMove={onMove} />)
    drag('a', 55, false)
    fireEvent.pointerMove(screen.getByTestId('grip-a'), { clientY: 35 })
    expect(onMove).not.toHaveBeenCalled()
  })

  it('reports nothing for a drop back where the row is', () => {
    const onMove = vi.fn()
    render(<List onMove={onMove} />)
    drag('b', 25)
    expect(onMove).not.toHaveBeenCalled()
  })

  it('draws the line where the drop would go, and nowhere it would not', () => {
    const { container } = render(<List onMove={() => {}} />)
    drag('a', 55, false)
    const line = container.querySelector('[data-reorder-indicator]') as HTMLElement
    expect(line).not.toBeNull()
    // Below the last row: its bottom edge.
    expect(line.style.top).toBe('60px')

    fireEvent.pointerMove(screen.getByTestId('grip-a'), { clientY: 15 })
    expect(container.querySelector('[data-reorder-indicator]')).toBeNull()
  })

  it('moves the focused row with Alt and an arrow', () => {
    const onMove = vi.fn()
    render(<List onMove={onMove} />)
    fireEvent.keyDown(screen.getByText('a'), { key: 'ArrowDown', altKey: true })
    expect(onMove).toHaveBeenCalledWith('a', 1)
    fireEvent.keyDown(screen.getByText('c'), { key: 'ArrowUp', altKey: true })
    expect(onMove).toHaveBeenCalledWith('c', 1)
  })

  it('leaves a plain arrow to walk the list', () => {
    const onMove = vi.fn()
    render(<List onMove={onMove} />)
    fireEvent.keyDown(screen.getByText('a'), { key: 'ArrowDown' })
    expect(onMove).not.toHaveBeenCalled()
  })

  it('does not move a row off either end', () => {
    const onMove = vi.fn()
    render(<List onMove={onMove} />)
    fireEvent.keyDown(screen.getByText('a'), { key: 'ArrowUp', altKey: true })
    fireEvent.keyDown(screen.getByText('c'), { key: 'ArrowDown', altKey: true })
    expect(onMove).not.toHaveBeenCalled()
  })

  it('keeps the click after a drop from reaching the row', () => {
    // In a menu that click would toggle the item that was only meant to be
    // moved.
    const onRowClick = vi.fn()
    render(
      <ul onClick={onRowClick}>
        <List onMove={() => {}} />
      </ul>,
    )
    fireEvent.click(screen.getByTestId('grip-a'))
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('hides the grip and the line from a screen reader', () => {
    const { container } = render(<List onMove={() => {}} />)
    expect(screen.getByTestId('grip-a').getAttribute('aria-hidden')).toBe('true')
    drag('a', 55, false)
    expect(container.querySelector('[data-reorder-indicator]')!.getAttribute('aria-hidden')).toBe('true')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<List onMove={() => {}} />)
    drag('a', 55, false)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(<List onMove={() => {}} />)
    unmount()
  })
})
