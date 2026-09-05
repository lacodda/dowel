import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { allTokens, colorTokens, token } from './index'

const css = readFileSync(fileURLToPath(new URL('./theme.css', import.meta.url)), 'utf8')

/** Declarations of a custom property, as `--name: value`. A property is only
 * counted where it is being defined, not where it is read through `var()`. */
function declarationsOf(name: string): string[] {
  const pattern = new RegExp(`(?<![\\w-])${name}\\s*:\\s*([^;]+);`, 'g')
  return [...css.matchAll(pattern)].map((m) => m[1]!.trim())
}

const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')

/** The body of a block, found by matching braces from its selector. A regexp
 * cannot do this: `@media` blocks nest declarations, so the closing brace of a
 * rule is not the first one after it. Comments are stripped first - the theme
 * explains itself in prose that mentions selectors and contains braces. */
function blockBody(selector: string): string {
  const start = withoutComments.indexOf(selector)
  expect(start, `block \`${selector}\` is missing`).toBeGreaterThan(-1)
  const open = withoutComments.indexOf('{', start)
  let depth = 0
  for (let i = open; i < withoutComments.length; i++) {
    if (withoutComments[i] === '{') depth++
    else if (withoutComments[i] === '}') {
      depth--
      if (depth === 0) return withoutComments.slice(open + 1, i)
    }
  }
  throw new Error(`block \`${selector}\` is not closed`)
}

describe('token vocabulary', () => {
  it('declares every token the package names', () => {
    for (const name of allTokens) {
      expect(declarationsOf(token(name)).length, `\`${token(name)}\` is never declared`).toBeGreaterThan(0)
    }
  })

  it('names every token the theme declares', () => {
    const known = new Set<string>(allTokens.map(token))
    const declared = [...css.matchAll(/^\s*(--[\w-]+)\s*:/gm)]
      .map((m) => m[1]!)
      // `--color-*` entries map the vocabulary onto Tailwind utilities rather
      // than adding to it, and `--text-…--line-height` is Tailwind's way of
      // attaching a line height to a size - part of that token, not another.
      .filter((name) => !name.startsWith('--color-') && !name.endsWith('--line-height'))

    for (const name of declared) {
      expect(known, `\`${name}\` is declared but not exported by the package`).toContain(name)
    }
  })

  it('exposes every colour token to Tailwind', () => {
    const theme = blockBody('@theme inline')
    for (const name of colorTokens) {
      expect(theme, `\`${name}\` has no \`--color-\` mapping`).toContain(`--color-${name}: var(--${name});`)
    }
  })

  it('drops the stock palette so raw colour utilities cannot compile', () => {
    expect(blockBody('@theme inline')).toContain('--color-*: initial;')
  })
})

describe('themes', () => {
  it('defines the dark theme on the bare root, so it is the default', () => {
    const root = blockBody(':root {')
    expect(root).toContain('color-scheme: dark;')
  })

  it('pins the light theme by class and follows the system without one', () => {
    expect(blockBody(':root.light')).toContain('color-scheme: light;')
    expect(blockBody('@media (prefers-color-scheme: light)')).toContain(':root:not(.dark)')
  })

  it('gives the class-pinned and system light themes the same values', () => {
    // Two selectors, one theme: a value that changed in one place and not the
    // other would make a product look different depending on the OS setting.
    const pinned = blockBody(':root.light')
    const system = blockBody('@media (prefers-color-scheme: light)')

    const values = (body: string) =>
      Object.fromEntries(
        [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]),
      )

    expect(values(pinned)).toEqual(values(system))
  })

  it('redefines every theme-dependent colour in the light theme', () => {
    // A colour defined only in the dark theme would survive into the light one
    // and read as a bug on a white ground. Translucent surfaces and the
    // accent-derived tokens are the ones that must swap.
    const light = blockBody(':root.light')
    for (const name of ['bg', 'raise', 'soft', 'softer', 'line', 'line-2', 'text', 'dim', 'faint', 'accent', 'accent-2', 'accent-soft', 'good', 'warn', 'bad', 'info', 'shadow-raise']) {
      expect(light, `\`--${name}\` does not swap in the light theme`).toContain(`--${name}:`)
    }
  })
})

describe('accent', () => {
  it('derives the accent from the single product parameter', () => {
    // The point of the parameter: a product sets `--accent-base` and the rest
    // of the accent family follows. Any of these written as a literal colour
    // would silently ignore the product's hue.
    for (const name of ['accent', 'accent-2', 'accent-soft']) {
      for (const value of declarationsOf(`--${name}`)) {
        expect(value, `\`--${name}\` does not follow \`--accent-base\``).toContain('var(--accent-base)')
      }
    }
  })

  it('tints the neutrals with the product hue', () => {
    for (const name of ['bg', 'text', 'dim', 'faint']) {
      for (const value of declarationsOf(`--${name}`)) {
        expect(value, `\`--${name}\` is not tinted with \`--neutral-base\``).toContain('var(--neutral-base)')
      }
    }
  })

  it('works out `on-accent` rather than letting a product state it', () => {
    // The brand-line S-tile rule: a light accent takes dark glyphs, a dark one
    // white. Hard-coding `#fff` here is what the live products had to do, and
    // is exactly what this theme replaces.
    const declared = declarationsOf('--on-accent')
    expect(declared.length).toBeGreaterThan(0)
    for (const value of declared) {
      expect(value).toMatch(/contrast-color|oklch\(from/)
    }
  })

  it('keeps status colours out of the product accent', () => {
    // `good` that shifted per product would stop meaning good.
    for (const name of ['good', 'warn', 'bad', 'info']) {
      for (const value of declarationsOf(`--${name}`)) {
        expect(value, `\`--${name}\` must not follow the accent`).not.toContain('accent')
      }
    }
  })
})

describe('scales', () => {
  // Durations and stacking order are custom properties rather than Tailwind
  // namespaces - `duration-*` takes a literal number and there is no z-index
  // namespace at all - so the compiler cannot vouch for them. They are checked
  // here; everything that does become a utility is checked by compiling it.

  it('orders the stacking scale strictly upwards', () => {
    // The names are a promise about what covers what. A step out of order
    // would put a menu over a modal, which is exactly the bug the products hit
    // when the command palette had to invent z-70 to clear z-50.
    const layers = ['popup', 'sticky', 'menu', 'floating', 'overlay', 'modal', 'palette', 'toast']
    const values = layers.map((name) => {
      const declared = declarationsOf(`--z-${name}`)
      expect(declared.length, `\`--z-${name}\` is missing`).toBe(1)
      return Number(declared[0])
    })

    for (let i = 1; i < values.length; i++) {
      expect(values[i], `\`${layers[i]}\` does not sit above \`${layers[i - 1]}\``).toBeGreaterThan(values[i - 1]!)
    }
  })

  it('orders the durations from quick to slow', () => {
    const ms = (name: string) => {
      const declared = declarationsOf(`--duration-${name}`)
      expect(declared.length, `\`--duration-${name}\` is missing`).toBe(1)
      return Number(declared[0]!.replace('ms', ''))
    }
    expect(ms('quick')).toBeLessThan(ms('base'))
    expect(ms('base')).toBeLessThan(ms('slow'))
  })

  it('keeps every elevation step in every theme', () => {
    // A shadow that exists only in the dark theme leaves a light screen with
    // no elevation at all, and nothing on the page says so.
    for (const step of ['lift', 'raise', 'float']) {
      expect(blockBody(':root {'), `dark theme has no \`--shadow-${step}\``).toContain(`--shadow-${step}:`)
      expect(blockBody(':root.light'), `light theme has no \`--shadow-${step}\``).toContain(`--shadow-${step}:`)
    }
  })
})

describe('base layer', () => {
  it('honours reduced motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('draws the focus ring in the accent', () => {
    expect(blockBody(':focus-visible')).toContain('var(--accent)')
  })
})

/*
 * Scrollbars.
 *
 * These are asserted against the stylesheet rather than a rendered page on
 * purpose. A headless browser overlays its scrollbars whatever the stylesheet
 * says, so `offsetWidth - clientWidth` reads zero for a classic bar too — a
 * layout measurement would pass on a stylesheet that reserves a gutter, which
 * is worse than no check at all. What the rules say is the thing that is
 * actually under our control, so that is what is checked.
 */
describe('scrollbars', () => {
  it('asks for the thin standard bar with a transparent track', () => {
    // The standard property is what Firefox honours; the -webkit rules below
    // are what Chromium and the WebViews lay out. Both are needed, and a
    // stylesheet with only one of them looks right in exactly one browser.
    const rule = blockBody('* {')
    expect(rule, 'the standard scrollbar property is missing').toContain('scrollbar-width: thin')
    expect(rule, 'the standard track is painted rather than left alone').toContain('transparent')
  })

  it('paints the thumb from a token, never a literal colour', () => {
    // The bar is chrome, and chrome in this system comes from the vocabulary:
    // a product that changes its neutral tint gets a matching bar for free.
    const thumb = blockBody('*::-webkit-scrollbar-thumb {')
    expect(thumb).toContain('var(--')
    expect(thumb, 'the thumb hardcodes a colour').not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('leaves the track and the corner unpainted', () => {
    // An overlay bar is drawn over the content. A painted track is a gutter
    // with a colour, which is the classic bar with extra steps.
    expect(blockBody('*::-webkit-scrollbar-track {')).toContain('transparent')
    expect(blockBody('*::-webkit-scrollbar-corner {')).toContain('transparent')
  })

  it('removes the step arrows', () => {
    // The one part of a classic scrollbar nobody uses, and Chromium draws it
    // by default.
    expect(blockBody('*::-webkit-scrollbar-button {')).toContain('display: none')
  })

  it('insets the thumb without shrinking what can be grabbed', () => {
    // A transparent border clipped away from the background makes the visible
    // thumb narrower than the strip while the whole strip stays a hit target.
    // Without the clip the border is painted and the inset does nothing.
    const thumb = blockBody('*::-webkit-scrollbar-thumb {')
    expect(thumb).toMatch(/border:\s*\d+px solid transparent/)
    expect(thumb, 'the transparent border is painted, so it insets nothing').toMatch(
      /background-clip:\s*(content|padding)-box/,
    )
  })

  it('gives the thumb a floor so it cannot become a hairline', () => {
    // On a very long document the thumb is proportional to the viewport and
    // collapses to a few pixels — visible, but not something a pointer can
    // catch.
    expect(blockBody('*::-webkit-scrollbar-thumb {')).toContain('min-height')
  })
})
