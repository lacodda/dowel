// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { href, linkProps, useRoute } from './router'

/*
 * The stand's router.
 *
 * Worth testing rather than trusting: it is forty lines of hand-written path
 * handling, and the two things it must not break - a deep link that resolves
 * on a cold load, and a back button that walks back - are exactly the two
 * things a hand-written router usually breaks.
 */

/** The base Vite substitutes; the tests run under the same value the build
 * uses, so a path assertion here means the same thing in production. */
const BASE = import.meta.env.BASE_URL

function go(path: string) {
  window.history.replaceState(null, '', `${BASE}${path}`.replace(/\/{2,}/g, '/'))
}

describe('the stand router', () => {
  beforeEach(() => {
    go('')
  })

  it('reads the component out of the path', () => {
    go('button')
    const { result } = renderHook(() => useRoute())
    expect(result.current.path).toBe('button')
  })

  it('calls the front page an empty path', () => {
    const { result } = renderHook(() => useRoute())
    expect(result.current.path).toBe('')
  })

  it('ignores a trailing slash, which a copied link often carries', () => {
    go('badge/')
    const { result } = renderHook(() => useRoute())
    expect(result.current.path).toBe('badge')
  })

  it('navigates without reloading, and puts the component in the address bar', () => {
    const { result } = renderHook(() => useRoute())
    act(() => result.current.navigate('select'))
    expect(result.current.path).toBe('select')
    expect(window.location.pathname).toBe(`${BASE}select`)
  })

  it('pushes history, so the back button has somewhere to go back to', () => {
    const { result } = renderHook(() => useRoute())
    const before = window.history.length
    act(() => result.current.navigate('select'))
    act(() => result.current.navigate('combobox'))

    // Pushed, not replaced: two entries, so the back button walks the
    // components a reader actually looked at. Replacing would leave the
    // address bar right and the back button useless.
    expect(window.history.length).toBe(before + 2)
  })

  it('follows the browser back to the previous component', async () => {
    const { result } = renderHook(() => useRoute())
    act(() => result.current.navigate('select'))
    act(() => result.current.navigate('combobox'))

    // `back()` is asynchronous, and in jsdom it takes more than one task: at a
    // zero-delay tick the URL has not moved and no `popstate` has fired. So
    // this waits for the browser to actually go back rather than dispatching
    // the event by hand - which would prove only that the listener runs, not
    // that it is attached to the real one.
    await act(async () => {
      window.history.back()
    })
    await waitFor(() => expect(result.current.path).toBe('select'))
  })

  it('builds an href that is a real URL, so a link can be copied or opened in a new tab', () => {
    expect(href('button')).toBe(`${BASE}button`)
  })

  it('leaves a modified click to the browser', () => {
    const navigate = vi.fn()
    const preventDefault = vi.fn()
    // A ctrl-click is "open in a new tab". A router that swallows it is the
    // commonest way a single-page app feels wrong to someone using a browser
    // properly.
    linkProps('button', navigate).onClick({
      defaultPrevented: false,
      button: 0,
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault,
    } as unknown as React.MouseEvent)

    expect(navigate).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('handles a plain click itself', () => {
    const navigate = vi.fn()
    const preventDefault = vi.fn()
    linkProps('button', navigate).onClick({
      defaultPrevented: false,
      button: 0,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault,
    } as unknown as React.MouseEvent)

    expect(navigate).toHaveBeenCalledWith('button')
    expect(preventDefault).toHaveBeenCalled()
  })

  it('leaves a middle click alone, which opens a tab too', () => {
    const navigate = vi.fn()
    linkProps('button', navigate).onClick({
      defaultPrevented: false,
      button: 1,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent)

    expect(navigate).not.toHaveBeenCalled()
  })
})
