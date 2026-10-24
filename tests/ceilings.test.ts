import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, inject, it } from 'vitest'
import { BODIES, CEILING_ROOM, CEILING_WINDOW, surfaces, type CeilingMeasure } from './ceilings'

/*
 * Everything drawn over the page fits the window on both axes, and scrolls
 * inside itself when there is more than fits (decision of 02.09).
 *
 * A ceiling on one axis is not half done: it is a defect waiting for the long
 * case. The dialog was capped across from its first release and not down, and
 * hung off both ends of the window the first time kilna gave it a real form.
 * Overflow across shows at once; overflow down waits for the consumer whose
 * list has forty rows - and a short example on the stand always fits. So the
 * browser is given far more content than any window holds, in every variant
 * of every surface, and the surface has to stay inside its room:
 *
 * - placed against an anchor, the room its positioner publishes
 *   (`--available-width`, `--available-height`), which is what is left
 *   between the anchor and the window's edges;
 * - otherwise, the window itself.
 *
 * And what does not fit is reachable: the surface scrolls, or it clips and
 * names the part of it that scrolls (`BODIES` in `ceilings.ts`). Either way
 * the scroll is contained, so reaching the end of a list does not start
 * scrolling the page under it.
 */

const measured = inject('ceilings')
const failed = 'error' in measured ? measured.error : undefined
const measures: CeilingMeasure[] = 'error' in measured ? [] : measured
const where = (measure: CeilingMeasure) => `${measure.file}:${measure.line} ${measure.variant}`.trim()

describe('the surfaces over the page', () => {
  it('are all read', () => {
    expect(failed).toBeUndefined()
  })

  it('are all found', () => {
    // Counted a second way, by eye rather than by tree, so a reader that went
    // blind - an import it stopped recognising, a part renamed - fails here
    // instead of passing with nothing to measure.
    const dir = resolve(import.meta.dirname, '../registry/ui')
    const written = readdirSync(dir)
      .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
      .flatMap((file) => {
        const text = readFileSync(resolve(dir, file), 'utf8')
        // An element, not a type: `Omit<Base.Popup.Props, …>` is not a popup.
        const popups = text.match(/<Base\.Popup(?=[\s>/])/g)?.length ?? 0
        const toasts = text.includes("from '@base-ui/react/toast'") ? (text.match(/<Base\.Root(?=[\s>/])/g)?.length ?? 0) : 0
        return Array.from({ length: popups + toasts }, () => `ui/${file}`)
      })
      .sort()
    const read = surfaces().map((surface) => surface.file).sort()
    expect(read).toEqual(written)
    expect(read.length).toBeGreaterThanOrEqual(12)
  })

  it('are each measured in every variant', () => {
    for (const surface of surfaces()) {
      const shapes = measures.filter((measure) => measure.file === surface.file && measure.line === surface.line)
      expect(shapes.length, `${surface.file}:${surface.line}`).toBe(surface.shapes.length)
      expect(shapes.length, `${surface.file}:${surface.line}`).toBeGreaterThan(0)
    }
  })

  it('fit their room on both axes', () => {
    const over = measures.flatMap((measure) => {
      const room = measure.anchored ? CEILING_ROOM : CEILING_WINDOW
      const { left, top, width, height } = measure.box
      const problems = [
        width > room.width + 0.5 && `${Math.round(width)}px wide in a room of ${room.width}`,
        height > room.height + 0.5 && `${Math.round(height)}px tall in a room of ${room.height}`,
        // A surface the window places itself (a dialog, a drawer, a toast) is
        // inside the window, not only no larger than it.
        !measure.anchored &&
          (left < -0.5 || top < -0.5 || left + width > CEILING_WINDOW.width + 0.5 || top + height > CEILING_WINDOW.height + 0.5) &&
          `at ${Math.round(left)},${Math.round(top)} past the window's edge`,
      ].filter(Boolean)
      return problems.map((problem) => `${where(measure)}: ${problem}`)
    })
    expect(over).toEqual([])
  })

  it('scroll what does not fit, and keep the scroll to themselves', () => {
    const lost = measures.flatMap((measure) => {
      const clips = measure.overflow.y === 'hidden' || measure.overflow.y === 'clip'
      const problems = [
        measure.overflow.y === 'visible' && 'spills its content over the page',
        clips && measure.scroller === 'surface' && 'clips its content and names no part that scrolls (BODIES)',
        !clips && measure.scroller === 'body' && 'scrolls by itself, yet BODIES names a part for it',
        !['auto', 'scroll'].includes(measure.scroll.overflowY) && `its ${measure.scroller} does not scroll`,
        !measure.scroll.scrolls && `its ${measure.scroller} grew to the content instead of scrolling it`,
        measure.scroll.overscrollY !== 'contain' && `its ${measure.scroller} hands the scroll on to the page`,
      ].filter(Boolean)
      return problems.map((problem) => `${where(measure)}: ${problem}`)
    })
    expect(lost).toEqual([])
  })

  it('name only surfaces that exist', () => {
    const files = new Set(surfaces().map((surface) => surface.file))
    expect(Object.keys(BODIES).filter((file) => !files.has(file))).toEqual([])
  })
})
