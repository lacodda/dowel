import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Every popup takes the layer it was opened in.
 *
 * `layer.tsx` only works if every primitive that portals asks for it: a popup
 * that portals to the body on its own draws under the dialog that opened it,
 * and which variable it reads its z-index from is exactly what a caller
 * cannot be expected to know. kilna held the same rule with a gate after the
 * third such popup; this is it for the set. A primitive that portals does one
 * of two things:
 *
 * - it is a popup, and portals into `usePopupContainer()` unless the caller
 *   says otherwise - `container ?? host`;
 * - it is an overlay on a rung of its own - a dialog, a drawer, the palette, a
 *   popover - and opens a layer for what is inside it, in its own portal, so
 *   a modal's focus trap counts the popups as its own rather than hiding them
 *   from a reader.
 */

const componentDir = resolve(import.meta.dirname, '../registry/ui')

const portalling = readdirSync(componentDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => ({ file, source: readFileSync(resolve(componentDir, file), 'utf8') }))
  .filter(({ source }) => source.includes('<Base.Portal'))

/** Portals that are right to ignore layers, each with the reason. */
const OUTSIDE_LAYERS: Record<string, string> = {
  // Toasts belong to the application, not to whatever was on screen when one
  // was raised: they sit on the top rung, above every overlay, by design.
  'toast.tsx': 'the top rung, above every overlay',
}

describe('every primitive that portals', () => {
  it('finds them', () => {
    // A scan that finds nothing is green whatever the set does.
    expect(portalling.map(({ file }) => file)).toEqual(
      expect.arrayContaining(['dialog.tsx', 'menu.tsx', 'popover.tsx', 'select.tsx', 'tooltip.tsx']),
    )
  })

  it.each(portalling.map(({ file }) => file))('%s lands in the layer it was opened in', (file) => {
    if (OUTSIDE_LAYERS[file]) return
    const { source } = portalling.find((entry) => entry.file === file)!
    const takesHost =
      source.includes('const host = usePopupContainer()') && /<Base\.Portal[^>]*container=\{container \?\? host\}/.test(source)
    const opensLayer = /<Base\.Portal ref=\{portal\}/.test(source) && /<LayerProvider above="[a-z]+" mount=\{portal\}>/.test(source)
    expect(takesHost || opensLayer, `${file} portals without taking or opening a layer`).toBe(true)
  })

  it('names no exception that has since joined a layer', () => {
    for (const file of Object.keys(OUTSIDE_LAYERS)) {
      const source = readFileSync(resolve(componentDir, file), 'utf8')
      expect(source.includes('usePopupContainer') || source.includes('LayerProvider'), file).toBe(false)
    }
  })
})
