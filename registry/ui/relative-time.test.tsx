// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RelativeTime, formatRelative, relativeParts } from './relative-time'

/*
 * RelativeTime.
 *
 * `now` is passed in every test rather than read from the clock. A test that
 * says "3 minutes ago" against `Date.now()` passes until the machine is slow
 * enough to cross a boundary between the two calls, and then fails once a
 * fortnight for reasons nobody can reproduce.
 */

const now = new Date('2026-09-09T12:00:00Z')
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000)

describe('which unit it chooses', () => {
  it('walks up the units as the interval grows', () => {
    expect(relativeParts(ago(30), now)).toEqual([-30, 'second'])
    expect(relativeParts(ago(60 * 5), now)).toEqual([-5, 'minute'])
    expect(relativeParts(ago(60 * 60 * 3), now)).toEqual([-3, 'hour'])
    expect(relativeParts(ago(60 * 60 * 24 * 2), now)).toEqual([-2, 'day'])
    expect(relativeParts(ago(60 * 60 * 24 * 21), now)).toEqual([-3, 'week'])
    expect(relativeParts(ago(60 * 60 * 24 * 90), now)).toEqual([-3, 'month'])
    expect(relativeParts(ago(60 * 60 * 24 * 400), now)).toEqual([-1, 'year'])
  })

  it('rounds towards zero, never claiming more time has passed', () => {
    // Rounding to nearest is the tempting alternative and says "in 1 hour"
    // 31 minutes before the meeting.
    expect(relativeParts(ago(60 * 119), now)).toEqual([-1, 'hour'])
    expect(relativeParts(new Date(now.getTime() + 60 * 59 * 1000), now)).toEqual([59, 'minute'])
  })

  it('says now rather than reaching for the smallest unit', () => {
    expect(relativeParts(now, now)).toEqual([0, 'second'])
    expect(formatRelative(now, 'en-US', now)).toBe('now')
  })

  it('handles the future as well as the past', () => {
    expect(formatRelative(new Date(now.getTime() + 60 * 60 * 3 * 1000), 'en-US', now)).toBe(
      'in 3 hours',
    )
  })
})

describe('the phrase', () => {
  it('is written in the reader’s language', () => {
    // The whole reason there is no date library here: the plural rules and
    // the special words are what a hand-written version gets wrong, and it
    // gets them wrong only in the languages its author does not read.
    expect(formatRelative(ago(60 * 60 * 24), 'en-US', now)).toBe('yesterday')
    expect(formatRelative(ago(60 * 60 * 24), 'de-DE', now)).toBe('gestern')
  })

  it('can be made to read the same way in every row', () => {
    render(<RelativeTime value={ago(60 * 60 * 24)} now={now} locale="en-US" numeric="always" />)
    expect(screen.getByText('1 day ago')).toBeDefined()
  })
})

describe('the fact underneath', () => {
  it('keeps the exact moment where a machine can read it', () => {
    // The rule the component exists for: a relative phrase is a convenience,
    // never the only copy of the fact.
    const { container } = render(<RelativeTime value={ago(60 * 60 * 24 * 30)} now={now} locale="en-US" />)
    const time = container.querySelector('time')
    expect(time?.getAttribute('datetime')).toBe(ago(60 * 60 * 24 * 30).toISOString())
  })

  it('shows the real date on hover', () => {
    const { container } = render(<RelativeTime value={ago(60 * 60 * 24 * 30)} now={now} locale="en-US" />)
    const title = container.querySelector('time')?.getAttribute('title') ?? ''
    // "last month" is useless the moment the reader needs to say when, and
    // they cannot get it back if the page threw it away.
    expect(title).toContain('2026')
    expect(title).toContain('Aug')
  })

  it('accepts whatever the data already holds', () => {
    const iso = render(<RelativeTime value={ago(3600).toISOString()} now={now} locale="en-US" />)
    expect(screen.getByText('1 hour ago')).toBeDefined()
    iso.unmount()

    const epoch = render(<RelativeTime value={ago(3600).getTime()} now={now} locale="en-US" />)
    expect(screen.getByText('1 hour ago')).toBeDefined()
    epoch.unmount()
  })

  it('renders nothing at all for a date that is not one', () => {
    // "Invalid Date" is a string no reader can act on and which looks like a
    // value. An empty `<time>` with no `dateTime` says the same to a machine.
    const { container } = render(<RelativeTime value="not a date" now={now} locale="en-US" />)
    const time = container.querySelector('time')
    expect(time?.textContent).toBe('')
    expect(time?.hasAttribute('datetime')).toBe(false)
    expect(time?.hasAttribute('title')).toBe(false)
  })

  it('does not start a timer of its own', () => {
    // A component that re-renders every second to keep "2 minutes ago" honest
    // costs a timer per instance - a table of fifty rows is fifty timers - to
    // correct a number nobody is watching change. The `now` prop is how a
    // product that does need it re-renders on its own schedule.
    vi.useFakeTimers()
    try {
      const { unmount } = render(<RelativeTime value={ago(30)} now={now} locale="en-US" />)
      expect(vi.getTimerCount()).toBe(0)
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })
})
