import { useState } from 'react'
import { Row } from '../row'
import { Field } from '../../../registry/ui/field'
import { TimeField } from '../../../registry/ui/time-field'

export function TimeFieldSection() {
  const [start, setStart] = useState<string | null>('09:30')
  const [empty, setEmpty] = useState<string | null>(null)

  return (
    <>
      <Row label="type 930, or 9.30, or 9:30 pm - all of them are read">
        <div className="w-32">
          <TimeField value={start} onValueChange={setStart} locale="en-GB" aria-label="Starts at" />
        </div>
        <span className="text-xs tabular-nums text-dim">{start ?? 'null'}</span>
      </Row>

      <Row label="empty, which is not midnight">
        <div className="w-32">
          <TimeField
            value={empty}
            onValueChange={setEmpty}
            locale="en-GB"
            placeholder="09:30"
            aria-label="Unset"
          />
        </div>
        <span className="text-xs tabular-nums text-dim">{empty ?? 'null'}</span>
      </Row>

      <Row label="inside a Field">
        <Field label="Starts at" help="Local time." className="w-40">
          <TimeField value={start} onValueChange={setStart} locale="en-GB" />
        </Field>
      </Row>
    </>
  )
}
