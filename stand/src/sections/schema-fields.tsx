import { useMemo, useState } from 'react'
import { Button } from '../../../registry/ui/button'
import { ColorField } from '../../../registry/ui/color-field'
import { FieldGroup } from '../../../registry/ui/field'
import { SchemaFields, type SchemaFieldsWords } from '../../../registry/ui/schema-fields'
import { defaultsOf, readSchema, SchemaError, type JsonSchema } from '../../../registry/ui/schema-shape'
import { checkValue, type SchemaIssue } from '../../../registry/ui/schema-check'
import { works } from '../../../fixtures/world'
import { Row } from '../row'

/*
 * One schema for the three sections, written the way zod's `toJSONSchema()`
 * and schemars write one: what a workspace of the invented world keeps in its
 * settings.
 */
const workspace: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Workspace name', minLength: 2, maxLength: 40 },
    contact: { type: 'string', title: 'Contact', format: 'email', description: 'Where the weekly letter goes.' },
    letter: { type: 'boolean', title: 'Weekly letter', description: 'Sundays, at nine.', default: true },
    theme: { title: 'Theme', enum: ['system', 'light', 'dark'], default: 'system', 'x-control': 'segmented' },
    pace: {
      title: 'Release pace',
      oneOf: [
        { const: 'steady', title: 'Steady', description: 'One work a week.' },
        { const: 'burst', title: 'In bursts', description: 'Several at once, then a pause.' },
      ],
      'x-control': 'radio',
    },
    first: {
      title: 'Opens on',
      description: 'The work shown first.',
      oneOf: works.slice(0, 4).map((work) => ({ const: work.id, title: work.title })),
    },
    days: { title: 'Writing days', type: 'array', items: { enum: ['mon', 'tue', 'wed', 'thu', 'fri'] }, minItems: 1 },
    tags: { title: 'Tags', type: 'array', items: { type: 'string', maxLength: 16 }, maxItems: 5 },
    review: { title: 'Next review', type: 'string', format: 'date' },
    token: { title: 'Publishing key', type: 'string', writeOnly: true, minLength: 12 },
    notes: { title: 'Notes', type: 'string', 'x-control': 'multiline' },
    accent: { title: 'Accent', type: 'string', pattern: '^#[0-9a-f]{6}$' },
    server: {
      title: 'Relay',
      description: 'Where drafts are kept in step.',
      type: 'object',
      properties: {
        host: { type: 'string', title: 'Host', format: 'uri' },
        port: { type: 'integer', title: 'Port', minimum: 1, maximum: 65535, default: 8443 },
      },
      required: ['host'],
    },
  },
  required: ['name', 'contact', 'days', 'server'],
}

/** The words a product gives, in its own language - here, English. */
const words: SchemaFieldsWords = {
  issue: (issue) => say(issue),
  none: 'None',
  choose: 'Choose…',
  pickDate: 'Pick a day',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  showSecret: 'Show key',
  hideSecret: 'Hide key',
  removeTag: (tag) => `Remove ${tag}`,
}

function say(issue: SchemaIssue): string {
  switch (issue.code) {
    case 'required':
      return 'Needed.'
    case 'minLength':
      return `At least ${issue.limit} characters.`
    case 'maxLength':
      return `At most ${issue.limit} characters.`
    case 'minimum':
      return `At least ${issue.limit}.`
    case 'maximum':
      return `At most ${issue.limit}.`
    case 'minItems':
      return `Choose at least ${issue.limit}.`
    case 'maxItems':
      return `No more than ${issue.limit}.`
    case 'format':
      return issue.format === 'email' ? 'Not an address.' : 'Not in the right form.'
    case 'pattern':
      return 'Not in the right form.'
    default:
      return 'Not allowed.'
  }
}

/** The value as the product receives it - what each edit writes, keys
 * removed included. */
function Written({ value }: { value: unknown }) {
  return (
    <pre className="max-h-96 min-w-56 flex-1 overflow-auto rounded-md bg-soft p-3 font-mono text-xs text-dim">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

export function SchemaFieldsSection() {
  const fields = useMemo(() => readSchema(workspace, ['accent']), [])
  const [value, setValue] = useState<Record<string, unknown>>(() => ({
    ...defaultsOf(fields),
    name: 'Night shift',
    contact: 'ines@example.com',
  }))
  const [refused, setRefused] = useState<Record<string, unknown>>({
    name: 'N',
    contact: 'ines at example',
    days: [],
    server: { port: 70000 },
  })

  return (
    <>
      <Row label="a schema drawn as fields - each problem said once its field is left; the value as the product receives it">
        <SchemaFields
          schema={workspace}
          value={value}
          onValueChange={setValue}
          words={words}
          className="w-80"
          custom={{
            // A string the schema can only describe by its pattern; the
            // product draws it as the line's own swatches.
            accent: ({ field, value: accent, onValueChange, error }) => (
              <FieldGroup label={field.label} error={error}>
                <ColorField
                  value={typeof accent === 'string' ? accent : ''}
                  onValueChange={onValueChange}
                  aria-label={field.label}
                />
              </FieldGroup>
            ),
          }}
        />
        <Written value={value} />
      </Row>

      <Row label="after a refused save - every problem at once, and one from the server over the schema's own">
        <SchemaFields
          schema={workspace}
          value={refused}
          onValueChange={setRefused}
          words={words}
          reveal
          errors={{ name: 'A workspace by that name exists.' }}
          custom={{ accent: () => null }}
          className="w-80"
        />
        <Button variant="primary" disabled={checkValue(fields, refused).length > 0}>
          Save
        </Button>
      </Row>

      <Row label="disabled while it saves">
        <SchemaFields
          schema={{ type: 'object', properties: { name: { type: 'string', title: 'Workspace name' } } }}
          value={{ name: 'Night shift' }}
          onValueChange={() => {}}
          words={words}
          disabled
          className="w-80"
        />
      </Row>
    </>
  )
}

export function SchemaShapeSection() {
  const fields = readSchema(workspace, ['accent'])
  const rows = fields.flatMap((field) => [field, ...(field.fields ?? [])])
  let refusal = ''
  try {
    readSchema({ type: 'object', properties: { stops: { type: 'array', items: { type: 'object', properties: {} } } } })
  } catch (error) {
    refusal = error instanceof SchemaError ? error.message : String(error)
  }

  return (
    <>
      <Row label="no markup - the schema above, read as the fields it describes">
        <table className="font-mono text-xs">
          <thead>
            <tr className="text-left text-dim">
              <th className="pr-4 font-normal">key</th>
              <th className="pr-4 font-normal">control</th>
              <th className="pr-4 font-normal">label</th>
              <th className="font-normal">required</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((field) => (
              <tr key={field.key}>
                <td className="pr-4 text-dim">{field.key}</td>
                <td className="pr-4 text-accent">{field.control}</td>
                <td className="pr-4">{field.label}</td>
                <td className="text-dim">{field.required ? 'yes' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Row>

      <Row label="refused by name - a list of records is not drawn, and is not left out without a word">
        <code className="font-mono text-xs text-bad">{refusal}</code>
      </Row>

      <Row label="a new record, from the defaults">
        <Written value={defaultsOf(fields)} />
      </Row>
    </>
  )
}

export function SchemaCheckSection() {
  const fields = readSchema(workspace, ['accent'])
  const cases: [string, unknown][] = [
    ['{}', {}],
    ["{ name: 'N', days: ['mon'] }", { name: 'N', days: ['mon'] }],
    ["{ contact: 'ines at example' }", { contact: 'ines at example' }],
    ['{ server: { host: "x", port: 0 } }', { server: { host: 'x', port: 0 } }],
  ]

  return (
    <Row label="no markup - a value held to the schema, answered live in codes the product puts into words">
      <div className="flex flex-col gap-2">
        {cases.map(([call, value]) => (
          <div key={call} className="flex flex-col gap-0.5 font-mono text-xs">
            <span className="text-dim">checkValue(fields, {call})</span>
            <span className="text-accent">
              {checkValue(fields, value)
                .map((issue) => `${issue.key} ${issue.code}${'limit' in issue ? ` ${issue.limit}` : ''}`)
                .join(' · ') || 'nothing wrong'}
            </span>
          </div>
        ))}
      </div>
    </Row>
  )
}
