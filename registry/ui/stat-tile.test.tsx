// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { StatRow, StatTile } from './stat-tile'

/*
 * StatTile.
 *
 * The tests are about the three things the hand-written copies got wrong or
 * nearly wrong: the markup that ties a number to its label, tone classes that
 * have to survive being combined, and a delta that must never appear when
 * there is nothing to compare against.
 */

describe('the markup, which is what ties the number to its label', () => {
  it('is a description list, not two loose divs', () => {
    // Read out of divs, "Worked" and "6h 12m" are two unrelated pieces of text
    // and nothing says the second is the value of the first.
    const { container } = render(<StatTile label="Worked" value="6h 12m" />)
    expect(container.querySelector('dl')).not.toBeNull()
    expect(container.querySelector('dt')?.textContent).toBe('Worked')
    expect(container.querySelector('dd')?.textContent).toBe('6h 12m')
  })

  it('keeps the delta inside the pair rather than beside it', () => {
    /* A second `dd` for the same term - that is what the spec allows several
     * for. Put the delta in a `div` and the list's pairing ends at the value,
     * so the movement is announced as unrelated text after the figure. */
    const { container } = render(<StatTile label="Worked" value="6h 12m" delta="+40m vs last week" />)
    const values = [...container.querySelectorAll('dd')].map((node) => node.textContent)
    expect(values).toEqual(['6h 12m', '+40m vs last week'])
    expect(container.querySelectorAll('dt')).toHaveLength(1)
  })
})

describe('the delta, which is a claim when it is empty', () => {
  it('draws nothing when there is nothing to compare against', () => {
    // A blank second line reads as "unchanged", and that is a statement about
    // the data the caller never made.
    const { container } = render(<StatTile label="People" value="14" />)
    expect(container.querySelectorAll('dd')).toHaveLength(1)
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('draws nothing for %s', (_name, delta) => {
    const { container } = render(<StatTile label="People" value="14" delta={delta} />)
    expect(container.querySelectorAll('dd')).toHaveLength(1)
  })

  it('draws a delta of zero, which is a real answer', () => {
    /* `0` is the one falsy value that means something here: the figure was
     * measured and it did not move. A `{delta && …}` guard would swallow it,
     * which is why the component tests for undefined and null by name. */
    const { container } = render(<StatTile label="People" value="14" delta={0} />)
    expect(container.querySelectorAll('dd')).toHaveLength(2)
  })

  it('takes its tone from the caller, not from the sign', () => {
    // Down is the good direction for a figure like time-to-answer, so the
    // component is never the one deciding what a fall means.
    const { container } = render(
      <StatTile label="Time to answer" value="2m 10s" delta="-30s" deltaTone="good" />,
    )
    const delta = [...container.querySelectorAll('dd')].at(-1)
    expect(delta?.className).toContain('text-good')
  })
})

describe('tone classes, which is where the copies drifted', () => {
  it.each([
    ['accent', 'text-accent-2'],
    ['warn', 'text-warn'],
    ['bad', 'text-bad'],
    ['default', 'text-text'],
  ] as const)('gives %s its own class', (tone, expected) => {
    const { container } = render(<StatTile label="Worked" value="6h" tone={tone} />)
    expect(container.querySelector('dd')?.className).toContain(expected)
  })

  it('separates the classes it joins', () => {
    /* The defect in the donor: two ternaries concatenated with no space
     * between them, so a figure that was both accented and warning emitted
     * `text-accent-2text-warn` and was styled by neither. It never showed
     * because the two flags were never passed together - which is exactly the
     * kind of defect that waits for the day they are. */
    const { container } = render(<StatTile label="Silent" value="3" tone="warn" size="lg" />)
    const className = container.querySelector('dd')!.className
    expect(className).toContain('text-warn')
    expect(className).toContain('text-2xl')
    expect(className).not.toMatch(/\S(?:text-warn|text-2xl)/)
  })
})

describe('the row', () => {
  it('lines the figures up on one baseline', () => {
    /* Without this a tile carrying a delta is taller than its neighbours, and
     * the numbers in the row stop sharing a line. */
    const { container } = render(
      <StatRow>
        <StatTile label="Worked" value="32h" delta="+2h" />
        <StatTile label="People" value="14" />
      </StatRow>,
    )
    expect(container.firstElementChild?.className).toContain('items-baseline')
  })

  it('wraps rather than dropping a tile off the end', () => {
    // The number of figures is decided at runtime - a donor hides two of its
    // five until there is something to say - so the row cannot be a fixed grid.
    const { container } = render(
      <StatRow>
        <StatTile label="Worked" value="32h" />
      </StatRow>,
    )
    expect(container.firstElementChild?.className).toContain('flex-wrap')
  })
})

describe('the figures themselves', () => {
  it('sets the value in tabular figures, so a live number does not shuffle the row', () => {
    const { container } = render(<StatTile label="Working now" value="7" />)
    expect(container.querySelector('dd')?.className).toContain('tabular-nums')
  })

  it('renders a node as readily as a string', () => {
    // Half the real values are a Badge or a RelativeTime rather than text.
    render(<StatTile label="Last seen" value={<span data-testid="node">just now</span>} />)
    expect(screen.getByTestId('node')).toBeTruthy()
  })
})

describe('accessibility', () => {
  it('passes axe in every tone, with and without a delta', async () => {
    await expectNoA11yViolations(
      <StatRow>
        <StatTile label="Worked" value="32h 10m" tone="accent" delta="+2h vs last week" deltaTone="good" />
        <StatTile label="Paused" value="3h 04m" />
        <StatTile label="Silent" value="3" tone="warn" delta="1 more than yesterday" deltaTone="bad" />
        <StatTile label="Failed" value="0" tone="bad" size="lg" />
      </StatRow>,
    )
  })
})
