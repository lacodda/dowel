// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AxisBar, TierBadge, TierRuler, orderedTiers, tierAt, type Tier } from './tier'
import { expectNoA11yViolations } from '../../tests/a11y'

const tiers: Tier[] = [
  { key: 'draft', label: 'Draft', min: 0 },
  { key: 'ok', label: 'Fair', min: 50 },
  { key: 'good', label: 'Publishable', min: 78 },
  { key: 'clip', label: 'A clip', min: 90 },
]

describe('orderedTiers', () => {
  it('sorts by where the band starts', () => {
    const shuffled = [...tiers].reverse()
    expect(orderedTiers(shuffled).map((tier) => tier.key)).toEqual(['draft', 'ok', 'good', 'clip'])
  })

  it('drops a band that cannot be placed on the road', () => {
    // A band outside the range is a broken profile; the ruler stays readable
    // rather than drawing a segment off the end.
    const broken = [...tiers, { key: 'wrong', label: 'Impossible', min: 140 }]
    expect(orderedTiers(broken).map((tier) => tier.key)).not.toContain('wrong')
    expect(orderedTiers([...tiers, { key: 'nan', label: 'Bad', min: Number.NaN }])).toHaveLength(4)
  })
})

describe('tierAt', () => {
  it('answers with the highest band the value has reached', () => {
    expect(tierAt(tiers, 0)?.key).toBe('draft')
    expect(tierAt(tiers, 77.9)?.key).toBe('ok')
    expect(tierAt(tiers, 78)?.key).toBe('good')
    expect(tierAt(tiers, 100)?.key).toBe('clip')
  })

  it('has no answer below every band', () => {
    // A real state rather than a reason to clamp: a badge for a band nothing
    // is in would be inventing one.
    expect(tierAt([{ key: 'ok', label: 'Fair', min: 50 }], 10)).toBeUndefined()
  })
})

describe('TierBadge', () => {
  it('shows the band, and the score quieter behind it', () => {
    const { container } = render(<TierBadge label="Publishable" value="78.4" />)
    expect(screen.getByText('Publishable')).toBeDefined()
    expect(screen.getByText('78.4').className).toContain('opacity-70')
    expect(container.firstElementChild?.className).toContain('rounded-md')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<TierBadge label="A clip" status="good" />)
    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('bg-good-soft')
    expect(className).not.toMatch(/\bdark:/)
    expect(className).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes the accessibility gate', async () => {
    await expectNoA11yViolations(<TierBadge label="Publishable" value="78.4" />)
  })
})

describe('TierRuler', () => {
  it('draws the bands to scale', () => {
    // The whole promise of the ruler: the gap you look at is the gap you have
    // to close. Fair runs 50-78, so it is 28% of the road and starts halfway.
    const { container } = render(<TierRuler tiers={tiers} value={64} label="Score" />)
    const placed = [...container.querySelectorAll('[role="meter"] > span')].map((band) => {
      const { left, width } = (band as HTMLElement).style
      return `${left} ${width}`
    })
    // Four bands to scale, plus the marker, which has a left and no width.
    expect(placed).toEqual(['0% 50%', '50% 28%', '78% 12%', '90% 10%', '64% '])
  })

  it('puts each label over the boundary it names', () => {
    // The donor laid the labels out with `justify-between`, which spaces them
    // evenly: with bands at 0, 50, 78 and 90 the label "78" stood a fifth of
    // the bar away from the boundary it named.
    const { container } = render(<TierRuler tiers={tiers} value={64} label="Score" />)
    const placed = [...container.querySelectorAll('[aria-hidden] > span')]
      .map((label) => (label as HTMLElement).style.left)
      .filter((left) => left !== '')
    expect(placed).toEqual(['0%', '50%', '78%', '90%'])
  })

  it('keeps the end labels inside the road', () => {
    const { container } = render(<TierRuler tiers={tiers} value={64} label="Score" />)
    const shifts = [...container.querySelectorAll('[aria-hidden] > span')]
      .map((label) => (label as HTMLElement).style)
      .filter((style) => style.left !== '')
      .map((style) => style.transform)
    // The first hangs off the left edge if it is centred; the rest are centred
    // on the boundary they name.
    expect(shifts).toEqual(['none', 'translateX(-50%)', 'translateX(-50%)', 'translateX(-50%)'])
  })

  it('tells the three states of a band apart', () => {
    // Passed, standing in, still ahead. A flat wash of "reached" says only
    // that the value is not at zero.
    const { container } = render(<TierRuler tiers={tiers} value={64} label="Score" />)
    const states = [...container.querySelectorAll('[role="meter"] > span')]
      .slice(0, 4)
      .map((band) => {
        const name = band.className
        if (name.includes('bg-accent/40')) return 'passed'
        if (name.includes('bg-accent')) return 'standing'
        if (name.includes('bg-line-2')) return 'ahead'
        return 'unknown'
      })
    expect(states).toEqual(['passed', 'standing', 'ahead', 'ahead'])
  })

  it('reports the value as a measurement', () => {
    render(<TierRuler tiers={tiers} value={64} label="Score" valueText="64 of 100, fair" />)
    const meter = screen.getByRole('meter', { name: 'Score' })
    expect(meter.getAttribute('aria-valuenow')).toBe('64')
    expect(meter.getAttribute('aria-valuetext')).toBe('64 of 100, fair')
  })

  it('keeps the marker on the road when the value is off it', () => {
    const { container } = render(<TierRuler tiers={tiers} value={140} label="Score" />)
    const marker = container.querySelector('[role="meter"] > span:last-child') as HTMLElement
    expect(marker.style.left).toBe('100%')
  })

  it('draws nothing when there is no road to draw', () => {
    // One band is a bare number wearing a bar.
    const { container } = render(
      <TierRuler tiers={[{ key: 'only', label: 'Only', min: 0 }]} value={5} label="Score" />,
    )
    expect(container.firstElementChild).toBeNull()
  })

  it('passes the accessibility gate', async () => {
    await expectNoA11yViolations(<TierRuler tiers={tiers} value={64} label="Score" />)
  })
})

describe('AxisBar', () => {
  it('reads as a meter when nobody can change it', () => {
    // Not a disabled slider: nothing is disabled, the number is a fact.
    render(<AxisBar label="Melody" scale={10} value={7} />)
    const meter = screen.getByRole('meter', { name: 'Melody' })
    expect(meter.getAttribute('aria-valuenow')).toBe('7')
    expect(meter.getAttribute('tabindex')).toBeNull()
  })

  it('becomes a slider when it can be set', () => {
    render(<AxisBar label="Melody" scale={10} value={7} onChange={() => {}} />)
    const slider = screen.getByRole('slider', { name: 'Melody' })
    expect(slider.getAttribute('tabindex')).toBe('0')
  })

  it('fills up to the mark and no further', () => {
    const { container } = render(<AxisBar label="Melody" scale={10} value={3} />)
    const filled = [...container.querySelectorAll('span[aria-hidden]')].map((segment) =>
      segment.className.includes('bg-accent'),
    )
    expect(filled).toEqual([true, true, true, false, false, false, false, false, false, false])
  })

  it('steps onto the first mark from unjudged rather than through zero', async () => {
    // Zero is a verdict of its own, and arrowing into it by accident would be
    // one.
    const onChange = vi.fn()
    render(<AxisBar label="Melody" scale={10} onChange={onChange} />)
    screen.getByRole('slider').focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('steps onto the last mark going the other way', async () => {
    const onChange = vi.fn()
    render(<AxisBar label="Melody" scale={10} onChange={onChange} />)
    screen.getByRole('slider').focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenCalledWith(10)
  })

  it('goes back to unjudged, which no arrow key can reach', async () => {
    const onChange = vi.fn()
    render(<AxisBar label="Melody" scale={10} value={4} onChange={onChange} />)
    screen.getByRole('slider').focus()
    await userEvent.keyboard('{Delete}')
    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('stops at the ends', async () => {
    const onChange = vi.fn()
    render(<AxisBar label="Melody" scale={10} value={10} onChange={onChange} />)
    screen.getByRole('slider').focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith(10)
  })

  it('clears the axis when the mark already set is clicked', async () => {
    // The only way back to unjudged with a pointer.
    const onChange = vi.fn()
    const { container } = render(
      <AxisBar label="Melody" scale={10} value={4} onChange={onChange} />,
    )
    const marks = [...container.querySelectorAll('[role="slider"] > span')]
    await userEvent.click(marks[3] as Element)
    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('sets the mark that was clicked', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <AxisBar label="Melody" scale={10} value={4} onChange={onChange} />,
    )
    const marks = [...container.querySelectorAll('[role="slider"] > span')]
    await userEvent.click(marks[7] as Element)
    expect(onChange).toHaveBeenCalledWith(8)
  })

  it('puts no focusable control inside the slider', async () => {
    // The donor made each segment a `<button>` with `tabindex=-1`, which the
    // accessibility gate rejects: assistive technology can still land on a
    // focusable element inside an interactive control, `aria-hidden` or not.
    // The row owns the keyboard, so the segments only ever needed the pointer.
    const { container } = render(
      <AxisBar label="Melody" scale={10} value={4} onChange={() => {}} />,
    )
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(container.querySelectorAll('[tabindex="-1"]')).toHaveLength(0)
  })

  it('rings the mark that crosses into the next band', () => {
    const { container } = render(
      <AxisBar label="Melody" scale={10} value={4} threshold={{ mark: 8, label: 'A clip from 8' }} />,
    )
    const ringed = [...container.querySelectorAll('span[aria-hidden]')]
      .map((segment, index) => (segment.className.includes('ring-good') ? index : -1))
      .filter((index) => index >= 0)
    // The eighth mark, and only it.
    expect(ringed).toEqual([7])
  })

  it('draws no threshold the axis cannot reach', () => {
    // A line promising a band the axis cannot deliver is worse than no line.
    const { container } = render(<AxisBar label="Melody" scale={10} value={4} />)
    expect(container.querySelector('.ring-good')).toBeNull()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<AxisBar label="Melody" scale={5} value={2} />)
    const className = [...container.querySelectorAll('span')]
      .map((span) => span.className)
      .join(' ')
    expect(className).not.toMatch(/\bdark:/)
    expect(className).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes the accessibility gate', async () => {
    await expectNoA11yViolations(<AxisBar label="Melody" scale={10} value={7} />)
    await expectNoA11yViolations(
      <AxisBar label="Melody" scale={10} value={7} onChange={() => {}} />,
    )
  })
})
