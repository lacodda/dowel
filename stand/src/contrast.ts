/*
 * Contrast, measured on the page as it is painted now.
 *
 * The accent switch repaints the whole catalogue in one product's colour, and
 * the question a person asks next is whether it still reads. The tests answer
 * that for every product in CI; this answers it for the one on screen, in the
 * theme on screen, from the colours the browser actually resolved - the
 * derived shades exist only after `color-mix` and `oklch(from ...)` have run,
 * so there is nothing to compute them from anywhere else.
 */

export type Rgb = readonly [number, number, number]

/** One pair the line promises to keep legible, and how legible. */
export interface ContrastPair {
  /** The token the text or the mark is drawn in. */
  ink: string
  /** The token it sits on. */
  ground: string
  /** The ratio it has to clear, and why that ratio. */
  needs: number
  role: 'body text' | 'secondary text' | 'text on a fill' | 'a control against its ground'
}

/** The pairs the theme is built around. Body text is held to AAA because it
 * is most of what anyone reads; everything else to the AA floor for its kind. */
export const contrastPairs: readonly ContrastPair[] = [
  { ink: 'text', ground: 'bg', needs: 7, role: 'body text' },
  { ink: 'text', ground: 'raise', needs: 7, role: 'body text' },
  { ink: 'dim', ground: 'bg', needs: 4.5, role: 'secondary text' },
  { ink: 'dim', ground: 'raise', needs: 4.5, role: 'secondary text' },
  { ink: 'on-accent', ground: 'accent', needs: 4.5, role: 'text on a fill' },
  { ink: 'on-good', ground: 'good', needs: 4.5, role: 'text on a fill' },
  { ink: 'on-warn', ground: 'warn', needs: 4.5, role: 'text on a fill' },
  { ink: 'on-bad', ground: 'bad', needs: 4.5, role: 'text on a fill' },
  { ink: 'on-info', ground: 'info', needs: 4.5, role: 'text on a fill' },
  { ink: 'accent', ground: 'bg', needs: 3, role: 'a control against its ground' },
  { ink: 'accent', ground: 'raise', needs: 3, role: 'a control against its ground' },
]

/** WCAG 2 relative luminance of an sRGB colour, channels 0-255. */
export function luminance([r, g, b]: Rgb): number {
  const linear = (channel: number) => {
    const c = channel / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

/** WCAG 2 contrast ratio of two opaque colours, from 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** The token as the browser painted it, in sRGB.
 *
 * A computed colour comes back in whatever space the browser keeps it -
 * `oklab()`, `color(srgb ...)` - so it goes through a one-pixel canvas, which
 * converts it the way the screen does. */
export function paintedColour(token: string, host: HTMLElement = document.body): Rgb | null {
  const probe = host.appendChild(document.createElement('i'))
  try {
    probe.style.color = `var(--${token})`
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d')
    if (!context) return null
    context.fillStyle = getComputedStyle(probe).color
    context.fillRect(0, 0, 1, 1)
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data
    return [r!, g!, b!]
  } finally {
    probe.remove()
  }
}
