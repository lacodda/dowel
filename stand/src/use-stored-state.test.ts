// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useStoredState } from './use-stored-state'

describe('a stand preference that survives a reload', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts at the fallback when nothing was stored', () => {
    const { result } = renderHook(() => useStoredState('dowel.test.accent', 'dowel'))
    expect(result.current[0]).toBe('dowel')
  })

  it('starts at what was stored, which is the whole point', () => {
    window.localStorage.setItem('dowel.test.accent', 'kilna')
    const { result } = renderHook(() => useStoredState('dowel.test.accent', 'dowel'))
    expect(result.current[0]).toBe('kilna')
  })

  it('writes the choice down, so the next visit finds it', () => {
    const { result } = renderHook(() => useStoredState('dowel.test.accent', 'dowel'))
    act(() => result.current[1]('lyrid'))
    expect(result.current[0]).toBe('lyrid')
    expect(window.localStorage.getItem('dowel.test.accent')).toBe('lyrid')
  })

  it('keeps working when storage throws, which it does in a private window', () => {
    // Not a hypothetical: a private window and some "block site data" settings
    // make the accessor itself throw rather than return null, and a stand that
    // crashed there would be unusable for the reason least worth crashing over.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })

    const { result } = renderHook(() => useStoredState('dowel.test.accent', 'dowel'))
    expect(result.current[0]).toBe('dowel')

    // Still switches for this visit; it simply cannot be remembered.
    act(() => result.current[1]('kasl'))
    expect(result.current[0]).toBe('kasl')
  })
})
