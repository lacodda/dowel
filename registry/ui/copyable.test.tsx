// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Copyable } from './copyable'

/** jsdom has no clipboard; this is one that can be told to work or refuse. */
function stubClipboard(behaviour: 'works' | 'refuses') {
  const writeText = vi.fn(() =>
    behaviour === 'works' ? Promise.resolve() : Promise.reject(new Error('denied')),
  )
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return writeText
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

describe('Copyable', () => {
  it('is a button, so the keyboard can reach it', () => {
    stubClipboard('works')
    render(<Copyable>abc123</Copyable>)
    expect(screen.getByRole('button')).toBeDefined()
  })

  it('copies the text it shows', async () => {
    const writeText = stubClipboard('works')
    render(<Copyable>abc123</Copyable>)

    await userEvent.click(screen.getByRole('button'))
    expect(writeText).toHaveBeenCalledWith('abc123')
  })

  it('copies a different value when given one', async () => {
    // The shown text is often shortened; what lands on the clipboard is not.
    const writeText = stubClipboard('works')
    render(<Copyable value="the-whole-hash">the-whole…</Copyable>)

    await userEvent.click(screen.getByRole('button'))
    expect(writeText).toHaveBeenCalledWith('the-whole-hash')
  })

  it('announces the confirmation rather than only drawing it', async () => {
    // A tick that appears silently tells a sighted user it worked and tells
    // nobody else.
    stubClipboard('works')
    render(<Copyable copiedLabel="Copied">abc</Copyable>)

    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Copied'))
  })

  it('says so when the clipboard refuses', async () => {
    // No secure context, or permission denied. A button that looks like it
    // worked and did not is worse than one that admits it failed.
    stubClipboard('refuses')
    const onCopy = vi.fn()
    render(<Copyable onCopy={onCopy}>abc</Copyable>)

    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(onCopy).toHaveBeenCalledWith(false))
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('goes back to itself after a moment', async () => {
    stubClipboard('works')
    render(<Copyable>abc</Copyable>)

    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Copied'))

    vi.advanceTimersByTime(2000)
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(''))
  })
})
