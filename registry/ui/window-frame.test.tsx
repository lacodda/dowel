// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ResizeEdges, WindowButtons, useTitleBarGestures } from './window-frame'

/*
 * What has to be true of a window's own frame.
 *
 * None of this can be seen: the window is the system's, and the only trace of
 * a gesture is which of its methods was called. So the Tauri window is a set
 * of spies, and each test is about which spy fired - and, as often, which one
 * did not. The defects this file remembers are all of the second kind: a drag
 * that started on the press and ate the double click, a resize strip left in
 * place over a maximised window's title bar.
 */

const tauri = vi.hoisted(() => ({
  maximized: false,
  minimize: vi.fn(() => Promise.resolve()),
  toggleMaximize: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
  startDragging: vi.fn(() => Promise.resolve()),
  startResizeDragging: vi.fn(() => Promise.resolve()),
  onResized: vi.fn(() => Promise.resolve(() => undefined)),
}))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    ...tauri,
    isMaximized: () => Promise.resolve(tauri.maximized),
  }),
}))

const labels = { minimize: 'Minimize', maximize: 'Maximize', restore: 'Restore', close: 'Close' }

/** What the component checks for before touching the window. */
const bridge = window as unknown as { __TAURI_INTERNALS__?: object }

beforeEach(() => {
  bridge.__TAURI_INTERNALS__ = {}
  tauri.maximized = false
})

afterEach(() => {
  delete bridge.__TAURI_INTERNALS__
  vi.clearAllMocks()
})

/** A title bar with the gestures on it and a control inside, as a product
 * would write it. */
function Bar() {
  const gestures = useTitleBarGestures()
  return (
    <header data-testid="bar" {...gestures}>
      <button type="button">Menu</button>
    </header>
  )
}

/** The press that starts a title-bar gesture: the primary button, at a point. */
const press = (target: Element, x = 0, y = 0) =>
  fireEvent.pointerDown(target, { button: 0, clientX: x, clientY: y })

describe('WindowButtons', () => {
  it('minimises, toggles and closes through the window', async () => {
    render(<WindowButtons labels={labels} />)

    await userEvent.click(screen.getByRole('button', { name: 'Minimize' }))
    expect(tauri.minimize).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Maximize' }))
    expect(tauri.toggleMaximize).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(tauri.close).toHaveBeenCalledTimes(1)
  })

  it('offers to restore once the window is maximised', async () => {
    // The state is the window's, not the last click's: a snap layout
    // maximises without us, and the button has to follow.
    tauri.maximized = true
    render(<WindowButtons labels={labels} />)
    expect(await screen.findByRole('button', { name: 'Restore' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Maximize' })).toBeNull()
  })

  it('does nothing outside Tauri rather than throwing', async () => {
    // A browser, a storybook, the stand: the chrome renders and stays inert.
    delete bridge.__TAURI_INTERNALS__
    render(<WindowButtons labels={labels} />)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(tauri.close).not.toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(<WindowButtons labels={labels} />)
    unmount()
  })
})

describe('useTitleBarGestures', () => {
  it('drags once the pointer has moved past the threshold', () => {
    render(<Bar />)
    press(screen.getByTestId('bar'))
    fireEvent.pointerMove(window, { clientX: 12, clientY: 0 })
    expect(tauri.startDragging).toHaveBeenCalledTimes(1)
  })

  it('does not drag on the press alone', () => {
    // Handing the window to the system on the press is what ate the second
    // click of every double click.
    render(<Bar />)
    press(screen.getByTestId('bar'))
    expect(tauri.startDragging).not.toHaveBeenCalled()
    fireEvent.pointerMove(window, { clientX: 2, clientY: 1 })
    expect(tauri.startDragging).not.toHaveBeenCalled()
  })

  it('stops listening once the press is released', () => {
    render(<Bar />)
    press(screen.getByTestId('bar'))
    fireEvent.pointerUp(window)
    fireEvent.pointerMove(window, { clientX: 40, clientY: 40 })
    expect(tauri.startDragging).not.toHaveBeenCalled()
  })

  it('maximises on a double click', () => {
    render(<Bar />)
    fireEvent.doubleClick(screen.getByTestId('bar'), { button: 0 })
    expect(tauri.toggleMaximize).toHaveBeenCalledTimes(1)
  })

  it('leaves a control inside the bar alone', () => {
    // A press on a button has already been handled by the button; a bar that
    // also starts a drag from it makes every menu open and move the window.
    render(<Bar />)
    const button = screen.getByRole('button', { name: 'Menu' })
    press(button)
    fireEvent.pointerMove(window, { clientX: 40, clientY: 0 })
    fireEvent.doubleClick(button, { button: 0 })
    expect(tauri.startDragging).not.toHaveBeenCalled()
    expect(tauri.toggleMaximize).not.toHaveBeenCalled()
  })

  it('ignores any button but the primary one', () => {
    render(<Bar />)
    fireEvent.pointerDown(screen.getByTestId('bar'), { button: 2, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 40, clientY: 0 })
    expect(tauri.startDragging).not.toHaveBeenCalled()
  })
})

describe('ResizeEdges', () => {
  it('renders the eight edges and corners', () => {
    const { container } = render(<ResizeEdges />)
    expect(container.querySelectorAll('[data-resize-edge]').length).toBe(8)
  })

  it('renders none while the window is maximised', async () => {
    // A maximised window has no edges to drag, and the strip along the top
    // would take the clicks meant for the title bar.
    tauri.maximized = true
    const { container } = render(<ResizeEdges />)
    await vi.waitFor(() => {
      expect(container.querySelectorAll('[data-resize-edge]').length).toBe(0)
    })
  })

  it('starts a resize in the direction of the strip pressed', () => {
    const { container } = render(<ResizeEdges />)
    press(container.querySelector('[data-resize-edge="SouthEast"]')!)
    expect(tauri.startResizeDragging).toHaveBeenCalledWith('SouthEast')
  })

  it('is invisible to a screen reader', () => {
    const { container } = render(<ResizeEdges />)
    for (const strip of container.querySelectorAll('[data-resize-edge]')) {
      expect(strip.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('lets the caller put the strips on a box instead of the viewport', () => {
    const { container } = render(<ResizeEdges className="absolute" />)
    const className = container.querySelector('[data-resize-edge]')!.className
    expect(className).toContain('absolute')
    expect(className).not.toContain('fixed')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(
      <>
        <WindowButtons labels={labels} />
        <ResizeEdges />
      </>,
    )
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})
