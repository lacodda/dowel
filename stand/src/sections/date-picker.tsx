import { useState } from 'react'
import { Row } from '../row'
import { DatePicker } from '../../../registry/ui/date-picker'
import { Field } from '../../../registry/ui/field'

export function DatePickerSection() {
  const [date, setDate] = useState<string | undefined>('2026-09-14')
  const [empty, setEmpty] = useState<string | undefined>(undefined)

  return (
    <>
      <Row label="chosen - and taken back from under the month, for an optional field - and empty">
        <div className="w-56">
          <DatePicker
            value={date}
            onValueChange={setDate}
            clearLabel="Clear"
            locale="en-GB"
            placeholder="Pick a date"
            aria-label="Release date"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
        <div className="w-56">
          <DatePicker
            value={empty}
            onValueChange={setEmpty}
            locale="en-GB"
            placeholder="Pick a date"
            aria-label="Another date"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
      </Row>

      <Row label="inside a Field, and disabled">
        <Field label="Released on" help="When it goes out." className="w-56">
          <DatePicker
            value={date}
            onValueChange={setDate}
            locale="en-GB"
            placeholder="Pick a date"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </Field>
        <div className="w-56">
          <DatePicker
            value="2026-09-14"
            disabled
            locale="en-GB"
            placeholder="Pick a date"
            aria-label="Disabled"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
      </Row>
    </>
  )
}
