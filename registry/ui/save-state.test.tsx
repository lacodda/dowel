// @vitest-environment jsdom
import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { SaveState, useSaveStatus } from './save-state'

describe('useSaveStatus', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('says nothing about a save that happened before it was mounted', () => {
    // Mounting beside a mutation that is already idle must not flash a tick
    // for a save the reader was not there for.
    const { result } = renderHook(() => useSaveStatus(false))
    expect(result.current).toBe('idle')
  })

  it('reports a save while it is in flight', () => {
    const { result } = renderHook(() => useSaveStatus(true))
    expect(result.current).toBe('saving')
  })

  it('shows the tick on the falling edge of a real save', () => {
    const { result, rerender } = renderHook(({ pending }) => useSaveStatus(pending), {
      initialProps: { pending: true },
    })
    rerender({ pending: false })
    expect(result.current).toBe('saved')
  })

  it('lets the tick decay, so it keeps meaning "just now"', () => {
    const { result, rerender } = renderHook(({ pending }) => useSaveStatus(pending), {
      initialProps: { pending: true },
    })
    rerender({ pending: false })
    expect(result.current).toBe('saved')

    act(() => void vi.advanceTimersByTime(2000))
    // A tick that never leaves stops being news and becomes furniture.
    expect(result.current).toBe('idle')
  })

  it('does not call a failure a save', () => {
    const { result, rerender } = renderHook(
      ({ pending, error }) => useSaveStatus(pending, error),
      { initialProps: { pending: true, error: false } },
    )
    rerender({ pending: false, error: true })
    // The failure is announced elsewhere; saying "saved" underneath it is
    // worse than saying nothing.
    expect(result.current).toBe('idle')
  })
})

describe('SaveState', () => {
  it('shows the words it was given, and no words of its own', () => {
    render(<SaveState status="saving" savingLabel="Saving…" savedLabel="Saved" />)
    expect(screen.getByText('Saving…')).toBeDefined()
    expect(screen.queryByText('Saved')).toBeNull()
  })

  it('announces politely rather than interrupting', () => {
    const { container } = render(<SaveState status="saved" savedLabel="Saved" />)
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull()
  })

  it('holds one live region, not two', () => {
    // The ring is drawn from `Spinner`'s variants rather than by using
    // `Spinner`, which carries its own `role="status"` and `aria-live`: nested
    // live regions give a screen reader two announcements for one event.
    const { container } = render(<SaveState status="saving" savingLabel="Saving…" />)
    expect(container.querySelectorAll('[aria-live]')).toHaveLength(1)
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(0)
  })

  it('keeps its width when idle, so the row does not twitch', () => {
    const { container } = render(<SaveState status="idle" />)
    const line = container.firstElementChild
    // Invisible, but still occupying its place.
    expect(line?.className).toContain('opacity-0')
    expect(line?.className).toContain('min-w-16')
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(
      <SaveState status="saved" savedLabel="Saved" />,
    )
    unmount()
  })
})
