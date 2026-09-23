// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ScrollArea } from './scroll-area'

/*
 * What has to be true of a scroll area.
 *
 * The defects that matter are the ones a screenshot does not show: a viewport
 * that scrolls and cannot be reached by keyboard, one that is reachable and
 * has no name, a native bar left drawn beside the overlay one - which is a
 * gutter again - and a fade that marks an edge as having more when it is at
 * its end.
 *
 * jsdom has no layout, so every box measures zero and nothing overflows. The
 * cases that need overflow give the prototype a content taller than its box.
 */

const METRICS = ['clientHeight', 'scrollHeight', 'clientWidth', 'scrollWidth'] as const
const box = Object.getOwnPropertyDescriptors(Element.prototype)

/** Every box 100 by 100, with content `height` tall. Base UI measures nothing
 * at all while the content has no width, so the width is given too. */
function overflowing(height: number) {
  const sizes = { clientHeight: 100, scrollHeight: height, clientWidth: 100, scrollWidth: 100 }
  for (const key of METRICS) {
    Object.defineProperty(Element.prototype, key, { configurable: true, get: () => sizes[key] })
  }
}

afterEach(() => {
  for (const key of METRICS) Object.defineProperty(Element.prototype, key, box[key]!)
})

function Area(props: { fade?: boolean }) {
  return (
    <ScrollArea label="Recent activity" className="h-40" {...props}>
      <ul>
        {Array.from({ length: 30 }, (_, index) => (
          <li key={index}>Entry {index + 1}</li>
        ))}
      </ul>
    </ScrollArea>
  )
}

const viewport = () => screen.getByRole('group', { name: 'Recent activity' })

describe('ScrollArea', () => {
  it('makes an overflowing viewport a named tab stop', async () => {
    // Without this a reader with no pointer never sees below the fold.
    overflowing(1000)
    render(<Area />)
    await waitFor(() => expect(viewport().tabIndex).toBe(0))
  })

  it('keeps a viewport that does not scroll out of the tab order', async () => {
    // A tab stop that does nothing when reached is a stop the reader wastes.
    overflowing(100)
    render(<Area />)
    await waitFor(() => expect(viewport().tabIndex).toBe(-1))
  })

  it('names the viewport from the prop, whatever overflows', () => {
    render(<Area />)
    expect(viewport().getAttribute('aria-label')).toBe('Recent activity')
  })

  it('hides the native bar, so no gutter takes width', () => {
    render(<Area />)
    // Base UI's class sets `scrollbar-width: none` and the WebKit equivalent.
    expect(viewport().className).toMatch(/base-ui-disable-scrollbar/)
  })

  it('draws a bar only for an axis that overflows', async () => {
    overflowing(1000)
    const { container } = render(<Area />)
    await waitFor(() =>
      expect(container.querySelector('[data-orientation="vertical"]')).not.toBeNull(),
    )
    expect(container.querySelector('[data-orientation="horizontal"]')).toBeNull()
  })

  it('shows the bar only on hover or scroll', async () => {
    overflowing(1000)
    const { container } = render(<Area />)
    await waitFor(() =>
      expect(container.querySelector('[data-orientation="vertical"]')).not.toBeNull(),
    )
    const bar = container.querySelector<HTMLElement>('[data-orientation="vertical"]')!
    expect(bar.className).toMatch(/(^|\s)opacity-0(\s|$)/)
    expect(bar.className).toContain('data-[hovering]:opacity-100')
    expect(bar.className).toContain('data-[scrolling]:opacity-100')
  })

  it('fades only when asked, and only by the distance left to the edge', () => {
    const { rerender } = render(<Area />)
    expect(viewport().className).not.toContain('mask-image')
    rerender(<Area fade />)
    expect(viewport().className).toContain('--scroll-area-overflow-y-start')
    expect(viewport().className).toContain('--scroll-area-overflow-x-end')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Area fade />)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('has no accessibility violations when it scrolls', async () => {
    overflowing(1000)
    const { container, unmount } = await expectNoA11yViolations(<Area />)
    // The gate runs on the first render, before Base UI has measured and made
    // the viewport a tab stop. The state worth checking is the one after:
    // focusable, and so obliged to have a name and a role that allows one.
    await waitFor(() => expect(viewport().tabIndex).toBe(0))
    const settled = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    })
    expect(settled.violations.map((violation) => violation.id)).toEqual([])
    unmount()
  })

  it('has no accessibility violations when it does not', async () => {
    const { unmount } = await expectNoA11yViolations(<Area />)
    unmount()
  })
})
