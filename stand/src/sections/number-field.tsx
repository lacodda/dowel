import { useState } from 'react'
import { Row } from '../row'
import { NumberField } from '../../../registry/ui/number-field'

export function NumberFieldSection() {
  const [width, setWidth] = useState<number | null>(16)
  const [price, setPrice] = useState<number | null>(1234.5)

  return (
    <>
      <Row label="with a stepper, and with a unit beside it">
        <NumberField value={width} onValueChange={setWidth} min={0} aria-label="Width" />
        <NumberField
          value={width}
          onValueChange={setWidth}
          min={0}
          unit="px"
          aria-label="Width in pixels"
        />
      </Row>

      <Row label="without the stepper, for a wide range">
        <NumberField value={price} onValueChange={setPrice} hideStepper aria-label="Amount" />
      </Row>

      <Row label="formatted - the number reads the way it is written">
        <NumberField
          value={price}
          onValueChange={setPrice}
          format={{ style: 'currency', currency: 'EUR' }}
          hideStepper
          aria-label="Price"
        />
      </Row>

      <Row label="disabled">
        <NumberField value={16} disabled aria-label="Disabled" />
      </Row>
    </>
  )
}
