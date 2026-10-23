/*
 * Contrast, measured on the page as it is painted now.
 *
 * The accent switch repaints the whole catalogue in one product's colour, and
 * the question a person asks next is whether it still reads. The tests answer
 * that for every product in CI; this answers it for the one on screen, in the
 * theme and the contrast mode on screen, from the colours the browser actually
 * resolved - the derived shades exist only after `color-mix` and `oklch(from
 * ...)` have run, so there is nothing to compute them from anywhere else.
 *
 * The pairs are the package's own, `contrastPromises`: the list the CI gate
 * holds every product to, so the page and the gate cannot disagree about what
 * was promised.
 */
import { contrastPromises, type ContrastMode, type Rgba } from 'dowel-ui'

export { contrastFloor, contrastRatio, measure, promiseName } from 'dowel-ui'

/** The pairs in force: more contrast when the root pins it, or when the
 * system asks for it and the root does not pin it off. */
export function promisesInForce(root: HTMLElement = document.documentElement) {
  return contrastPromises(contrastModeOf(root))
}

export function contrastModeOf(root: HTMLElement = document.documentElement): ContrastMode {
  if (root.classList.contains('contrast-more')) return 'more'
  if (root.classList.contains('contrast-normal')) return 'normal'
  return window.matchMedia?.('(prefers-contrast: more)').matches ? 'more' : 'normal'
}

/** The token as the browser painted it, in sRGB, with its alpha.
 *
 * A computed colour comes back in whatever space the browser keeps it -
 * `oklab()`, `color(srgb ...)` - so it goes through a one-pixel canvas, which
 * converts it the way the screen does. The canvas starts transparent, so a
 * translucent token keeps its alpha, and the measure lays it over its surface
 * the way the page does. */
export function paintedColour(token: string, host: HTMLElement = document.body): Rgba | null {
  const probe = host.appendChild(document.createElement('i'))
  try {
    probe.style.color = `var(--${token})`
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d')
    if (!context) return null
    context.fillStyle = getComputedStyle(probe).color
    context.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
    return [r!, g!, b!, a! / 255]
  } finally {
    probe.remove()
  }
}
