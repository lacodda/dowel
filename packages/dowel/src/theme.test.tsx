// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultStorageKey, initTheme, nextTheme, resolvedTheme, useTheme, useThemeSwitch } from './theme'

/*
 * Theme selection.
 *
 * The stylesheet does the work; this is the JavaScript around it, and what can
 * go wrong here is specific: a class left on the root element after switching
 * away, a browser that refuses storage, a reader whose operating system
 * changes theme while the page is open.
 */

/** Drive `prefers-color-scheme` the way a browser would. jsdom has
 * `matchMedia` only as a stub, so the test supplies one that answers a chosen
 * preference and can announce a change. */
function mockPreference(initiallyDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let dark = initiallyDark

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('dark') ? dark : !dark,
      media: query,
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener)
      },
      removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener)
      },
      // Not used here, but a `MediaQueryList` a library might touch.
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    })),
  )

  return {
    /** The operating system switches theme with the page open. */
    change(toDark: boolean) {
      dark = toDark
      for (const listener of listeners) {
        listener({ matches: toDark } as MediaQueryListEvent)
      }
    },
    get listenerCount() {
      return listeners.size
    },
  }
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('applying a theme', () => {
  it('starts on system, with neither class', () => {
    mockPreference(true)
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('system')
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('pins a class when a theme is chosen', () => {
    mockPreference(true)
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setTheme('light'))
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('takes the class off again on the way back to system', () => {
    // The bug this guards: toggling light then system leaves `light` behind,
    // and the page stops following the operating system without saying so.
    mockPreference(true)
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setTheme('light'))
    act(() => result.current.setTheme('system'))

    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('never carries both classes at once', () => {
    mockPreference(false)
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setTheme('dark'))
    act(() => result.current.setTheme('light'))

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })
})

describe('remembering', () => {
  it('keeps the choice', () => {
    mockPreference(true)
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setTheme('dark'))
    expect(localStorage.getItem(defaultStorageKey)).toBe('dark')
  })

  it('reads the choice back on the next visit', () => {
    localStorage.setItem(defaultStorageKey, 'light')
    mockPreference(true)

    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('lets a product use its own key', () => {
    mockPreference(true)
    const { result } = renderHook(() => useTheme('kilna.theme'))

    act(() => result.current.setTheme('dark'))
    expect(localStorage.getItem('kilna.theme')).toBe('dark')
    expect(localStorage.getItem(defaultStorageKey)).toBeNull()
  })

  it('ignores a stored value that is not a theme', () => {
    localStorage.setItem(defaultStorageKey, 'chartreuse')
    mockPreference(true)

    expect(renderHook(() => useTheme()).result.current.theme).toBe('system')
  })

  it('still switches when storage is refused', () => {
    // Private windows, embedded views and blocked site data all throw here. A
    // theme switch that cannot remember should still switch.
    mockPreference(true)
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('light'))

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    setItem.mockRestore()
  })

  it('starts on system when storage cannot be read', () => {
    mockPreference(true)
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    expect(renderHook(() => useTheme()).result.current.theme).toBe('system')
    getItem.mockRestore()
  })
})

describe('following the operating system', () => {
  it('reports which theme is showing while on system', () => {
    mockPreference(true)
    expect(renderHook(() => useTheme()).result.current.resolved).toBe('dark')
  })

  it('keeps up when the operating system changes theme', () => {
    // The bug this guards: a reader whose machine switches to dark at sunset
    // keeps the old theme until they reload.
    const preference = mockPreference(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current.resolved).toBe('light')

    act(() => preference.change(true))
    expect(result.current.resolved).toBe('dark')
  })

  it('ignores the operating system once a theme is pinned', () => {
    const preference = mockPreference(false)
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setTheme('light'))
    act(() => preference.change(true))

    expect(result.current.resolved).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('stops listening when unmounted', () => {
    const preference = mockPreference(false)
    const { unmount } = renderHook(() => useTheme())
    expect(preference.listenerCount).toBe(1)

    unmount()
    expect(preference.listenerCount).toBe(0)
  })
})

describe('init', () => {
  it('applies the remembered theme before React renders', () => {
    // Without this the page paints in the default theme and corrects itself,
    // which a reader who chose light sees as a flash of dark.
    localStorage.setItem(defaultStorageKey, 'light')
    initTheme()
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('leaves the classes off when nothing is remembered', () => {
    initTheme()
    expect(document.documentElement.className).toBe('')
  })
})

describe('helpers', () => {
  it('cycles through the three states and back', () => {
    expect(nextTheme('system')).toBe('light')
    expect(nextTheme('light')).toBe('dark')
    expect(nextTheme('dark')).toBe('system')
  })

  it('resolves a theme outside React', () => {
    mockPreference(true)
    expect(resolvedTheme('system')).toBe('dark')
    expect(resolvedTheme('light')).toBe('light')
    expect(resolvedTheme('dark')).toBe('dark')
  })
})

describe('the switch', () => {
  it('cycles on click', () => {
    mockPreference(true)
    const { result } = renderHook(() => useThemeSwitch())

    expect(result.current.theme).toBe('system')
    act(() => result.current.buttonProps.onClick())
    expect(result.current.theme).toBe('light')
    act(() => result.current.buttonProps.onClick())
    expect(result.current.theme).toBe('dark')
    act(() => result.current.buttonProps.onClick())
    expect(result.current.theme).toBe('system')
  })

  it('carries no label of its own', () => {
    // A primitive with a string in it is a primitive that cannot be
    // translated. The product supplies the words.
    mockPreference(true)
    const { result } = renderHook(() => useThemeSwitch())

    const props = result.current.buttonProps as Record<string, unknown>
    for (const value of Object.values(props)) {
      expect(typeof value === 'string' && /light|dark|system|theme/i.test(value)).toBe(false)
    }
  })

  it('announces that the button relabels itself', () => {
    mockPreference(true)
    const { result } = renderHook(() => useThemeSwitch())
    expect(result.current.buttonProps['aria-live']).toBe('polite')
    expect(result.current.buttonProps.type).toBe('button')
  })
})
