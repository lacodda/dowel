// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { compileClasses } from '../../tests/compile'
import { Menu, MenuItem, MenuPopup, MenuTrigger } from './menu'
import { Tile, TileAction, TileButton } from './tile-button'

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
    expect(tile.getAttribute('data-selected')).toBe('')
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

describe('TileAction', () => {
  /** A reference picture with a cross to take it away - kilna's style
   * references, the shape the action was written for. */
  function Reference(props: { onOpen?: () => void; onRemove?: () => void; corner?: 'top-end' | 'bottom-start' }) {
    return (
      <Tile data-testid="tile">
        <TileButton aria-label="Open reference" onClick={props.onOpen}>
          <img src="data:," alt="" />
        </TileButton>
        <TileAction label="Remove the reference" corner={props.corner} onClick={props.onRemove}>
          <svg aria-hidden />
        </TileAction>
      </Tile>
    )
  }

  it('stands beside the tile, never inside its button', () => {
    // A button inside a button is a control nothing can press on its own.
    render(<Reference />)
    const tile = screen.getByRole('button', { name: 'Open reference' })
    const action = screen.getByRole('button', { name: 'Remove the reference' })
    expect(tile.contains(action)).toBe(false)
    expect(action.parentElement).toBe(screen.getByTestId('tile'))
  })

  it('presses itself and not the tile under it', async () => {
    const onOpen = vi.fn()
    const onRemove = vi.fn()
    render(<Reference onOpen={onOpen} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove the reference' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('says what it does, to a reader and under the pointer', () => {
    render(<Reference />)
    const action = screen.getByRole('button', { name: 'Remove the reference' })
    expect(action.getAttribute('title')).toBe('Remove the reference')
    expect(action.getAttribute('type')).toBe('button')
  })

  it('takes the corner it is given, on the ground the tile gives it', () => {
    render(<Reference corner="bottom-start" />)
    const action = classes(screen.getByRole('button', { name: 'Remove the reference' }))
    expect(action).toEqual(expect.arrayContaining(['absolute', 'bottom-1.5', 'start-1.5']))
    expect(action).not.toContain('top-1.5')
    const ground = classes(screen.getByTestId('tile'))
    expect(ground).toEqual(expect.arrayContaining(['group/tile', 'relative']))
  })

  it('stands in the top end corner unless told otherwise', () => {
    render(<Reference />)
    expect(classes(screen.getByRole('button', { name: 'Remove the reference' }))).toEqual(
      expect.arrayContaining(['top-1.5', 'end-1.5']),
    )
  })

  it('shows on the tile’s hover and focus, under a menu it opened, and always without a pointer', async () => {
    render(<Reference />)
    const css = await compileClasses(classes(screen.getByRole('button', { name: 'Remove the reference' })))
    expect(css).toMatch(/\.opacity-0\s*\{\s*opacity: 0%/)
    for (const selector of [
      String.raw`:where(.group\/tile):hover`,
      String.raw`:where(.group\/tile):focus-within`,
      '[data-popup-open]',
    ]) {
      expect(css).toContain(selector)
    }
    expect(css).toMatch(/@media \(pointer: coarse\)\s*\{\s*\.pointer-coarse\\:opacity-100/)
  })

  it('is a menu’s trigger when asked, and keeps the type the trigger gives it', async () => {
    render(
      <Tile>
        <TileButton aria-label="Open frame">
          <img src="data:," alt="" />
        </TileButton>
        <Menu>
          <TileAction label="Frame actions" render={<MenuTrigger />}>
            <svg aria-hidden />
          </TileAction>
          <MenuPopup>
            <MenuItem>Use as cover</MenuItem>
          </MenuPopup>
        </Menu>
      </Tile>,
    )
    const trigger = screen.getByRole('button', { name: 'Frame actions' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('type')).toBe('button')
    await userEvent.click(trigger)
    expect(await screen.findByRole('menuitem', { name: 'Use as cover' })).toBeDefined()
    expect(trigger.hasAttribute('data-popup-open')).toBe(true)
  })

  it('draws its ground as a list item when asked', () => {
    render(
      <ul>
        <Tile render={<li />} data-testid="tile">
          <TileButton aria-label="Open reference">
            <img src="data:," alt="" />
          </TileButton>
        </Tile>
      </ul>,
    )
    expect(screen.getByTestId('tile').tagName).toBe('LI')
  })

  it('passes axe, with a cross and with a menu', async () => {
    await expectNoA11yViolations(
      <div>
        <Reference />
        <Tile>
          <TileButton aria-label="Open frame">
            <img src="data:," alt="" />
          </TileButton>
          <Menu>
            <TileAction label="Frame actions" render={<MenuTrigger />}>
              <svg aria-hidden />
            </TileAction>
          </Menu>
        </Tile>
      </div>,
    )
  })
})
