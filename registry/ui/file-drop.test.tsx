// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { FileDrop } from './file-drop'

/** A file of a given type and size, without putting one on disk. */
function file(name: string, type: string, size = 10) {
  return new File(['x'.repeat(size)], name, { type })
}

/** What a drop event carries. jsdom builds no `DataTransfer`, so the shape the
 * component reads is supplied directly. */
function dropWith(files: File[]) {
  return { dataTransfer: { files, items: [], types: ['Files'] } }
}

describe('FileDrop', () => {
  it('hands over what was dropped', () => {
    const onFiles = vi.fn()
    render(<FileDrop onFiles={onFiles} aria-label="Attachments">Drop here</FileDrop>)

    const zone = screen.getByText('Drop here').parentElement!
    fireEvent.drop(zone, dropWith([file('report.pdf', 'application/pdf')]))

    expect(onFiles).toHaveBeenCalledTimes(1)
    expect(onFiles.mock.calls[0]![0]!.map((f: File) => f.name)).toEqual(['report.pdf'])
  })

  it('hands over what was chosen through the picker', async () => {
    const user = userEvent.setup()
    const onFiles = vi.fn()
    render(<FileDrop onFiles={onFiles} aria-label="Attachments">Drop here</FileDrop>)

    await user.upload(screen.getByLabelText('Attachments'), file('note.txt', 'text/plain'))

    expect(onFiles).toHaveBeenCalled()
  })

  it('refuses a type that was not asked for, and says why', () => {
    const onFiles = vi.fn()
    const onReject = vi.fn()
    render(
      <FileDrop onFiles={onFiles} onReject={onReject} accept="image/*" aria-label="Images">
        Drop here
      </FileDrop>,
    )

    const zone = screen.getByText('Drop here').parentElement!
    fireEvent.drop(zone, dropWith([file('report.pdf', 'application/pdf')]))

    expect(onFiles).not.toHaveBeenCalled()
    // Silently swallowing it would look like a broken page.
    expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: 'type' })])
  })

  it('matches an accept list by extension as well as by type', () => {
    const onFiles = vi.fn()
    render(
      <FileDrop onFiles={onFiles} accept=".pdf" aria-label="Documents">
        Drop here
      </FileDrop>,
    )

    const zone = screen.getByText('Drop here').parentElement!
    // A type the browser did not recognise, which is common enough that an
    // extension is the only thing left to match on.
    fireEvent.drop(zone, dropWith([file('report.pdf', '')]))

    expect(onFiles).toHaveBeenCalled()
  })

  it('refuses a file past the size limit', () => {
    const onFiles = vi.fn()
    const onReject = vi.fn()
    render(
      <FileDrop onFiles={onFiles} onReject={onReject} maxSize={5} aria-label="Attachments">
        Drop here
      </FileDrop>,
    )

    const zone = screen.getByText('Drop here').parentElement!
    fireEvent.drop(zone, dropWith([file('big.bin', 'application/octet-stream', 50)]))

    expect(onFiles).not.toHaveBeenCalled()
    expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: 'size' })])
  })

  it('takes as many as it may and refuses the rest', () => {
    const onFiles = vi.fn()
    const onReject = vi.fn()
    render(
      <FileDrop onFiles={onFiles} onReject={onReject} maxFiles={1} aria-label="Attachments">
        Drop here
      </FileDrop>,
    )

    const zone = screen.getByText('Drop here').parentElement!
    fireEvent.drop(zone, dropWith([file('a.txt', 'text/plain'), file('b.txt', 'text/plain')]))

    expect(onFiles.mock.calls[0]![0]).toHaveLength(1)
    expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: 'count' })])
  })

  it('stays lit while the pointer crosses its own children', () => {
    const { container } = render(
      <FileDrop onFiles={vi.fn()} aria-label="Attachments">
        <span>Drop here</span>
      </FileDrop>,
    )
    const zone = container.firstElementChild!
    const label = screen.getByText('Drop here')

    fireEvent.dragEnter(zone)
    fireEvent.dragEnter(label)
    // `dragleave` fires when the pointer crosses onto a child; a zone that
    // toggled on it would flicker as the pointer moved over its own text.
    fireEvent.dragLeave(zone)

    expect(zone.className).toContain('border-accent')
  })

  it('goes dark once the pointer has really left', () => {
    const { container } = render(
      <FileDrop onFiles={vi.fn()} aria-label="Attachments">
        <span>Drop here</span>
      </FileDrop>,
    )
    const zone = container.firstElementChild!

    fireEvent.dragEnter(zone)
    fireEvent.dragLeave(zone)

    expect(zone.className).not.toContain('border-accent')
  })

  it('prevents the browser from opening the file instead', () => {
    const { container } = render(
      <FileDrop onFiles={vi.fn()} aria-label="Attachments">
        Drop here
      </FileDrop>,
    )
    const zone = container.firstElementChild!

    // Without this the page is replaced by the dropped PDF, and the form the
    // reader was filling in is gone.
    const over = fireEvent.dragOver(zone)
    expect(over).toBe(false)
  })

  it('takes nothing while disabled', () => {
    const onFiles = vi.fn()
    const { container } = render(
      <FileDrop onFiles={onFiles} disabled aria-label="Attachments">
        Drop here
      </FileDrop>,
    )

    fireEvent.drop(container.firstElementChild!, dropWith([file('a.txt', 'text/plain')]))

    expect(onFiles).not.toHaveBeenCalled()
  })

  it('keeps a real file input, reachable by keyboard', () => {
    render(<FileDrop onFiles={vi.fn()} aria-label="Attachments">Drop here</FileDrop>)
    const input = screen.getByLabelText('Attachments')

    expect(input).toHaveProperty('type', 'file')
    // `sr-only`, not `hidden`: hidden that way it would be unfocusable and the
    // label would stop reaching it.
    expect(input.className).toContain('sr-only')
    input.focus()
    expect(document.activeElement).toBe(input)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(
      <FileDrop onFiles={vi.fn()} aria-label="Attachments">
        Drop here
      </FileDrop>,
    )
    unmount()
  })
})
