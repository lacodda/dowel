import { useState } from 'react'
import { Row } from '../row'
import { DateRangePicker, type DateRange } from '../../../registry/ui/date-range-picker'
import { Field } from '../../../registry/ui/field'

export function DateRangePickerSection() {
  const [period, setPeriod] = useState<DateRange>({ start: '2026-09-08', end: '2026-09-19' })
  const [half, setHalf] = useState<DateRange>({ start: '2026-09-08' })

  return (
    <>
      <Row label="whole, and half made - the middle of the interaction is a state; the first can be taken back">
        <div className="w-64">
          <DateRangePicker
            value={period}
            onValueChange={setPeriod}
            clearLabel="Clear"
            locale="en-GB"
            placeholder="Pick a range"
            aria-label="Period"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
        <div className="w-64">
          <DateRangePicker
            value={half}
            onValueChange={setHalf}
            locale="en-GB"
            placeholder="Pick a range"
            aria-label="Half made"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
      </Row>

      <Row label="empty, and inside a Field">
        <div className="w-64">
          <DateRangePicker
            value={{}}
            onValueChange={() => {}}
            locale="en-GB"
            placeholder="Pick a range"
            aria-label="Empty"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
        <Field label="Reporting period" className="w-64">
          <DateRangePicker
            value={period}
            onValueChange={setPeriod}
            locale="en-GB"
            placeholder="Pick a range"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </Field>
      </Row>
    </>
  )
}
