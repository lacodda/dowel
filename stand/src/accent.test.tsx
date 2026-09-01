// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { lineProducts } from 'dowel-ui'
import { App } from './App'

/*
 * Where the accent has to be set.
 *
 * The stand's accent switch did nothing at first, and the reason is worth a
 * test rather than a comment: it set `--accent-base` on a container. That
 * looks equivalent to setting it at the root and is not. The theme declares
 * `--accent: var(--accent-base)` inside `:root`, so the derived value resolves
 * against the root's own `--accent-base`; a value further down the tree is
 * invisible to a rule computed above it.
 *
 * The switch appeared to work - the property was set, the element had it - and
 * every colour on the page stayed exactly as it was.
 */

/** The mistake: the accent on a container. */
function OnContainer({ accent }: { accent: string }) {
  return (
    <div data-testid="container" style={{ ['--accent-base' as string]: accent }}>
      <span data-testid="child" />
    </div>
  )
}

/** What the stand does now, and what a product does: the accent at the root. */
function OnRoot({ accent }: { accent: string }) {
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-base', accent)
  }, [accent])
  return <span data-testid="child" />
}

beforeEach(() => {
  // jsdom has no `matchMedia`, and the theme hook asks the operating system
  // which theme is showing.
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.style.removeProperty('--accent-base')
  document.documentElement.style.removeProperty('--accent')
})

describe('the accent reaches the derived tokens', () => {
  /** The theme's rule, as the root declares it. */
  function declareThemeRule() {
    document.documentElement.style.setProperty('--accent-base', '#e8862d')
    document.documentElement.style.setProperty('--accent', 'var(--accent-base)')
  }

  it('does not, when the accent is set on a container', () => {
    // The property is there on the container - that is what made this look
    // like it worked - but `--accent` was resolved at the root and stays put.
    declareThemeRule()
    const { getByTestId } = render(<OnContainer accent="#d9569e" />)

    expect(getByTestId('container').style.getPropertyValue('--accent-base')).toBe('#d9569e')
    expect(
      document.documentElement.style.getPropertyValue('--accent-base'),
      'the root still holds the old accent, so every derived token does too',
    ).toBe('#e8862d')
  })

  it('does, when the accent is set at the root', () => {
    declareThemeRule()
    render(<OnRoot accent="#d9569e" />)
    expect(document.documentElement.style.getPropertyValue('--accent-base')).toBe('#d9569e')
  })

  it('carries every product of the line', () => {
    for (const product of lineProducts) {
      const { unmount } = render(<OnRoot accent={product.accent} />)
      expect(
        document.documentElement.style.getPropertyValue('--accent-base'),
        `\`${product.name}\` does not reach the root`,
      ).toBe(product.accent)
      unmount()
    }
  })
})

describe('the stand itself', () => {
  /* The switches used to be native `<select>` elements, which is what these
   * tests were written against. They are the set's own Select now - the stand
   * of a system may not use the one element that system forbids - so the tests
   * drive it the way a person does: open, then choose. */
  async function openAccentSwitch() {
    const user = userEvent.setup()
    render(<App />)
    const trigger = screen.getByRole('combobox', { name: /accent/i })
    await user.click(trigger)
    return { user, listbox: await screen.findByRole('listbox') }
  }

  it('puts the chosen accent where the theme can see it', async () => {
    // The check above describes the mechanism; this one holds the stand to it.
    // Driving the real switch is the only version that goes red if someone
    // sets the accent on a container again.
    const { user } = await openAccentSwitch()

    const kilna = lineProducts.find((entry) => entry.name === 'kilna')!
    await user.click(screen.getByRole('option', { name: 'kilna' }))

    await waitFor(() =>
      expect(
        document.documentElement.style.getPropertyValue('--accent-base'),
        'the accent did not reach the root, so no derived token changed',
      ).toBe(kilna.accent),
    )
  })

  it('offers every product of the line', async () => {
    await openAccentSwitch()
    const offered = screen.getAllByRole('option').map((option) => option.textContent)
    expect(offered).toEqual(lineProducts.map((product) => product.name))
  })
})
