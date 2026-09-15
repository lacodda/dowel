// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ActivityLegend } from './activity-legend'

/*
 * ActivityLegend.
 *
 * Its own component because the scale it explains is relative: the darkest
 * square is the busiest day in one particular grid, not a standard, and a
 * legend that does not say so lets five shades read as an absolute measure.
 */

describe('the legend', () => {
  it('shows one swatch per step, in the grid’s own fills', () => {
    const { container } = render(<ActivityLegend less="Less" more="More" />)
    const swatches = [...container.querySelectorAll('span')].filter((node) =>
      /bg-heat-/.test(node.className),
    )
    expect(swatches).toHaveLength(5)
  })

  it('names what the darkest square stands for, because the scale is relative', () => {
    /* Without it the five shades read as an absolute measure of a full day -
     * something this component has no opinion about. */
    const { container } = render(<ActivityLegend less="Less" more="More" busiest="busiest: 9h 40m" />)
    expect(container.textContent).toContain('busiest: 9h 40m')
  })

  it('names the other meanings only when the caller has them', () => {
    const without = render(<ActivityLegend less="Less" more="More" />)
    expect(without.container.textContent).toBe('LessMore')

    const with_ = render(
      <ActivityLegend less="Less" more="More" none="No data" partial="In progress" />,
    )
    expect(with_.container.textContent).toContain('No data')
    expect(with_.container.textContent).toContain('In progress')
  })
})

describe('accessibility', () => {
  it('passes axe with every meaning named', async () => {
    await expectNoA11yViolations(
      <ActivityLegend
        less="Less"
        more="More"
        busiest="busiest 8h"
        none="No data"
        partial="In progress"
      />,
    )
  })
})
