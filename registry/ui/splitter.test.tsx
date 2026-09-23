// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Splitter, SplitterHandle, SplitterPane, boundsOf, moveBoundary, type SplitterProps } from './splitter'

/*
 * What has to be true of a splitter.
 *
 * The handle is a control a screen reader describes by its numbers, so a
 * value that does not follow the boundary is a lie told out loud. The other
 * defects are the arithmetic's: a pane pushed past its minimum or its
 * neighbour's, a collapse that cannot be undone, a drag measured in pixels
 * against a size kept in percent, and a product told about every pointer
 * move rather than once per gesture - which is a write to storage sixty
 * times a second.
 *
 * jsdom has no layout, so the splitter is given a box of 1000 by 500 and the
 * pointer moves across it in pixels that are easy to turn into percent.
 */

beforeAll(() => {
  Object.assign(Element.prototype, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => true),
    getBoundingClientRect: () => ({ width: 1000, height: 500 }) as DOMRect,
  })
})

type Limits = { min?: number; max?: number; collapsible?: boolean; collapsedSize?: number }

function Two({
  first = {},
  second = {},
  ...props
}: Partial<SplitterProps> & { first?: Limits; second?: Limits }) {
  return (
    <Splitter defaultSizes={[30, 70]} {...props}>
      <SplitterPane {...first}>
        <a href="#files">Files</a>
      </SplitterPane>
      <SplitterHandle label="Resize the sidebar" />
      <SplitterPane {...second}>Editor</SplitterPane>
    </Splitter>
  )
}

const handle = (name = 'Resize the sidebar') => screen.getByRole('separator', { name })
const value = (name?: string) => Number(handle(name).getAttribute('aria-valuenow'))
const press = (key: string, shiftKey = false) => fireEvent.keyDown(handle(), { key, shiftKey })

describe('Splitter handle', () => {
  it('is a focusable window splitter pointing at the pane it sizes', () => {
    render(<Two />)
    expect(handle().tabIndex).toBe(0)
    // Side by side, the line between them is upright.
    expect(handle().getAttribute('aria-orientation')).toBe('vertical')
    expect(value()).toBe(30)
    const controlled = document.getElementById(handle().getAttribute('aria-controls')!)
    expect(controlled?.textContent).toBe('Files')
  })

  it('moves by a step on an arrow and by five on Shift, and says so', () => {
    const onSizesChange = vi.fn()
    render(<Two onSizesChange={onSizesChange} />)
    press('ArrowRight')
    expect(value()).toBe(32)
    expect(onSizesChange).toHaveBeenLastCalledWith([32, 68])
    press('ArrowRight', true)
    expect(value()).toBe(42)
    press('ArrowLeft')
    expect(value()).toBe(40)
    expect(onSizesChange).toHaveBeenCalledTimes(3)
  })

  it('takes the arrows of its own axis when the panes are stacked', () => {
    render(<Two orientation="vertical" />)
    expect(handle().getAttribute('aria-orientation')).toBe('horizontal')
    press('ArrowRight')
    expect(value()).toBe(30)
    press('ArrowDown')
    expect(value()).toBe(32)
    press('ArrowUp')
    press('ArrowUp')
    expect(value()).toBe(28)
  })

  it('goes to the ends on Home and End, inside both panes limits', () => {
    // The second pane's minimum is the first pane's maximum from the other
    // side: 100 - 65 = 35, below the first pane's own 40.
    render(<Two first={{ min: 20, max: 40 }} second={{ min: 65 }} />)
    expect(handle().getAttribute('aria-valuemin')).toBe('20')
    expect(handle().getAttribute('aria-valuemax')).toBe('35')
    press('End')
    expect(value()).toBe(35)
    press('Home')
    expect(value()).toBe(20)
    press('ArrowLeft', true)
    expect(value()).toBe(20)
  })

  it('collapses on Enter, hides what it held, and restores the size it had', () => {
    const onSizesChange = vi.fn()
    render(<Two first={{ min: 20, collapsible: true }} onSizesChange={onSizesChange} />)
    const pane = document.getElementById(handle().getAttribute('aria-controls')!)!
    press('Enter')
    expect(value()).toBe(0)
    expect(onSizesChange).toHaveBeenLastCalledWith([0, 100])
    expect(pane.hasAttribute('data-collapsed')).toBe(true)
    // Its link is still in the DOM; without `inert` Tab would reach it.
    expect(pane.hasAttribute('inert')).toBe(true)
    press('Enter')
    expect(value()).toBe(30)
    expect(pane.hasAttribute('inert')).toBe(false)
  })

  it('collapses a pane by arrows once past its minimum, and reopens at the minimum', () => {
    render(<Two first={{ min: 20, collapsible: true }} />)
    expect(handle().getAttribute('aria-valuemin')).toBe('0')
    press('Home')
    expect(value()).toBe(0)
    press('ArrowRight')
    expect(value()).toBe(20)
    press('ArrowLeft')
    expect(value()).toBe(0)
  })

  it('collapses the pane after it when that is the collapsible one', () => {
    // A sidebar on the right is the second pane of its handle.
    render(<Two second={{ collapsible: true, min: 20 }} />)
    press('Enter')
    expect(value()).toBe(100)
  })

  it('does nothing on Enter when neither pane collapses', () => {
    const onSizesChange = vi.fn()
    render(<Two onSizesChange={onSizesChange} />)
    press('Enter')
    expect(value()).toBe(30)
    expect(onSizesChange).not.toHaveBeenCalled()
  })

  it('follows a drag in percent of the splitter, and reports once, on release', () => {
    const onSizesChange = vi.fn()
    render(<Two onSizesChange={onSizesChange} />)
    fireEvent.pointerDown(handle(), { button: 0, clientX: 300 })
    fireEvent.pointerMove(handle(), { clientX: 400 })
    expect(value()).toBe(40)
    fireEvent.pointerMove(handle(), { clientX: 450 })
    expect(value()).toBe(45)
    expect(onSizesChange).not.toHaveBeenCalled()
    fireEvent.pointerUp(handle(), { clientX: 450 })
    expect(onSizesChange).toHaveBeenCalledTimes(1)
    expect(onSizesChange).toHaveBeenCalledWith([45, 55])
  })

  it('clamps a drag to the limits and snaps a collapsible pane to the nearer end', () => {
    render(<Two first={{ min: 20, max: 50, collapsible: true }} />)
    fireEvent.pointerDown(handle(), { button: 0, clientX: 300 })
    fireEvent.pointerMove(handle(), { clientX: 900 })
    expect(value()).toBe(50)
    fireEvent.pointerMove(handle(), { clientX: 150 })
    expect(value()).toBe(20)
    fireEvent.pointerMove(handle(), { clientX: 50 })
    expect(value()).toBe(0)
  })

  it('ignores any button but the primary one', () => {
    render(<Two />)
    fireEvent.pointerDown(handle(), { button: 2, clientX: 300 })
    fireEvent.pointerMove(handle(), { clientX: 400 })
    expect(value()).toBe(30)
  })

  it('moves only the two panes beside the handle when there are three', () => {
    render(
      <Splitter defaultSizes={[20, 50, 30]}>
        <SplitterPane>Tree</SplitterPane>
        <SplitterHandle label="Resize the tree" />
        <SplitterPane>Editor</SplitterPane>
        <SplitterHandle label="Resize the preview" />
        <SplitterPane>Preview</SplitterPane>
      </Splitter>,
    )
    fireEvent.keyDown(handle('Resize the preview'), { key: 'ArrowRight' })
    expect(value('Resize the preview')).toBe(52)
    expect(value('Resize the tree')).toBe(20)
    expect(screen.getByText('Preview').style.flex).toMatch(/^28 1 0(px)?/)
  })

  it('shares the room equally when no sizes are given', () => {
    render(
      <Splitter>
        <SplitterPane>One</SplitterPane>
        <SplitterHandle label="Resize one" />
        <SplitterPane>Two</SplitterPane>
      </Splitter>,
    )
    expect(value('Resize one')).toBe(50)
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Two />)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('grows its hit area to the floor while drawing a pixel', () => {
    render(<Two />)
    expect(handle().className).toMatch(/(^|\s)target-min(\s|$)/)
    expect(handle().className).toMatch(/(^|\s)w-px(\s|$)/)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(<Two first={{ collapsible: true }} />)
    unmount()
  })
})

describe('moveBoundary', () => {
  it('keeps the pair summing to what it was', () => {
    const next = moveBoundary([20, 50, 30], 1, 61.237, [{}, {}, {}])
    expect(next).toEqual([20, 61.24, 18.76])
  })

  it('bounds the pane by its neighbour as well as by itself', () => {
    expect(boundsOf([50, 50], 0, [{ min: 10, max: 90 }, { min: 30, max: 70 }])).toEqual([30, 70])
  })
})
