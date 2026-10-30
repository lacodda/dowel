/*
 * The colours of each product, resolved - `palettes/<product>.json`, one per
 * product of the line.
 *
 * `tokens.json` leaves most colours out on purpose: `--bg`, `--text`,
 * `--accent-2` and the rest are `color-mix()` and `oklch(from …)` expressions
 * over a product's accent, and they have no value until something evaluates
 * them. A web product has a browser for that. A native one - nitid draws with
 * wgpu and egui, and a Tauri window wants its background colour before the
 * WebView has painted - has nothing that reads CSS.
 *
 * So the build hands the theme to a browser and writes down what it computed.
 * The formulas stay in one place, `theme.css`; a consumer gets numbers rather
 * than a second implementation of the derivation, which would drift from the
 * first the moment the theme changed a percentage. Writing our own evaluator
 * of `color-mix` would be exactly that second implementation, and the browser
 * is the thing every web product of the line is actually drawn by.
 *
 * The form: Design Tokens Format Module 2025.10, every colour the theme
 * declares, in both themes and in both of them under more contrast, as
 * `#rrggbb` or `#rrggbbaa`. Eight bits per channel is what the browser itself
 * keeps for alpha (`0.045` comes back as `0.043`), so nothing finer is lost.
 */
import { chromium } from '@playwright/test'

/*
 * The inputs a product replaces, rather than colours it paints with. A
 * consumer that wants the accent reads `accent`, which is the accent as the
 * theme uses it - darkened in the light theme, where `accent-base` is not.
 */
const PARAMETERS = new Set(['accent-base', 'neutral-base', 'ground', 'ink'])

/** Every custom property the theme declares, in the order it declares them. */
const declaredNamesOf = (css) => [
  ...new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?<![\w-])--([a-z0-9-]+)\s*:/g)].map((m) => m[1])),
].filter((name) => !PARAMETERS.has(name))

/*
 * Colour, as the browser's computed style spells it, into sRGB.
 *
 * Chromium hands back `rgb()`/`rgba()` for anything already in sRGB and the
 * space of the mix for the rest - `oklab()` for `color-mix(in oklab, …)`,
 * `oklch()` for relative colour. Converting that is a change of notation, not
 * a derivation: the value is already decided.
 */
function parseColor(text) {
  const numbers = (body) =>
    body
      .replace(/[,/]/g, ' ')
      .trim()
      .split(/\s+/)
      .map((token) => (token === 'none' ? 0 : Number.parseFloat(token) / (token.endsWith('%') ? 100 : 1)))

  let match = text.match(/^rgba?\((.*)\)$/)
  if (match) {
    const [r, g, b, a = 1] = numbers(match[1])
    return { rgb: [r / 255, g / 255, b / 255], alpha: a }
  }
  match = text.match(/^color\(srgb (.*)\)$/)
  if (match) {
    const [r, g, b, a = 1] = numbers(match[1])
    return { rgb: [r, g, b], alpha: a }
  }
  match = text.match(/^oklab\((.*)\)$/)
  if (match) {
    const [l, a, b, alpha = 1] = numbers(match[1])
    return { rgb: oklabToSrgb(l, a, b), alpha }
  }
  match = text.match(/^oklch\((.*)\)$/)
  if (match) {
    const [l, c, h, alpha = 1] = numbers(match[1])
    const radians = (h * Math.PI) / 180
    return { rgb: oklabToSrgb(l, c * Math.cos(radians), c * Math.sin(radians)), alpha }
  }
  throw new Error(`the browser answered \`${text}\`, which this script does not know how to read`)
}

/** Björn Ottosson's OKLab, back to gamma-encoded sRGB. */
function oklabToSrgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return linear.map((c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055))
}

/*
 * Out-of-gamut channels are clipped, which is what the browser does when it
 * paints them on an sRGB screen - so the file says what a web product shows.
 */
function hex({ rgb, alpha }) {
  const byte = (x) =>
    Math.round(Math.min(1, Math.max(0, x)) * 255)
      .toString(16)
      .padStart(2, '0')
  const opaque = `#${rgb.map(byte).join('')}`
  return alpha >= 1 ? opaque : `${opaque}${byte(alpha)}`
}

/*
 * The groups a palette holds: each theme as drawn, and each under more
 * contrast - what a native product shows when its system asks for it, and
 * what the contrast gate holds to the stronger promise.
 */
const MODES = [
  ['dark', 'dark', 'normal'],
  ['light', 'light', 'normal'],
  ['dark-contrast-more', 'dark', 'more'],
  ['light-contrast-more', 'light', 'more'],
]

/** Every product's palette, resolved by a browser: product name -> the DTCG
 * object `palettes/<product>.json` holds. */
export async function palettes(css, products, version) {
  const declaredNames = declaredNamesOf(css)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()

    /** Every colour of the theme for one accent, in one theme and one contrast
     * mode. Pinned by class and by the media queries alike, so neither can
     * leave the other's values in place. */
    async function resolveTheme(accent, theme, contrast) {
      await page.emulateMedia({ colorScheme: theme, contrast: contrast === 'more' ? 'more' : 'no-preference' })
      const pins = contrast === 'more' ? `${theme} contrast-more` : theme
      await page.setContent(
        `<!doctype html><html class="${pins}"><head><style>${css}</style>` +
          `<style>:root { --accent-base: ${accent}; }</style></head><body><i id="probe"></i></body></html>`,
      )
      // The callback runs in the page, not in Node, so it sees the browser's globals.
      /* global document, getComputedStyle, CSS */
      return page.evaluate((names) => {
        const root = getComputedStyle(document.documentElement)
        const probe = document.getElementById('probe')
        const found = []
        for (const name of names) {
          const raw = root.getPropertyValue(`--${name}`).trim()
          // Shadows, lengths, fonts and the Tailwind-only `@theme` names drop
          // out here: the first are not colours, the last do not exist in a
          // browser.
          if (raw === '' || !CSS.supports('color', raw)) continue
          probe.style.color = ''
          probe.style.color = raw
          found.push([name, getComputedStyle(probe).color])
        }
        return found
      }, declaredNames)
    }

    const resolved = {}
    for (const { name, code, accent, colorName } of products) {
      const color = { $type: 'color' }
      for (const [group, theme, contrast] of MODES) {
        color[group] = Object.fromEntries(
          (await resolveTheme(accent, theme, contrast)).map(([token, value]) => [token, { $value: hex(parseColor(value)) }]),
        )
      }
      resolved[name] = {
        $description: `${name} - every colour of the dowel theme on the ${colorName} accent ${accent}, resolved by a browser, in both themes, and in both under more contrast. For a consumer that cannot evaluate CSS; the formulas live in theme.css.`,
        $extensions: {
          'com.lacodda.dowel': { package: 'dowel-ui', version, product: name, code, accent },
        },
        color,
      }
    }
    return resolved
  } finally {
    await browser.close()
  }
}
