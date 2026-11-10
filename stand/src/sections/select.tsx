import { useState } from 'react'
import { Row } from '../row'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '../../../registry/ui/select'
import { FRUIT } from './shared'

export function SelectSection() {
  const [one, setOne] = useState<string | null>('Pear')
  const [many, setMany] = useState<string[]>(['Apple', 'Plum'])

  return (
    <>
      <Row label="one of a short list">
        <Select value={one} onValueChange={(value) => setOne(value as string)}>
          <SelectTrigger className="w-48" aria-label="Fruit">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {FRUIT.map((fruit) => (
              <SelectItem key={fruit} value={fruit}>
                {fruit}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </Row>

      <Row label="several - the same component, one prop">
        <Select multiple value={many} onValueChange={(value) => setMany(value as string[])}>
          <SelectTrigger className="w-48" aria-label="Fruits">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {FRUIT.map((fruit) => (
              <SelectItem key={fruit} value={fruit}>
                {fruit}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </Row>
    </>
  )
}
