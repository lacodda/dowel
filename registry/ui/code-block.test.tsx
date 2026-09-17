// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { CodeBlock } from './code-block'

const KINDS = [
  'keyword',
  'string',
  'number',
  'comment',
  'name',
  'type',
  'punctuation',
  'meta',
] as const

/*
 * What has to be true of a block of code.
 *
 * The defects worth a test here are the quiet ones: a gutter whose numbers
 * come along when the code is copied, a line that scrolls where it was told to
 * wrap, a marked line that says so only in colour, and a copy button that
 * reports success after the clipboard refused.
 */

describe('CodeBlock', () => {
  it('draws one row per line', () => {
    const { container } = render(<CodeBlock code={'first\nsecond\nthird'} />)
    expect(container.querySelectorAll('code > span')).toHaveLength(3)
  })

  it('does not draw a row for the newline a file ends with', () => {
    // A trailing newline is how text files are written, and drawing it adds an
    // empty final row - with numbering on, a number against nothing.
    const { container } = render(<CodeBlock code={'first\nsecond\n'} />)
    expect(container.querySelectorAll('code > span')).toHaveLength(2)
  })

  it('keeps the line numbers out of what gets selected', () => {
    // The defect this gutter exists to avoid: select the block, paste, and
    // every line arrives with its number welded to the front. It is invisible
    // until somebody pastes, so it is checked rather than looked at.
    const { container } = render(<CodeBlock code={'first\nsecond'} numbered />)
    const gutters = [...container.querySelectorAll('code > span > span:first-child')]
    expect(gutters).toHaveLength(2)
    for (const gutter of gutters) expect(gutter.className).toContain('select-none')
  })

  it('hides the numbers from a screen reader, which is told the code once', () => {
    const { container } = render(<CodeBlock code={'first\nsecond'} numbered />)
    for (const gutter of container.querySelectorAll('code > span > span:first-child')) {
      expect(gutter.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('numbers an excerpt from where it was lifted', () => {
    // An excerpt numbered from 1 sends the reader to the wrong place in the
    // file, which is worse than not numbering it at all.
    render(<CodeBlock code={'a\nb'} numbered firstLine={42} />)
    expect(screen.getByText('42')).toBeDefined()
    expect(screen.getByText('43')).toBeDefined()
  })

  it('widens the gutter to the longest number it will draw', () => {
    // Ten lines starting at 995 run into four digits. A gutter sized from the
    // first number alone makes the code step right at the boundary.
    const { container } = render(<CodeBlock code={Array(10).fill('x').join('\n')} numbered firstLine={995} />)
    const gutter = container.querySelector('code > span > span:first-child') as HTMLElement
    expect(gutter.style.width).toBe('4ch')
  })

  it('marks a line by more than its colour', () => {
    // A wash of accent is invisible to a reader who does not see the hue, and
    // easy to miss for one who does. The rule beside it is the second channel.
    const { container } = render(<CodeBlock code={'a\nb\nc'} highlight={[2]} />)
    const rows = [...container.querySelectorAll('code > span')]
    expect(rows[1]!.className).toContain('border-l-2')
    expect(rows[0]!.className).not.toContain('border-l-2')
  })

  it('marks the line the reader was pointed at, in the numbering they see', () => {
    // `highlight` is stated in the reader's numbering, so an excerpt starting
    // at 100 marks 101 as its second row - not its hundred-and-first.
    const { container } = render(<CodeBlock code={'a\nb\nc'} numbered firstLine={100} highlight={[101]} />)
    const rows = [...container.querySelectorAll('code > span')]
    expect(rows[1]!.className).toContain('border-l-2')
    expect(rows[0]!.className).not.toContain('border-l-2')
    expect(rows[2]!.className).not.toContain('border-l-2')
  })

  it('colours a token through the vocabulary, never a raw value', () => {
    const { container } = render(
      <CodeBlock
        code="const x = 1"
        tokens={[[{ text: 'const', kind: 'keyword' }, { text: ' x = ' }, { text: '1', kind: 'number' }]]}
      />,
    )
    expect(container.querySelector('.text-syntax-keyword')?.textContent).toBe('const')
    expect(container.querySelector('.text-syntax-number')?.textContent).toBe('1')
  })

  it('leaves a token with no kind in the ordinary foreground', () => {
    const { container } = render(<CodeBlock code="x" tokens={[[{ text: 'x' }]]} />)
    const token = container.querySelector('code > span > span > span') as HTMLElement
    expect(token.className).toBe('')
  })

  it('draws every kind', () => {
    const { container } = render(
      <CodeBlock code="x" tokens={[KINDS.map((kind) => ({ text: kind, kind }))]} />,
    )
    for (const kind of KINDS) {
      expect(container.querySelector(`.text-syntax-${kind}`), `\`${kind}\` is not drawn`).not.toBeNull()
    }
  })

  it('writes each syntax class out in full, where Tailwind can find it', () => {
    /*
     * This one reads the source rather than the DOM, and it has to.
     *
     * The natural way to write the mapping is `` `text-syntax-${kind}` ``, and
     * it compiles to nothing: Tailwind scans source files for class names as
     * LITERAL STRINGS, so an interpolated one generates no rule. Every test
     * above still passes - jsdom happily reports the class that was never
     * defined - and the block renders in the default colour with nothing
     * failing anywhere. The bug only exists in the built stylesheet, so only a
     * check against the source can see it.
     *
     * Verified by mutation: rewriting the record as a template string reddens
     * this test and no other.
     */
    const source = readFileSync(resolve(process.cwd(), 'registry/ui/code-block.tsx'), 'utf8')
    /* Comments are stripped first, and that is not tidiness: the component's
     * own block comment names the interpolated form in order to warn against
     * it, so a check over the raw file fails on the warning rather than on the
     * code. A gate that reddens at a comment is a gate nobody trusts. */
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

    for (const kind of KINDS) {
      expect(code, `\`text-syntax-${kind}\` is not written out in full`).toContain(
        `text-syntax-${kind}`,
      )
    }
    expect(code, 'a syntax class is being interpolated, and will compile to nothing').not.toMatch(
      /text-syntax-\$\{/,
    )
  })

  it('copies the text, not a reassembly of the highlighting', async () => {
    // What a reader wants is the code as it was written. Rebuilding it from
    // the tokens is how a copy arrives with the whitespace subtly wrong.
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(
      <CodeBlock
        code={'const x = 1\n'}
        tokens={[[{ text: 'const', kind: 'keyword' }, { text: ' x = 1' }]]}
        copyLabel="Copy"
        copiedLabel="Copied"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(writeText).toHaveBeenCalledWith('const x = 1\n')
  })

  it('says it failed when the clipboard refuses', async () => {
    // No secure context, or permission denied. A tick here would be a lie.
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } })
    const onCopy = vi.fn()

    render(<CodeBlock code="x" copyLabel="Copy" copiedLabel="Copied" onCopy={onCopy} />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(onCopy).toHaveBeenCalledWith(false)
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDefined()
  })

  it('announces the copy rather than only drawing a tick', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const { container } = render(<CodeBlock code="x" copyLabel="Copy" copiedLabel="Copied" />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Copied')
  })

  it('keeps the copy button reachable without a pointer', () => {
    // Revealed on hover, which on its own makes it unreachable by keyboard.
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } })
    render(<CodeBlock code="x" copyLabel="Copy" copiedLabel="Copied" />)
    expect(screen.getByRole('button', { name: 'Copy' }).className).toContain(
      'focus-visible:opacity-100',
    )
  })

  it('has no header when there is nothing to put in one', () => {
    const { container } = render(<CodeBlock code="x" />)
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelectorAll('.border-b')).toHaveLength(0)
  })

  it('draws no header for a copy button alone', () => {
    /*
     * Caught by looking rather than by testing: a block with a command in it
     * and no caption got a 34px strip holding one button that is invisible
     * until hover. Empty furniture, on the commonest shape there is - and
     * every assertion passed while it was there.
     */
    const { container } = render(<CodeBlock code="x" copyLabel="Copy" copiedLabel="Copied" />)
    expect(container.querySelectorAll('.border-b')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDefined()
  })

  it('floats that button over the code instead', () => {
    const { container } = render(<CodeBlock code="x" copyLabel="Copy" copiedLabel="Copied" />)
    expect(screen.getByRole('button', { name: 'Copy' }).className).toContain('absolute')
    // Which needs a positioned ancestor, or it escapes to the page.
    expect(container.firstElementChild?.className).toContain('relative')
  })

  it('puts the button in the header when there is a caption', () => {
    const { container } = render(
      <CodeBlock code="x" caption="a.ts" copyLabel="Copy" copiedLabel="Copied" />,
    )
    const header = container.querySelector('.border-b') as HTMLElement
    expect(header).not.toBeNull()
    expect(header.querySelector('button')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Copy' }).className).not.toContain('absolute')
  })

  it('lets the scrolling region be reached by the keyboard', () => {
    // A region that scrolls and cannot be focused hides its right-hand end
    // from anyone not using a pointer.
    const { container } = render(<CodeBlock code="a very long line" />)
    expect(container.querySelector('pre')?.getAttribute('tabindex')).toBe('0')
  })

  it('scrolls rather than wraps by default, because indentation is meaning', () => {
    const { container } = render(<CodeBlock code="x" />)
    const pre = container.querySelector('pre') as HTMLElement
    expect(pre.className).toContain('overflow-x-auto')
    expect(pre.className).not.toContain('whitespace-pre-wrap')
  })

  it('wraps when asked, for a value that is not really code', () => {
    // The wrapping belongs to the line, not to the `<pre>`: each row is a flex
    // container, so a `whitespace-*` on the block above them reaches nothing.
    // Setting it in both places looked like belt and braces and was one live
    // declaration beside one dead one.
    const line = (wrap: boolean) =>
      (render(<CodeBlock code="x" wrap={wrap} />).container.querySelector(
        'code > span > span:last-child',
      ) as HTMLElement).className

    expect(line(true)).toContain('whitespace-pre-wrap')
    expect(line(false)).toContain('whitespace-pre')
    expect(line(false)).not.toContain('whitespace-pre-wrap')

    /*
     * And it breaks inside a word, which is the half a live run caught after
     * this test was already green. `pre-wrap` breaks at spaces, and the thing
     * `wrap` exists for - a URL, a token, a stack frame - has none: a JWT sat
     * 320px outside a block that had asked to wrap, with nothing failing.
     */
    expect(line(true)).toContain('break-words')
    expect(line(false)).not.toContain('break-words')
  })

  it('hands selection back, because code is meant to be taken away', () => {
    // The shell of a desktop app turns selection off so a drag moves the
    // window; code that cannot be selected is code that cannot be used.
    const { container } = render(<CodeBlock code="x" />)
    expect((container.querySelector('pre') as HTMLElement).className).toContain('select-text')
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(<CodeBlock code="x" className="rounded-full" />)
    expect(container.firstElementChild?.className).toContain('rounded-full')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<CodeBlock code="x" caption="a.ts" copyLabel="Copy" copiedLabel="Copied" />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(
      <CodeBlock
        code={'const x = 1\nconst y = 2'}
        caption="a.ts"
        numbered
        highlight={[2]}
        copyLabel="Copy"
        copiedLabel="Copied"
      />,
    )
    unmount()
  })
})
