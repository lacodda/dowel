import { Row } from '../row'
import { Checkbox, CheckboxGroup } from '../../../registry/ui/checkbox'

export function CheckboxSection() {
  return (
    <>
      <Row label="states">
        <Checkbox>Unchecked</Checkbox>
        <Checkbox defaultChecked>Checked</Checkbox>
        <Checkbox indeterminate>Some of them</Checkbox>
        <Checkbox disabled>Disabled</Checkbox>
        <Checkbox defaultChecked disabled>
          Both
        </Checkbox>
      </Row>

      <Row label="a group with a parent box - click it and watch the dash resolve">
        <CheckboxGroup allValues={['apple', 'pear', 'plum']} defaultValue={['apple']}>
          <Checkbox parent aria-label="All fruit">
            All fruit
          </Checkbox>
          <div className="ml-6 flex flex-col gap-2">
            <Checkbox name="apple" value="apple">
              Apple
            </Checkbox>
            <Checkbox name="pear" value="pear">
              Pear
            </Checkbox>
            <Checkbox name="plum" value="plum">
              Plum
            </Checkbox>
          </div>
        </CheckboxGroup>
      </Row>

      <Row label="without words, for a table cell">
        <Checkbox aria-label="Select row" />
        <Checkbox aria-label="Select row" defaultChecked />
      </Row>
    </>
  )
}
