import { useState, type PointerEvent } from 'react'
import { BigCalendar, dayOf } from '../../../registry/ui/big-calendar'
import { BigCalendarItem } from '../../../registry/ui/big-calendar-item'
import { Button } from '../../../registry/ui/button'
import { addMonths, parts } from '../../../registry/ui/calendar-math'
import { Row } from '../row'

interface Release {
  id: string
  title: string
  date: string
  /** Which of the series colours its work wears. */
  series: number
  tentative?: boolean
  done?: boolean
}

/* A month of a small label's releases. Every work keeps one colour on every
 * day it goes out, which is what makes a busy week readable at all. */
const september: Release[] = [
  { id: 'r1', title: 'Tide tables - teaser', date: '2026-08-31', series: 3, done: true },
  { id: 'r2', title: 'Harbour lights', date: '2026-09-02', series: 1, done: true },
  { id: 'r3', title: 'Harbour lights - short', date: '2026-09-04', series: 1, done: true },
  { id: 'r4', title: 'Nine of cups', date: '2026-09-09', series: 2 },
  { id: 'r5', title: 'Tide tables', date: '2026-09-11', series: 3 },
  { id: 'r6', title: 'Harbour lights - live', date: '2026-09-11', series: 1 },
  { id: 'r7', title: 'Nine of cups - clip', date: '2026-09-14', series: 2 },
  { id: 'r8', title: 'Nine of cups - short', date: '2026-09-14', series: 2 },
  { id: 'r9', title: 'Tide tables - EP', date: '2026-09-14', series: 3 },
  { id: 'r10', title: 'Low water', date: '2026-09-14', series: 4 },
  { id: 'r11', title: 'Harbour lights - remix', date: '2026-09-14', series: 1 },
  { id: 'r12', title: 'Low water - short', date: '2026-09-18', series: 4, tentative: true },
  { id: 'r13', title: 'Salt road', date: '2026-09-23', series: 6 },
  { id: 'r14', title: 'Salt road - clip', date: '2026-09-25', series: 6, tentative: true },
  { id: 'r15', title: 'Low water - live', date: '2026-09-30', series: 4 },
  { id: 'r16', title: 'Salt road - short', date: '2026-10-02', series: 6 },
]

const heading = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })

function Chevron({ back }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path
        d={back ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BigCalendarSection() {
  const [month, setMonth] = useState('2026-09-01')
  const [releases, setReleases] = useState(september)
  // The release picked up, and the day under the pointer while it is carried.
  const [carried, setCarried] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)

  const on = (date: string) => releases.filter((release) => release.date === date)
  const carriedTitle = releases.find((release) => release.id === carried)?.title

  const putDown = (date: string) => {
    if (carried === null) return
    setReleases((all) => all.map((release) => (release.id === carried ? { ...release, date } : release)))
    setCarried(null)
    setOver(null)
  }

  const hint = () => {
    if (over === null) return undefined
    const there = on(over).filter((release) => release.id !== carried).length
    return there === 0 ? 'Nothing else that day' : `Beside ${there} more`
  }

  return (
    <>
      <Row label="a month in a box of its own height - a busy day folds into a count; press a release to pick it up, then a day to put it down">
        <div className="flex h-120 w-full flex-col gap-2">
          {/* The product's head, not the calendar's: the month's name and the
            * arrows live with the screen's other controls. */}
          <div className="flex items-center gap-1">
            <Button variant="icon" size="icon-sm" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
              <Chevron back />
            </Button>
            <Button variant="icon" size="icon-sm" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
              <Chevron />
            </Button>
            <span className="ml-1 text-sm font-semibold text-text">
              {heading.format(new Date(parts(month).year, parts(month).month - 1, 1))}
            </span>
            <span className="ml-auto text-xs text-dim">
              {carriedTitle === undefined ? 'Nothing picked up' : `Carrying ${carriedTitle}`}
            </span>
          </div>

          <BigCalendar
            className="flex-1"
            month={month}
            onMonthChange={setMonth}
            locale="en-GB"
            moreLabel={(count) => `${count} more`}
            fewerLabel="Show fewer"
            onAddDay={(date) =>
              setReleases((all) => [
                ...all,
                { id: `new-${all.length}`, title: 'New release', date, series: 5, tentative: true },
              ])
            }
            addDayLabel="Add a release on this day"
            onDaySelect={carried === null ? undefined : putDown}
            dropTarget={carried === null ? null : over}
            dropHint={hint()}
            // One handler on the month rather than one per day: the day is
            // read back from whatever the pointer is over.
            onPointerOver={(event: PointerEvent) => carried !== null && setOver(dayOf(event.target))}
            onPointerLeave={() => setOver(null)}
            renderDay={(date) =>
              on(date).map((release) => (
                <BigCalendarItem
                  key={release.id}
                  color={`var(--series-${release.series})`}
                  tentative={release.tentative}
                  done={release.done}
                  title={release.title}
                  className={carried === release.id ? 'opacity-30' : undefined}
                  onClick={() => setCarried(carried === release.id ? null : release.id)}
                >
                  {release.title}
                </BigCalendarItem>
              ))
            }
          />
        </div>
      </Row>
    </>
  )
}

function Glyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path d="M5 3.5v9l7-4.5z" fill="currentColor" />
    </svg>
  )
}

export function BigCalendarItemSection() {
  return (
    <>
      <Row label="neutral, then in the colours of four works - the ink leans to the theme's text, so it reads on both">
        <div className="flex w-48 flex-col gap-1">
          <BigCalendarItem onClick={() => {}}>Without a colour</BigCalendarItem>
          {[1, 2, 3, 4].map((series) => (
            <BigCalendarItem key={series} color={`var(--series-${series})`} onClick={() => {}} end={<Glyph />}>
              {`Series ${series}`}
            </BigCalendarItem>
          ))}
        </div>
      </Row>

      <Row label="a plan is an outline; what has happened is quieter; a long title truncates on its one line">
        <div className="flex w-48 flex-col gap-1">
          <BigCalendarItem tentative color="var(--series-2)">
            Planned, not booked
          </BigCalendarItem>
          <BigCalendarItem tentative>Planned, no colour</BigCalendarItem>
          <BigCalendarItem done color="var(--series-3)" onClick={() => {}}>
            Already out
          </BigCalendarItem>
          <BigCalendarItem color="var(--series-1)" onClick={() => {}} end={<Glyph />}>
            A title far longer than any day of the month is wide
          </BigCalendarItem>
        </div>
      </Row>
    </>
  )
}
