# SchemaFields

Source: https://lacodda.github.io/dowel/components/schema-fields

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#schema-fields

A workspace's settings drawn from its schema, the value as the product receives it, and the same form after a refused save.

## Notes

**The data is already described once.** Settings, a profile, a config file: a
zod schema or a Rust struct says what the fields are, what is required and what
range a number keeps to. A form written by hand beside it is a second
description, and the two drift - a field added to the struct that nobody can
edit, a range the form allows and the server refuses. `SchemaFields` draws the
form from the first description.

**The schema is the adapter.** Both writers already speak JSON Schema, so
there is nothing to install for either:

```tsx
import { z } from 'zod'
import { SchemaFields } from '@/components/ui/schema-fields'

const Workspace = z.object({
  name: z.string().min(2).meta({ title: 'Workspace name' }),
  port: z.number().int().min(1).max(65535).default(8443).meta({ title: 'Port' }),
  theme: z.enum(['system', 'light', 'dark']).meta({ title: 'Theme', 'x-control': 'segmented' }),
  letter: z.boolean().default(true).meta({ title: 'Weekly letter' }),
})
const schema = z.toJSONSchema(Workspace)

<SchemaFields schema={schema} value={value} onValueChange={setValue} words={words} />
```

A Rust struct reaches the same place through `schemars` - `schema_for!(Config)`
sent to the screen as JSON. `$ref` into `$defs`, `Option<T>` written either way
schemars writes it, and a documented enum as a union of `const`s are all read.

**What is drawn as what.** The type of the value picks the control; `x-control`
in the schema picks between the drawings one type has.

| The schema says | Drawn as |
| --- | --- |
| `type: string` | an [Input](/dowel/components/input/) |
| `format: email`, `format: uri` | an Input of that type |
| `format: date` | a [DatePicker](/dowel/components/date-picker/) |
| `writeOnly: true` or `format: password` | a [PasswordField](/dowel/components/password-field/) |
| `x-control: multiline` | a [Textarea](/dowel/components/textarea/) |
| `type: number`, `type: integer` | a [NumberField](/dowel/components/number-field/), stepping by `multipleOf` |
| `type: boolean` | a [Switch](/dowel/components/switch/) beside its name |
| `enum`, or a union of `const`s with titles | a [Select](/dowel/components/select/) |
| ...with `x-control: segmented` or `radio` | a [SegmentedControl](/dowel/components/segmented-control/) or a [RadioGroup](/dowel/components/radio-group/) |
| an array of answers | a column of [Checkboxes](/dowel/components/checkbox/) |
| an array of plain strings | a [TagInput](/dowel/components/tag-input/) |
| `type: object` | a [FieldGroup](/dowel/components/field/) of its own fields |
| `const` | nothing - a value nobody chooses; `defaultsOf` writes it |

The label is the `title`, else the property's own name; the hint is the
`description`. Every field is a `Field` or a `FieldGroup`, so the label, the
hint and the error are wired the one way the set wires them.

**Refused by name, never left out.** A list of records, a map, a union of
objects, `not`, `if` - a keyword this cannot draw throws a `SchemaError` naming
the field when the schema is read. A form that silently leaves a field out is
a form the data can no longer be edited through, and nobody notices until the
value is wrong. Draw such a field yourself with `custom`, or change the schema:

```tsx
<SchemaFields
  schema={schema}
  custom={{
    stops: ({ field, value, onValueChange, error }) => (
      <StopsEditor label={field.label} value={value} onChange={onValueChange} error={error} />
    ),
  }}
  ...
/>
```

**An empty box writes nothing.** The key is removed, or set to `null` where the
schema allows `null`. An optional field left empty is absent rather than an
empty string that fails its own `minLength` - which is what a hand-written form
does on its first day.

**A problem is said once its field is left**, not on the first keystroke and
not before anyone has touched the form. After a save that was refused, `reveal`
says every problem at once. A number out of range is said, not quietly moved
to the bound.

**Problems from elsewhere go over the schema's own.** A name that is taken, a
zod `refine` the schema cannot state, a server that said no - pass them by key
in `errors`, and they are said at once:

```tsx
<SchemaFields errors={{ name: 'A workspace by that name exists.', 'server.port': 'Busy.' }} ... />
```

**Ask before saving.** The check is a function, so the Save button can use it:

```tsx
import { readSchema } from '@/components/ui/schema-shape'
import { checkValue } from '@/components/ui/schema-check'

const fields = useMemo(() => readSchema(schema), [schema])
const problems = checkValue(fields, value)

<Button disabled={problems.length > 0}>Save</Button>
```

Put `noValidate` on the `<form>` around it: the browser's own bubbles would
say the same things a second time, in the browser's language.

**No words of its own.** What a problem is called is `words.issue`, given the
issue's code and limit - in the product's language, through its own
translations:

```tsx
const words: SchemaFieldsWords = {
  issue: (issue) => {
    switch (issue.code) {
      case 'required': return t('form.required')
      case 'minimum': return t('form.atLeast', { n: issue.limit })
      // ...
    }
  },
  none: t('form.none'),
  choose: t('form.choose'),
  pickDate: t('form.pickDate'),
  previousMonth: t('calendar.previous'),
  nextMonth: t('calendar.next'),
  clearDate: t('calendar.clear'),
  showSecret: t('form.show'),
  hideSecret: t('form.hide'),
  removeTag: (tag) => t('form.removeTag', { tag }),
}
```

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `schema` | `JsonSchema` | | Required. An object schema; its properties are the fields, in the order written |
| `value` | `Record<string, unknown>` | | Required. The record |
| `onValueChange` | `(value) => void` | | Required. Told the next record - a copy, never the same object changed |
| `words` | `SchemaFieldsWords` | | Required. Every word the fields show |
| `errors` | `Record<string, ReactNode>` | | Problems from elsewhere, by key (`server.port`) |
| `reveal` | `boolean` | `false` | Say every problem now, after a refused save |
| `custom` | `Record<string, (props) => ReactNode>` | | Fields the product draws itself, by key |
| `disabled` | `boolean` | `false` | Every field at once, while it saves |
| `className` | `string` | | On the column the fields stand in |

### Words

| Word | |
| --- | --- |
| `issue(issue, field)` | What is wrong with one field: `issue.code` is the rule, `limit` and `format` what it asked for |
| `none` | The answer that takes an optional choice back |
| `choose` | What a required choice says before anything is chosen |
| `pickDate`, `previousMonth`, `nextMonth` | The date picker's face and its two month buttons |
| `clearDate` | The button that takes back a date in an optional field |
| `showSecret`, `hideSecret` | The reveal button of a secret |
| `removeTag(tag)` | The cross on one tag |
