// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Timeline, TimelineItem } from './timeline'
import { expectNoA11yViolations } from '../../tests/a11y'

function history() {
  return (
    <Timeline>
      <TimelineItem title="Opened" time="3 days ago" status="neutral" />
      <TimelineItem title="Built" time="2 days ago" status="good" statusLabel="Succeeded" />
      <TimelineItem title="Deployed" time="an hour ago" status="bad" statusLabel="Failed" last />
    </Timeline>
  )
}

describe('Timeline', () => {
  it('is a list, and says how many entries there are', () => {
    // A stack of divs is announced as nothing; a list tells a reader how far
    // through a history they are, which is its whole navigational value.
    render(history())
    expect(screen.getByRole('list')).toBeDefined()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('does not run the rail past the last entry', () => {
    // A border on the container ends below the last dot, so the history
    // trails off into a line going nowhere - and a finished list cannot be
    // told from one still loading.
    const { container } = render(history())
    const rails = [...container.querySelectorAll('li')].map(
      (item) => item.querySelectorAll('.w-px').length,
    )
    expect(rails).toEqual([1, 1, 0])
  })

  it('drops the space under the last entry too', () => {
    const { container } = render(history())
    const spaced = [...container.querySelectorAll('li > div:last-child')].map((body) =>
      body.className.includes('pb-4'),
    )
    expect(spaced).toEqual([true, true, false])
  })

  it('runs the rail the whole height of the entry, gap included', () => {
    // The defect a live run found and this file did not: the rail reached the
    // bottom of the marker's column, the column stopped above the entry's
    // padding, and every rail ended 18-22px short of the next marker. Counting
    // rails said nothing about it - the question is where they reach.
    //
    // jsdom lays nothing out, so what is asserted is the arrangement that
    // makes the reach right: the column stretches to the entry's full height,
    // and the space between entries is on the text rather than on the item
    // that holds both.
    const { container } = render(history())
    for (const item of container.querySelectorAll('li')) {
      expect(item.className).not.toContain('pb-4')

      const column = item.firstElementChild
      expect(column?.className).toContain('self-stretch')

      const rail = column?.querySelector('.w-px')
      if (rail) expect(rail.className).toContain('flex-1')
    }
  })

  it('names the state for a reader who does not see the colour', () => {
    // A red dot for a failed step is invisible to the reader it matters most
    // to.
    render(history())
    expect(screen.getByRole('img', { name: 'Failed' })).toBeDefined()
    expect(screen.getByRole('img', { name: 'Succeeded' })).toBeDefined()
  })

  it('leaves an unnamed marker out of the tree', () => {
    // A dot that means nothing beyond "here is an entry" is decoration, and
    // announcing it would be noise on top of the title beside it.
    const { container } = render(
      <Timeline>
        <TimelineItem title="Opened" last />
      </Timeline>,
    )
    expect(screen.queryAllByRole('img')).toHaveLength(0)
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('shows what happened, when, and the detail under it', () => {
    render(
      <Timeline>
        <TimelineItem title="Deployed" time="an hour ago" last>
          Rolled back after the health check
        </TimelineItem>
      </Timeline>,
    )
    expect(screen.getByText('Deployed')).toBeDefined()
    expect(screen.getByText('an hour ago')).toBeDefined()
    expect(screen.getByText('Rolled back after the health check')).toBeDefined()
  })

  it('draws a step not taken yet as an empty ring', () => {
    const { container } = render(
      <Timeline>
        <TimelineItem title="Publish" pending last />
      </Timeline>,
    )
    const marker = container.querySelector('li > div > span')
    expect(marker?.className).toContain('border-line-2')
    expect(marker?.className).toContain('bg-bg')
  })

  it('makes room for a glyph and keeps a bare dot small', () => {
    const { container: withIcon } = render(
      <Timeline>
        <TimelineItem title="Built" icon={<svg data-testid="tick" />} last />
      </Timeline>,
    )
    expect(withIcon.querySelector('li > div > span')?.className).toContain('size-5')

    const { container: bare } = render(
      <Timeline>
        <TimelineItem title="Built" last />
      </Timeline>,
    )
    expect(bare.querySelector('li > div > span')?.className).toContain('size-2.5')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(history())
    const className = [...container.querySelectorAll('*')]
      .map((node) => node.className)
      .filter((name): name is string => typeof name === 'string')
      .join(' ')
    expect(className).not.toMatch(/\bdark:/)
    expect(className).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(<Timeline className="gap-4">{null}</Timeline>)
    expect(container.firstElementChild?.className).toContain('gap-4')
  })

  it('passes the accessibility gate', async () => {
    await expectNoA11yViolations(history())
  })
})
