// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CopyButton } from './copy-button'

/*
 * What has to be true of a copy button.
 *
 * Every defect here is a button that looks like it worked. The clipboard can
 * refuse, and a tick drawn on click rather than on success is a lie in the one
 * case the reader needs the truth; a tick nobody announces is a lie by
 * omission to everyone not looking at it.
 */

const clipboard = (writeText: () => Promise<void>) => {
  Object.assign(navigator, { clipboard: { writeText: vi.fn(writeText) } })
  return navigator.clipboard.writeText as ReturnType<typeof vi.fn>
}

describe('CopyButton', () => {
  it('puts the value on the clipboard', async () => {
    const writeText = clipboard(() => Promise.resolve())
    render(<CopyButton value="hello" label="Copy" copiedLabel="Copied" />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('confirms only after the clipboard does', async () => {
    // A tick on click is a lie exactly when the write failed - no secure
    // context, or a permission refused.
    clipboard(() => Promise.reject(new Error('refused')))
    const onCopy = vi.fn()
    render(<CopyButton value="x" label="Copy" copiedLabel="Copied" onCopy={onCopy} />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(onCopy).toHaveBeenCalledWith(false)
    // Still says "Copy": nothing was copied.
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDefined()
  })

  it('renames itself once the copy has happened', async () => {
    clipboard(() => Promise.resolve())
    render(<CopyButton value="x" label="Copy" copiedLabel="Copied" />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined()
  })

  it('announces the copy rather than only drawing a tick', async () => {
    // A tick that appears silently tells a sighted reader it worked and tells
    // nobody else.
    clipboard(() => Promise.resolve())
    const { container } = render(<CopyButton value="x" label="Copy" copiedLabel="Copied" />)

    expect(container.querySelector('[role="status"]')?.textContent).toBe('')
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Copied')
  })

  it('says nothing in the live region until something happened', () => {
    // A live region that starts full announces itself on arrival, before the
    // reader has done anything.
    clipboard(() => Promise.resolve())
    const { container } = render(<CopyButton value="x" label="Copy" copiedLabel="Copied" />)
    expect(container.querySelector('[role="status"]')?.textContent).toBe('')
  })

  it('tells the product when the copy succeeded', async () => {
    clipboard(() => Promise.resolve())
    const onCopy = vi.fn()
    render(<CopyButton value="x" label="Copy" copiedLabel="Copied" onCopy={onCopy} />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(onCopy).toHaveBeenCalledWith(true)
  })

  it('stays reachable without a pointer', () => {
    // Revealed on hover, which on its own makes a control keyboard-invisible.
    // Visible on focus is what pairs with it.
    clipboard(() => Promise.resolve())
    render(<CopyButton value="x" label="Copy" copiedLabel="Copied" />)
    const className = screen.getByRole('button').className
    expect(className).toContain('opacity-0')
    expect(className).toContain('focus-visible:opacity-100')
  })

  it('reveals on hover of the block it sits in, not of itself', () => {
    // `group-hover`, so the button appears when the pointer is anywhere over
    // the panel - rather than only once it has found the button it cannot see.
    clipboard(() => Promise.resolve())
    render(<CopyButton value="x" label="Copy" copiedLabel="Copied" />)
    expect(screen.getByRole('button').className).toContain('group-hover:opacity-100')
  })

  it('is a button, so it submits nothing by accident', () => {
    // Inside a form, a `<button>` with no type is a submit button.
    clipboard(() => Promise.resolve())
    render(<CopyButton value="x" label="Copy" copiedLabel="Copied" />)
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('lets the caller win a conflict', () => {
    clipboard(() => Promise.resolve())
    render(<CopyButton value="x" label="Copy" copiedLabel="Copied" className="opacity-100" />)
    expect(screen.getByRole('button').className).toContain('opacity-100')
  })

  it('carries no colour outside the vocabulary', () => {
    clipboard(() => Promise.resolve())
    const { container } = render(<CopyButton value="x" label="Copy" copiedLabel="Copied" />)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})
