// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DiffView } from './diff-view'

/*
 * What has to be true of a comparison.
 *
 * The defects here are the ones that leave a correct-looking screen saying
 * something untrue: two columns that have come out of step, a change carried
 * only by a tint, a gutter that joins the text when it is copied.
 */

describe('DiffView', () => {
  it('draws both sides of every row, so the columns are the same height', () => {
    /*
     * The property the shape exists for. Rendering each column by filtering
     * the change list - the obvious implementation - gives two columns of
     * different lengths the moment anything is inserted, and the reader is
     * then comparing line 4 against line 3 with nothing looking wrong.
     */
    const { container } = render(
      <DiffView before={'a\nb\nc'} after={'x\na\nb\nc\ny'} beforeLabel="v1" afterLabel="v2" />,
    )
    // Three lines against five, so a filtered pair of columns would be three
    // rows and five. Paired, it is five rows of two cells: ten in one grid.
    const grid = container.querySelector('.overflow-auto > .grid') as HTMLElement
    expect(grid.children).toHaveLength(10)

    // And the cells alternate side, which is what keeps a line opposite its
    // partner rather than opposite whatever ended up at the same index.
    const text = [...grid.children].map((cell) => cell.textContent)
    expect(text[0]).toContain(' ') // nothing on the left of the inserted `x`
    expect(text[1]).toContain('x')
  })

  it('keeps exactly one scrolling region, so the sides cannot drift apart', () => {
    /*
     * This test exists because the component was first written with a scroller
     * per column, under a comment explaining that two scrollers would come
     * apart the moment a reader touched one of them. jsdom has no layout, so
     * the scrolling itself cannot be tested - but the structural fact the
     * behaviour rests on can be, and it is what the comment actually claims.
     */
    const { container } = render(
      <DiffView before={'a\nb'} after={'a\nc'} beforeLabel="v1" afterLabel="v2" />,
    )
    const scrollers = [...container.querySelectorAll('*')].filter((element) =>
      element.className.toString().includes('overflow-auto'),
    )
    expect(scrollers, 'a diff has one scroller; two come apart when either is touched').toHaveLength(1)
  })

  it('says what changed without relying on colour', () => {
    // A tinted row is invisible to a reader who does not see the hue, and
    // vanishes in a greyscale screenshot. The glyph is the message; the tint
    // is emphasis.
    render(<DiffView before={'a\nb'} after="a" beforeLabel="v1" afterLabel="v2" numbered={false} />)
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  it('marks a rewritten line as one event, not a deletion and an arrival', () => {
    const { container } = render(
      <DiffView before={'a\nold'} after={'a\nnew'} beforeLabel="v1" afterLabel="v2" />,
    )
    expect(container.textContent).toContain('~')
    // `-` and `+` belong to lines that exist on one side only; a rewrite has
    // both sides, so neither appears.
    expect(container.textContent).not.toContain('-')
    expect(container.textContent).not.toContain('+')
  })

  it('leaves an unchanged line unmarked', () => {
    const { container } = render(
      <DiffView before="a" after="a" beforeLabel="v1" afterLabel="v2" numbered={false} />,
    )
    expect(container.textContent).not.toContain('+')
    expect(container.textContent).not.toContain('-')
    expect(container.textContent).not.toContain('~')
  })

  it('numbers by lines of each text, leaving the gutter empty opposite a gap', () => {
    // A number against a gap would claim a line exists there. The side that
    // has nothing has no number either.
    render(<DiffView before="a" after={'x\na'} beforeLabel="v1" afterLabel="v2" />)
    // The right-hand text runs 1, 2; the left has only line 1, opposite the
    // second row.
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('2')).toHaveLength(1)
  })

  it('keeps the numbers out of what gets selected', () => {
    // Copying a column should hand back the text, not the text with a number
    // welded to the front of every line. Invisible until somebody pastes.
    const { container } = render(
      <DiffView before={'a\nb'} after={'a\nc'} beforeLabel="v1" afterLabel="v2" />,
    )
    const gutters = container.querySelectorAll('.tabular-nums')
    expect(gutters.length).toBeGreaterThan(0)
    for (const gutter of gutters) expect(gutter.className).toContain('select-none')
  })

  it('keeps the markers out of a selection too', () => {
    // Scoped to the rows: the header has its own spans, and a marker joining
    // a copied column would prefix every line with `-` or `+`.
    const { container } = render(
      <DiffView before={'a\nb'} after="a" beforeLabel="v1" afterLabel="v2" numbered={false} />,
    )
    const cells = container.querySelectorAll('.overflow-auto .flex > span:first-child')
    expect(cells.length).toBeGreaterThan(0)
    for (const cell of cells) expect(cell.className).toContain('select-none')
  })

  it('hides both the numbers and the markers from a screen reader', () => {
    // The row's own text says what it is, and the column says which side. A
    // spoken "minus" before every removed line is noise on top of that.
    const { container } = render(
      <DiffView before={'a\nb'} after="a" beforeLabel="v1" afterLabel="v2" />,
    )
    for (const cell of container.querySelectorAll('.select-none')) {
      expect(cell.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('offers each side for copying, under a name of its own', async () => {
    /*
     * Two buttons on one screen called "Copy" tell a reader which is which
     * only by where they are, which is what a label is for. The product builds
     * both names from the side's own label - this component sticking the two
     * together would invent a phrase in a grammar it does not know.
     */
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(
      <DiffView
        before={'old text'}
        after={'new text'}
        beforeLabel="v1"
        afterLabel="v2"
        copyLabel={(side) => `Copy ${side}`}
        copiedLabel="Copied"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Copy v1' }))
    expect(writeText).toHaveBeenCalledWith('old text')

    await userEvent.click(screen.getByRole('button', { name: 'Copy v2' }))
    expect(writeText).toHaveBeenCalledWith('new text')
  })

  it('copies the text as it was given, not the drawing of it', async () => {
    // The rows carry markers, numbers and a non-breaking space for a blank
    // line. Copying what is drawn would hand back all three.
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(
      <DiffView
        before={'a\n\nb'}
        after="a"
        beforeLabel="v1"
        afterLabel="v2"
        copyLabel={(side) => `Copy ${side}`}
        copiedLabel="Copied"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Copy v1' }))
    expect(writeText).toHaveBeenCalledWith('a\n\nb')
  })

  it('has no copy button unless the product names one', () => {
    const { container } = render(<DiffView before="a" after="b" beforeLabel="v1" afterLabel="v2" />)
    expect(container.querySelector('button')).toBeNull()
  })

  it('names each side', () => {
    render(<DiffView before="a" after="b" beforeLabel="Draft 3" afterLabel="Draft 4" />)
    expect(screen.getByText('Draft 3')).toBeDefined()
    expect(screen.getByText('Draft 4')).toBeDefined()
  })

  it('hands the counts to the product rather than writing a sentence', () => {
    // A count is a plural, and a plural belongs to a language this component
    // does not know.
    render(
      <DiffView
        before={'a\nb\nc'}
        after={'a\nB\nc\nd'}
        beforeLabel="v1"
        afterLabel="v2"
        summary={({ added, removed }) => `${added} in, ${removed} out`}
      />,
    )
    expect(screen.getByText('2 in, 1 out')).toBeDefined()
  })

  it('says nothing above the comparison when the product does not ask', () => {
    const { container } = render(<DiffView before="a" after="b" beforeLabel="v1" afterLabel="v2" />)
    expect(container.querySelector('p')).toBeNull()
  })

  it('gives a blank line its height, so a gap does not close up', () => {
    // A row that collapses to nothing puts the two columns back out of step -
    // exactly what the pairing prevented.
    const { container } = render(
      <DiffView before={'a\n\nb'} after={'a\n\nb'} beforeLabel="v1" afterLabel="v2" />,
    )
    expect(container.textContent).toContain(' ')
  })

  it('lets the scrolling region be reached by the keyboard', () => {
    const { container } = render(
      <DiffView before={'a\nb'} after={'a\nc'} beforeLabel="v1" afterLabel="v2" />,
    )
    expect(container.querySelector('[tabindex="0"]')).not.toBeNull()
  })

  it('hands selection back, because a comparison is read to copy from', () => {
    const { container } = render(<DiffView before="a" after="b" beforeLabel="v1" afterLabel="v2" />)
    const scroller = container.querySelector('.overflow-auto') as HTMLElement
    expect(scroller.className).toContain('select-text')
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(
      <DiffView before="a" after="b" beforeLabel="v1" afterLabel="v2" className="gap-8" />,
    )
    expect(container.firstElementChild?.className).toContain('gap-8')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(
      <DiffView before={'a\nb'} after={'a\nc'} beforeLabel="v1" afterLabel="v2" />,
    )
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})
