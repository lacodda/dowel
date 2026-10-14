# schema-shape

Source: https://lacodda.github.io/dowel/components/schema-shape

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#schema-shape

A workspace schema read as its fields, a refusal by name, and a new record from the defaults.

## Notes

**Not a component.** It has no markup and renders nothing - it is the reading
[SchemaFields](/dowel/components/schema-fields/) draws from, split out so a
product can ask the same questions without drawing anything: which fields a
schema has, which are required, what a new record starts as.

**The two writers, as they write.** zod's `toJSONSchema()` and schemars are
read without an adapter: draft 2020-12 and draft 7, local `$ref` into `$defs`
or `definitions` (keywords beside a `$ref` describe the use and win over the
target's), a lone `allOf`, nullable spelt as a type list or as a union with
`null`, and a choice spelt as `enum` or as a union of `const`s whose `title`
is the answer's label.

**Strict on purpose.** Anything it cannot draw - a list of records, a map, a
union of objects, `not`, `if`, `patternProperties`, a reference to itself -
throws a `SchemaError` with the field's key. Keys passed as `custom` are read
for their label and help and never refused: the product draws them.

## The functions

| | |
| --- | --- |
| `readSchema(schema, custom?)` | the fields of an object schema, in the order its properties are written, each with its control, label, help, rules and answers |
| `defaultsOf(fields)` | a new record: every `default` (copied, never shared), every `const`, and a required group as an object |
| `patternOf(pattern)` | a schema's `pattern` as a `RegExp`, read with `u` as ajv reads it, without it for a pattern only valid that way |
| `SchemaError` | what a refusal throws: `key` is the field, `reason` what was not read |

```ts
import { defaultsOf, readSchema } from '@/components/ui/schema-shape'

const fields = readSchema(schema)
fields.map((field) => [field.key, field.control])
// [['name', 'text'], ['port', 'integer'], ['theme', 'segmented'], ['server', 'group'], ...]

defaultsOf(fields)
// { port: 8443, letter: true, server: {} }
```

`x-control` redraws a field only within its type - `multiline` for text,
`segmented` or `radio` for a choice - and anywhere else it is refused, so a
schema cannot ask for a drawing that would mean nothing.
