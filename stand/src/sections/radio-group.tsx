import { Row } from '../row'
import { Field } from '../../../registry/ui/field'
import { Radio, RadioGroup } from '../../../registry/ui/radio-group'

export function RadioGroupSection() {
  return (
    <>
      <Row label="a column, which is the default">
        <RadioGroup aria-label="Ripeness" defaultValue="ripe">
          <Radio value="green">Green</Radio>
          <Radio value="ripe">Ripe</Radio>
          <Radio value="soft">Past it</Radio>
        </RadioGroup>
      </Row>

      <Row label="a row, for two or three short options">
        <RadioGroup aria-label="Size" defaultValue="md" orientation="horizontal">
          <Radio value="sm">Small</Radio>
          <Radio value="md">Medium</Radio>
          <Radio value="lg">Large</Radio>
        </RadioGroup>
      </Row>

      <Row label="inside a Field, which names the group">
        <Field label="Ripeness" help="How you like them." className="w-64">
          <RadioGroup defaultValue="ripe">
            <Radio value="green">Green</Radio>
            <Radio value="ripe">Ripe</Radio>
          </RadioGroup>
        </Field>
      </Row>

      <Row label="disabled">
        <RadioGroup aria-label="Disabled" defaultValue="a" disabled>
          <Radio value="a">One</Radio>
          <Radio value="b">Two</Radio>
        </RadioGroup>
      </Row>
    </>
  )
}
