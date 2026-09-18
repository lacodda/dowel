// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { MarkedLines, MarkedText, MarkedTextarea } from './marked-text'

/*
 * What has to be true of marked text.
 *
 * Every defect here is a mark that has slid off its word. Marks are offsets
 * into the whole text and the text is drawn a line at a time, so the seams
 * are the line breaks: a mark that crosses one has to be cut, a blank line
 * has to keep its height or every mark below it lands one line early, and the
 * two layers of the textarea have to be set in the same metrics or the caret
 * sits on one word and the colour on another.
 */

const text = 'the wire hums\n\nwhere the road gives out'

describe('MarkedLines', () => {
  it('marks exactly the characters it is told to', () => {
    render(<MarkedText text={text} marks={[{ start: 4, end: 8 }]} />)
    const marks = screen.getAllByRole('mark')
    expect(marks.map((mark) => mark.textContent)).toEqual(['wire'])
  })

  it('cuts a mark that crosses a line break at the break', () => {
    // 'hums' is 9..13, the newline is 13, the blank line is 14, 'where' starts
    // at 15. One mark over all of it comes out as one piece per line.
    render(<MarkedText text={text} marks={[{ start: 9, end: 20 }]} />)
    expect(screen.getAllByRole('mark').map((mark) => mark.textContent)).toEqual(['hums', 'where'])
  })

  it('paints a line mark on the whole line', () => {
    const { container } = render(
      <MarkedText text={text} lineMarks={[{ line: 2, className: 'bg-good-soft' }]} />,
    )
    const lines = container.querySelectorAll('[data-line]')
    expect(lines[2]!.className).toContain('bg-good-soft')
    expect(lines[0]!.className).not.toContain('bg-good-soft')
  })

  it('keeps a blank line at its height', () => {
    // An empty block collapses, and every mark below it lands a line early.
    const { container } = render(<MarkedText text={text} />)
    const blank = container.querySelector('[data-line="1"]')!
    expect(blank.textContent).toBe(' ')
    expect(blank.className).toContain('min-h-[1lh]')
  })

  it('draws the lines as blocks, so a line mark spans the width', () => {
    const { container } = render(<MarkedText text={text} />)
    expect(container.querySelectorAll('[data-line]').length).toBe(3)
  })

  it('gives a ghost layer transparent text', () => {
    const { container } = render(<MarkedLines text="x" ghost />)
    expect(container.querySelector('[data-line]')!.className).toContain('text-transparent')
  })
})

describe('MarkedTextarea', () => {
  it('reports the new value, not the event', () => {
    const onChange = vi.fn()
    render(<MarkedTextarea value="the wire" onChange={onChange} aria-label="Verse" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'the wire hums' } })
    expect(onChange).toHaveBeenCalledWith('the wire hums')
  })

  it('sets the mirror and the textarea in the same metrics', () => {
    // The whole trick: two layers that disagree by a pixel put the colour on
    // one word and the caret on the next.
    const { container } = render(
      <MarkedTextarea value="x" onChange={() => {}} className="font-mono text-sm leading-6 p-3" aria-label="Verse" />,
    )
    const mirror = container.querySelector('[data-mirror]')!.className
    const textarea = screen.getByRole('textbox').className
    for (const metric of ['font-mono', 'text-sm', 'leading-6', 'p-3']) {
      expect(mirror).toContain(metric)
      expect(textarea).toContain(metric)
    }
  })

  it('stays transparent even when the metrics carry a background', () => {
    // The stand passed `bg-raise` in the shared class list and the field
    // painted over every mark. The box may have a background; the layer on
    // top may not.
    const { container } = render(
      <MarkedTextarea value="x" onChange={() => {}} className="bg-raise p-3" aria-label="Verse" />,
    )
    expect(screen.getByRole('textbox').className).toContain('bg-transparent')
    expect(screen.getByRole('textbox').className).not.toContain('bg-raise')
    expect(container.querySelector('[data-mirror]')!.className).toContain('bg-raise')
  })

  it('draws the marks under the letters', () => {
    // In the mirror, which is hidden from a screen reader - so by element,
    // not by role.
    const { container } = render(
      <MarkedTextarea value="the wire" onChange={() => {}} marks={[{ start: 4, end: 8 }]} aria-label="Verse" />,
    )
    expect(container.querySelector('[data-mirror] mark')?.textContent).toBe('wire')
  })

  it('hides the mirror from a screen reader', () => {
    // The textarea is the one that reads; the mirror is the same words twice.
    const { container } = render(<MarkedTextarea value="x" onChange={() => {}} aria-label="Verse" />)
    expect(container.querySelector('[data-mirror]')!.getAttribute('aria-hidden')).toBe('true')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(
      <MarkedTextarea value={text} onChange={() => {}} marks={[{ start: 0, end: 3 }]} aria-label="Verse" />,
    )
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(
      <MarkedTextarea
        value={text}
        onChange={() => {}}
        marks={[{ start: 4, end: 8, className: 'bg-warn-soft' }]}
        lineMarks={[{ line: 2, className: 'bg-good-soft' }]}
        aria-label="Verse"
      />,
    )
    unmount()
  })
})
