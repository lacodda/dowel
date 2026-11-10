import { useState } from 'react'
import { Row } from '../row'
import { Calendar } from '../../../registry/ui/calendar'

export function CalendarSection() {
  const [day, setDay] = useState('2026-09-14')

  return (
    <>
      <Row label="a month - arrows move a cursor, Enter chooses">
        <Calendar
          value={day}
          onValueChange={setDay}
          locale="en-GB"
          aria-label="A day"
          previousMonthLabel="Previous month"
          nextMonthLabel="Next month"
        />
      </Row>

      <Row label="bounded - the days outside cannot be chosen">
        <Calendar
          value="2026-09-14"
          min="2026-09-08"
          max="2026-09-20"
          locale="en-GB"
          aria-label="A bounded day"
          previousMonthLabel="Previous month"
          nextMonthLabel="Next month"
        />
      </Row>

      <Row label="a range, shaded between its ends">
        <Calendar
          value="2026-09-08"
          rangeEnd="2026-09-19"
          locale="en-GB"
          aria-label="A range"
          previousMonthLabel="Previous month"
          nextMonthLabel="Next month"
        />
      </Row>
    </>
  )
}
