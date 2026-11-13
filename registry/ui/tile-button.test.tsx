// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { compileClasses } from '../../tests/compile'
import { TileButton } from './tile-button'

/*
 * TileButton.
 *
 * What would be wrong with a pressable picture is mostly invisible to a
 * mouse: a button that submits the form it sits in, a chosen state carried by
 * colour alone or announced twice, a control height that flattens the well.
 * jsdom lays nothing out, so the shape is held on the classes, and the chosen
 * edge on what Tailwind compiles them to.
 */

const classes = (element: Element) => (element.getAttribute('class') ?? '').split(/\s+/)

describe('TileButton', () => {
  it('is a button that does not submit its form', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault())
    const onClick = vi.fn()
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <TileButton aria-label="Open frame 2" onClick={onClick}>
          <img src="data:," alt="" />
        </TileButton>
      </form>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open frame 2' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('presses from the keyboard', async () => {
    const onClick = vi.fn()
    render(<TileButton onClick={onClick}>Warm tape</TileButton>)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Warm tape' }))
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('takes the size of what it holds rather than a control row', () => {
    // The reason it exists: Button stands on a control height, pads its sides
    // and keeps its words on one line, which flattens a picture into a strip.
    render(<TileButton>Warm tape</TileButton>)
    const tile = classes(screen.getByRole('button'))
    for (const control of ['h-control', 'h-control-sm', 'px-3.5', 'whitespace-nowrap', 'justify-center']) {
      expect(tile).not.toContain(control)
    }
    // A column, so a picture is a block and sits flush at the foot.
    expect(tile).toContain('flex')
    expect(tile).toContain('flex-col')
    expect(tile).toContain('text-start')
    // Its own edge clips the picture to the corners.
    expect(tile).toContain('overflow-hidden')
    expect(tile).toContain('rounded-md')
  })

  it('draws the chosen one by a doubled accent edge, not by colour alone', async () => {
    const { rerender } = render(<TileButton>Warm tape</TileButton>)
    const tile = screen.getByRole('button')
    expect(classes(tile)).toContain('border-line')
    expect(classes(tile)).not.toContain('border-accent')
    expect(tile.hasAttribute('data-selected')).toBe(false)

    rerender(<TileButton selected>Warm tape</TileButton>)
    expect(classes(tile)).toContain('border-accent')
    expect(classes(tile)).not.toContain('border-line')
    expect(tile.hasAttribute('data-selected')).toBe(true)
    // The second line: over the picture and inside the border.
    for (const edge of ['after:absolute', 'after:inset-0', 'after:ring-1', 'after:ring-inset', 'after:ring-accent', 'after:pointer-events-none']) {
      expect(classes(tile)).toContain(edge)
    }

    const css = await compileClasses(['after:ring-inset', 'after:rounded-[inherit]', 'after:inset-0'])
    expect(css).toMatch(/::after/)
    expect(css).toMatch(/content: var\(--tw-content\)/)
    expect(css).toMatch(/border-radius: inherit/)
    expect(css).toMatch(/inset: 0/)
  })

  it('names the chosen one as current', () => {
    const { rerender } = render(<TileButton selected>Warm tape</TileButton>)
    expect(screen.getByRole('button').getAttribute('aria-current')).toBe('true')
    rerender(<TileButton>Warm tape</TileButton>)
    expect(screen.getByRole('button').hasAttribute('aria-current')).toBe(false)
  })

  it('lets a toggle or an option name its own state, and then says it once', () => {
    // A tile announced as both current and pressed reads one fact twice.
    const { rerender } = render(
      <TileButton selected aria-pressed>
        Warm tape
      </TileButton>,
    )
    let tile = screen.getByRole('button')
    expect(tile.getAttribute('aria-pressed')).toBe('true')
    expect(tile.hasAttribute('aria-current')).toBe(false)
    // The look follows `selected` whatever word the caller used.
    expect(classes(tile)).toContain('border-accent')

    rerender(
      <div role="listbox" aria-label="Styles">
        <TileButton role="option" selected aria-selected>
          Warm tape
        </TileButton>
      </div>,
    )
    tile = screen.getByRole('option')
    expect(tile.getAttribute('aria-selected')).toBe('true')
    expect(tile.hasAttribute('aria-current')).toBe(false)
  })

  it('is disabled as a button, with the hover taken away', async () => {
    const onClick = vi.fn()
    render(
      <TileButton disabled onClick={onClick}>
        Warm tape
      </TileButton>,
    )
    const tile = screen.getByRole('button')
    expect((tile as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(tile)
    expect(onClick).not.toHaveBeenCalled()
    expect(classes(tile)).toContain('not-disabled:hover:border-line-2')
    expect(classes(tile)).toContain('disabled:opacity-50')
  })

  it('draws as a link when asked, with no button attributes on it', () => {
    render(
      <TileButton render={<a href="/frames/2" />} selected disabled>
        Frame 2
      </TileButton>,
    )
    const link = screen.getByRole('link', { name: 'Frame 2' })
    expect(link.getAttribute('href')).toBe('/frames/2')
    expect(link.hasAttribute('type')).toBe(false)
    expect(link.hasAttribute('disabled')).toBe(false)
    expect(link.getAttribute('aria-current')).toBe('true')
  })

  it('lets the caller win a conflict', () => {
    // `cn` resolves by utility group, so a caller's class beats the
    // component's rather than the two fighting over source order.
    render(<TileButton className="rounded-none border-0">Warm tape</TileButton>)
    const tile = classes(screen.getByRole('button'))
    expect(tile).toContain('rounded-none')
    expect(tile).not.toContain('rounded-md')
    expect(tile).toContain('border-0')
  })

  it('carries no colour outside the vocabulary', () => {
    // The rule the system rests on: a primitive never writes a raw colour and
    // never uses a `dark:` utility, because the theme swaps underneath.
    const { container } = render(<TileButton selected>Warm tape</TileButton>)
    const className = container.firstElementChild?.className ?? ''
    expect(className).not.toMatch(/\bdark:/)
    expect(className).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe, chosen and not, as a picture and as a card', async () => {
    await expectNoA11yViolations(
      <div>
        <TileButton aria-label="Open frame 1" selected>
          <img src="data:," alt="" />
        </TileButton>
        <TileButton aria-label="Open frame 2">
          <img src="data:," alt="" />
        </TileButton>
        <TileButton>
          <span>Warm tape</span>
          <span>Hiss, wow and a soft top end</span>
        </TileButton>
      </div>,
    )
  })
})
