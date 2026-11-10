import { useState } from 'react'
import { Row } from '../row'
import { DurationField } from '../../../registry/ui/duration-field'
import { Field } from '../../../registry/ui/field'

export function DurationFieldSection() {
  const [estimate, setEstimate] = useState<number | null>(90)
  const [empty, setEmpty] = useState<number | null>(null)

  return (
    <>
      <Row label="type 90, or 1.5h, or 1:30 - all of them mean the same">
        <div className="w-40">
          <DurationField value={estimate} onValueChange={setEstimate} aria-label="Estimate" />
        </div>
        <span className="text-xs tabular-nums text-dim">
          {estimate === null ? 'null' : `${estimate} min`}
        </span>
      </Row>

      <Row label="empty, which is not zero">
        <div className="w-40">
          <DurationField
            value={empty}
            onValueChange={setEmpty}
            placeholder="1h 30m"
            aria-label="Unset"
          />
        </div>
        <span className="text-xs tabular-nums text-dim">
          {empty === null ? 'null' : `${empty} min`}
        </span>
      </Row>

      <Row label="inside a Field">
        <Field label="Estimate" help="How long you think it takes." className="w-56">
          <DurationField value={estimate} onValueChange={setEstimate} placeholder="1h 30m" />
        </Field>
      </Row>
    </>
  )
}
