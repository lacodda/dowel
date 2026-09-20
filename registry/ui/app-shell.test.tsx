// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { AppShell, Screen, screenVariants } from './app-shell'

describe('AppShell', () => {
  it('draws the bar, the rail and the screen', () => {
    render(
      <AppShell top={<div>bar</div>} side={<div>rail</div>}>
        <Screen>content</Screen>
      </AppShell>,
    )
    expect(screen.getByText('bar')).toBeDefined()
    expect(screen.getByText('rail')).toBeDefined()
    expect(screen.getByText('content')).toBeDefined()
  })

  /*
   * The two failures this component exists to prevent, asserted on the grid
   * rather than on what is in it. Both were shipped bugs: a grid item's
   * `min-width` and `min-height` default to `auto`, so a track measures its
   * content instead of its share of the window - the rail's border stopped
   * halfway down a tall window, and one wide table pushed the screen out from
   * under the sidebar.
   */
  it('lets the rail reach the bottom of a tall window', () => {
    const { container } = render(
      <AppShell top={<div>bar</div>} side={<div>rail</div>}>
        <Screen>content</Screen>
      </AppShell>,
    )
    const rail = screen.getByText('rail').parentElement!
    expect(rail.className, 'the rail measures its content, not the track').toContain('min-h-0')
    expect(container.firstElementChild!.className).toContain('h-full')
  })

  it('keeps a wide screen inside its column', () => {
    render(
      <AppShell side={<div>rail</div>}>
        <Screen>content</Screen>
      </AppShell>,
    )
    const column = screen.getByText('content').parentElement!
    expect(column.className, 'a wide child grows the column instead of scrolling').toContain('min-w-0')
    expect(column.className).toContain('min-h-0')
  })

  it('builds only the tracks it was given', () => {
    const { container: both } = render(
      <AppShell top={<div>bar</div>} side={<div>rail</div>}>
        <Screen>a</Screen>
      </AppShell>,
    )
    const withBoth = (both.firstElementChild as HTMLElement).style
    expect(withBoth.gridTemplateColumns).toBe('var(--spacing-rail) minmax(0, 1fr)')
    expect(withBoth.gridTemplateRows).toBe('var(--spacing-titlebar) minmax(0, 1fr)')

    // Without a rail there is one column, not two with an empty one still
    // eating its track.
    const { container: alone } = render(
      <AppShell>
        <Screen>b</Screen>
      </AppShell>,
    )
    const withNeither = (alone.firstElementChild as HTMLElement).style
    expect(withNeither.gridTemplateColumns).toBe('minmax(0, 1fr)')
    expect(withNeither.gridTemplateRows).toBe('minmax(0, 1fr)')
  })

  it('takes the chrome sizes from the theme rather than inventing them', () => {
    // The whole point of the tokens: four products drew their own title bar
    // and by the fourth it was 40px in one and 2.4rem in another.
    const { container } = render(
      <AppShell top={<div>bar</div>} side={<div>rail</div>}>
        <Screen>a</Screen>
      </AppShell>,
    )
    const style = (container.firstElementChild as HTMLElement).style
    expect(style.gridTemplateRows).toContain('var(--spacing-titlebar)')
    expect(style.gridTemplateColumns).toContain('var(--spacing-rail)')
  })

  it('takes a number as pixels and a string as it stands', () => {
    const { container } = render(
      <AppShell top={<div>bar</div>} side={<div>rail</div>} sideWidth={180} topHeight="3rem">
        <Screen>a</Screen>
      </AppShell>,
    )
    const style = (container.firstElementChild as HTMLElement).style
    expect(style.gridTemplateColumns).toBe('180px minmax(0, 1fr)')
    expect(style.gridTemplateRows).toBe('3rem minmax(0, 1fr)')
  })

  it('runs the bar across the rail as well', () => {
    // A bar that started after the rail left a notch in the top-left corner.
    render(
      <AppShell top={<div>bar</div>} side={<div>rail</div>}>
        <Screen>a</Screen>
      </AppShell>,
    )
    const bar = screen.getByText('bar').parentElement as HTMLElement
    expect(bar.style.gridColumn).toBe('1 / -1')
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(
      <AppShell>
        <Screen>a</Screen>
      </AppShell>,
    )
    expect(container.firstElementChild!.className).toContain('overflow-hidden')
  })
})

describe('Screen', () => {
  it('is the landmark a reader jumps to', () => {
    render(<Screen>content</Screen>)
    expect(screen.getByRole('main')).toBeDefined()
  })

  it('scrolls itself when it flows and never when it is held', () => {
    expect(screenVariants({ scroll: 'flow' })).toContain('overflow-y-auto')
    expect(screenVariants({ scroll: 'held' })).not.toContain('overflow-y-auto')
    expect(screenVariants({ scroll: 'held' })).toContain('overflow-hidden')
  })

  it('reserves the scrollbar so navigation does not jump sideways', () => {
    // Without it a skeleton is short, what replaces it is not, and every
    // navigation moved the page a few pixels left.
    expect(screenVariants({ scroll: 'flow' })).toContain('[scrollbar-gutter:stable]')
  })

  it('flows by default, because held clips and flow never does', () => {
    expect(screenVariants({})).toBe(screenVariants({ scroll: 'flow', pad: 'default' }))
  })

  it('draws every pad step differently, and none at all for none', () => {
    const steps = ['default', 'tight', 'none'] as const
    const drawn = new Map(steps.map((pad) => [pad, screenVariants({ pad })]))
    expect(new Set(drawn.values()).size, 'two pad steps draw the same').toBe(steps.length)
    expect(drawn.get('none')).not.toContain('px-')
  })

  it('never grows past the height it was handed', () => {
    // `min-h-0` on a flex child is what lets it be shorter than its content;
    // without it the screen grows and the window scrolls, which is the one
    // thing the shell forbids.
    expect(screenVariants({})).toContain('min-h-0')
  })
})

describe('AppShell, for a reader', () => {
  it('passes axe as a whole frame', async () => {
    await expectNoA11yViolations(
      <AppShell top={<header>bar</header>} side={<nav aria-label="Screens">rail</nav>}>
        <Screen>
          <h1>A screen</h1>
        </Screen>
      </AppShell>,
    )
  })

  it('passes axe with neither bar nor rail', async () => {
    await expectNoA11yViolations(
      <AppShell>
        <Screen>
          <h1>A screen</h1>
        </Screen>
      </AppShell>,
    )
  })
})
