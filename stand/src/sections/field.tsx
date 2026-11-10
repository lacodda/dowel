import { Row } from '../row'
import { Chip, ChipGroup } from '../../../registry/ui/chip'
import { Checkbox } from '../../../registry/ui/checkbox'
import { DatePicker } from '../../../registry/ui/date-picker'
import { Field, FieldGroup } from '../../../registry/ui/field'
import { Input } from '../../../registry/ui/input'
import { NumberField } from '../../../registry/ui/number-field'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '../../../registry/ui/select'
import { Segment, SegmentedControl } from '../../../registry/ui/segmented-control'
import { Switch } from '../../../registry/ui/switch'
import { Textarea } from '../../../registry/ui/textarea'

export function FieldSection() {
  return (
    <>
      <Row label="with a hint">
        <Field label="Email" help="We only use it to sign you in." className="w-64">
          <Input type="email" placeholder="you@example.com" />
        </Field>
      </Row>

      <Row label="with an error - the hint gives up its line">
        <Field
          label="Email"
          help="We only use it to sign you in."
          error="That address is not valid."
          className="w-64"
        >
          <Input type="email" defaultValue="not-an-address" />
        </Field>
      </Row>

      <Row label="required, and a label only a screen reader hears">
        <Field label="Name" required className="w-64">
          <Input placeholder="Ada Lovelace" />
        </Field>
        <Field label="Search" labelHidden className="w-64">
          <Input type="search" placeholder="Search" />
        </Field>
      </Row>

      <Row label="around anything, not only an Input">
        <Field label="Notes" help="Grows as you type." className="w-64">
          <Textarea autoResize maxRows={5} placeholder="Say what happened" />
        </Field>
      </Row>

      <Row label="around the controls that are not a plain box - each named by the caption">
        <Field label="Port" help="Where the relay listens." className="w-40">
          <NumberField defaultValue={8443} />
        </Field>
        <Field label="Opens on" className="w-48">
          <Select defaultValue="Harbour lights" items={['Harbour lights', 'Paper boats'].map((title) => ({ value: title, label: title }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="Harbour lights">Harbour lights</SelectItem>
              <SelectItem value="Paper boats">Paper boats</SelectItem>
            </SelectPopup>
          </Select>
        </Field>
        <Field label="Next review" className="w-56">
          <DatePicker value="2026-09-14" placeholder="Pick a day" previousMonthLabel="Previous month" nextMonthLabel="Next month" locale="en-GB" />
        </Field>
      </Row>

      <Row label="beside its name - a Switch or a Checkbox, and a press on the words flips it">
        <Field label="Weekly letter" help="Sundays, at nine." beside className="w-56">
          <Switch defaultChecked />
        </Field>
        <Field label="Archived" beside className="w-40">
          <Checkbox />
        </Field>
      </Row>

      <Row label="a FieldGroup around a row of chips - a fieldset names the group, a label cannot">
        <FieldGroup label="Type" className="w-64">
          <ChipGroup aria-label="Type" defaultValue={['song']}>
            <Chip value="song">Song</Chip>
            <Chip value="clip">Clip</Chip>
            <Chip value="short">Short</Chip>
          </ChipGroup>
        </FieldGroup>
      </Row>

      <Row label="a FieldGroup around a segmented control">
        <FieldGroup label="Theme" help="Applies to this device only." className="w-64">
          <SegmentedControl aria-label="Theme" defaultValue="system">
            <Segment value="light">Light</Segment>
            <Segment value="dark">Dark</Segment>
            <Segment value="system">System</Segment>
          </SegmentedControl>
        </FieldGroup>
      </Row>

      <Row label="a FieldGroup with an error">
        <FieldGroup label="Delivery" error="Choose at least one." className="w-64">
          <ChipGroup aria-label="Delivery" multiple value={[]}>
            <Chip value="email">Email</Chip>
            <Chip value="sms">SMS</Chip>
          </ChipGroup>
        </FieldGroup>
      </Row>
    </>
  )
}
