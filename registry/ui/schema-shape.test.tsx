import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { defaultsOf, patternOf, readSchema, SchemaError, type JsonSchema, type SchemaField } from './schema-shape'

/*
 * Reading a schema.
 *
 * The claim the component rests on is "zod and schemars, without an adapter",
 * so both writers are read as they actually write: zod is run here, and
 * schemars' output is the document it produces for the struct beside it -
 * `$ref` into `$defs`, `Option<T>` as a type list or a union with `null`, a
 * documented enum as a union of `const`s.
 *
 * The other half is what is refused. Each refusal is a field that a lenient
 * reader would have left out without a word, so each is asked for by name.
 */

const byKey = (fields: readonly SchemaField[]) => {
  const all = new Map<string, SchemaField>()
  const walk = (list: readonly SchemaField[]) => {
    for (const field of list) {
      all.set(field.key, field)
      walk(field.fields ?? [])
    }
  }
  walk(fields)
  return all
}

describe('a schema written by zod', () => {
  const schema = z.object({
    host: z.string().min(1).meta({ title: 'Host', description: 'Where the relay listens.' }),
    port: z.number().int().min(1).max(65535).default(8080),
    mode: z.enum(['fast', 'safe']).optional(),
    contact: z.email().nullable(),
    notes: z.string().optional().meta({ 'x-control': 'multiline' }),
    token: z.string().meta({ writeOnly: true }).optional(),
    tags: z.array(z.string().max(12)).max(5),
    days: z.array(z.enum(['mon', 'tue', 'wed'])),
    since: z.iso.date().optional(),
    secure: z.boolean().default(true),
    tone: z.union([z.literal('calm').meta({ title: 'Calm' }), z.literal('loud').meta({ title: 'Loud' })]),
    server: z.object({ name: z.string(), weight: z.number().multipleOf(0.5).optional() }),
  })
  const fields = byKey(readSchema(z.toJSONSchema(schema) as JsonSchema))

  it('reads every property, in the order it was declared', () => {
    expect(readSchema(z.toJSONSchema(schema) as JsonSchema).map((field) => field.key)).toEqual([
      'host',
      'port',
      'mode',
      'contact',
      'notes',
      'token',
      'tags',
      'days',
      'since',
      'secure',
      'tone',
      'server',
    ])
  })

  it('draws each as the control its type asks for', () => {
    expect(Object.fromEntries([...fields].map(([key, field]) => [key, field.control]))).toEqual({
      host: 'text',
      port: 'integer',
      mode: 'choice',
      contact: 'email',
      notes: 'multiline',
      token: 'secret',
      tags: 'tags',
      days: 'choices',
      since: 'date',
      secure: 'boolean',
      tone: 'choice',
      server: 'group',
      'server.name': 'text',
      'server.weight': 'number',
    })
  })

  it('takes the label from the title, and the help from the description', () => {
    expect(fields.get('host')).toMatchObject({ label: 'Host', help: 'Where the relay listens.' })
    // No title: the property's own name - the data's word, not this file's.
    expect(fields.get('port')?.label).toBe('port')
  })

  it('knows which are required, and which may be empty as null', () => {
    expect(fields.get('host')?.required).toBe(true)
    expect(fields.get('mode')?.required).toBe(false)
    expect(fields.get('contact')).toMatchObject({ required: true, nullable: true })
    expect(fields.get('host')?.nullable).toBe(false)
  })

  it('keeps the rules a value is held to', () => {
    expect(fields.get('port')?.rules).toMatchObject({ minimum: 1, maximum: 65535 })
    expect(fields.get('tags')?.rules).toMatchObject({ maxItems: 5 })
    expect(fields.get('tags')?.itemRules).toMatchObject({ maxLength: 12 })
    expect(fields.get('server.weight')?.rules).toMatchObject({ multipleOf: 0.5 })
  })

  it('offers the answers of a union of literals under their titles', () => {
    expect(fields.get('tone')?.options).toEqual([
      { value: 'calm', label: 'Calm', help: undefined },
      { value: 'loud', label: 'Loud', help: undefined },
    ])
    expect(fields.get('days')?.options?.map((option) => option.value)).toEqual(['mon', 'tue', 'wed'])
  })

  it('makes a new record from the defaults', () => {
    expect(defaultsOf(readSchema(z.toJSONSchema(schema) as JsonSchema))).toEqual({
      port: 8080,
      secure: true,
      // Required, so there by construction - its own fields have no defaults.
      server: {},
    })
  })
})

/*
 * What schemars 1 writes for:
 *
 *     /// Where the relay listens.
 *     #[derive(JsonSchema)]
 *     struct Config {
 *         /// The host name
 *         host: String,
 *         port: u16,
 *         mode: Mode,
 *         token: Option<String>,
 *         server: Server,
 *         fallback: Option<Server>,
 *     }
 *     #[derive(JsonSchema)]
 *     enum Mode {
 *         /// Answers first
 *         Fast,
 *         Safe,
 *     }
 *     #[derive(JsonSchema)]
 *     struct Server { name: String }
 */
const schemars: JsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Config',
  description: 'Where the relay listens.',
  type: 'object',
  properties: {
    host: { description: 'The host name', type: 'string' },
    port: { type: 'integer', format: 'uint16', minimum: 0, maximum: 65535 },
    mode: { $ref: '#/$defs/Mode' },
    token: { type: ['string', 'null'] },
    server: { $ref: '#/$defs/Server' },
    fallback: { anyOf: [{ $ref: '#/$defs/Server' }, { type: 'null' }] },
  },
  required: ['host', 'port', 'mode', 'server'],
  $defs: {
    Mode: {
      oneOf: [
        { description: 'Answers first', type: 'string', const: 'Fast' },
        { type: 'string', const: 'Safe' },
      ],
    },
    Server: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
  },
}

describe('a schema written by schemars', () => {
  const fields = byKey(readSchema(schemars))

  it('follows `$ref` into `$defs`', () => {
    expect(fields.get('mode')?.control).toBe('choice')
    expect(fields.get('server')?.control).toBe('group')
    expect(fields.get('server.name')).toMatchObject({ control: 'text', required: true })
  })

  it('reads `Option<T>` either way it is written', () => {
    expect(fields.get('token')).toMatchObject({ control: 'text', nullable: true, required: false })
    expect(fields.get('fallback')).toMatchObject({ control: 'group', nullable: true })
    expect(fields.get('fallback.name')?.control).toBe('text')
  })

  it('offers a documented enum by its values, with the doc comment as help', () => {
    expect(fields.get('mode')?.options).toEqual([
      { value: 'Fast', label: 'Fast', help: 'Answers first' },
      { value: 'Safe', label: 'Safe', help: undefined },
    ])
  })

  it('takes no format it does not draw as a reason to refuse', () => {
    // `uint16` is schemars' own word; the range beside it is the rule.
    expect(fields.get('port')).toMatchObject({ control: 'integer', rules: { minimum: 0, maximum: 65535 } })
  })
})

describe('the other spellings it reads', () => {
  const read = (properties: Record<string, JsonSchema>, extra: Record<string, unknown> = {}) =>
    byKey(readSchema({ type: 'object', properties, ...extra }))

  it('lets keywords beside a `$ref` describe the use, over the target', () => {
    const fields = read(
      { home: { $ref: '#/definitions/Place', title: 'Home' } },
      { definitions: { Place: { type: 'string', title: 'Place' } } },
    )
    expect(fields.get('home')?.label).toBe('Home')
  })

  it('reads a lone `allOf` as the schema inside it', () => {
    const fields = read({ size: { allOf: [{ type: 'number', minimum: 1 }], description: 'How big' } })
    expect(fields.get('size')).toMatchObject({ control: 'number', help: 'How big', rules: { minimum: 1 } })
  })

  it('reads `null` among the answers as the field being allowed to be empty', () => {
    const fields = read({
      a: { enum: ['x', 'y', null] },
      b: { anyOf: [{ const: 'x' }, { const: 'y' }, { type: 'null' }] },
    })
    for (const key of ['a', 'b']) {
      expect(fields.get(key)).toMatchObject({ control: 'choice', nullable: true })
      expect(fields.get(key)?.options?.map((option) => option.value)).toEqual(['x', 'y'])
    }
  })

  it('keeps a `const` out of the form and in the new record', () => {
    const fields = readSchema({ type: 'object', properties: { kind: { const: 'relay' }, name: { type: 'string' } } })
    expect(fields[0]?.fixed).toEqual({ value: 'relay' })
    expect(defaultsOf(fields)).toEqual({ kind: 'relay' })
  })

  it('redraws by `x-control` only within the type it redraws', () => {
    const fields = read({
      bio: { type: 'string', 'x-control': 'multiline' },
      size: { enum: ['s', 'm'], 'x-control': 'segmented' },
      pace: { enum: ['slow', 'fast'], 'x-control': 'radio' },
    })
    expect(fields.get('bio')?.control).toBe('multiline')
    expect(fields.get('size')?.control).toBe('segmented')
    expect(fields.get('pace')?.control).toBe('radio')
  })

  it('copies a default rather than sharing it', () => {
    const fields = readSchema({ type: 'object', properties: { tags: { type: 'array', items: { type: 'string' }, default: ['a'] } } })
    const first = defaultsOf(fields)
    ;(first.tags as string[]).push('b')
    expect(defaultsOf(fields)).toEqual({ tags: ['a'] })
  })
})

describe('what it refuses, by name', () => {
  const refusal = (property: JsonSchema, extra: Record<string, unknown> = {}) => {
    try {
      readSchema({ type: 'object', properties: { thing: property }, ...extra })
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaError)
      return error as SchemaError
    }
    throw new Error('read without a word')
  }

  it.each([
    ['a list of records', { type: 'array', items: { type: 'object', properties: { a: { type: 'string' } } } }],
    ['a map', { type: 'object', additionalProperties: { type: 'string' } }],
    ['a map with properties beside it', { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: { type: 'number' } }],
    ['a union of records', { oneOf: [{ type: 'object', properties: { a: { type: 'string' } } }, { type: 'string' }] }],
    ['a value of no stated type', {}],
    ['a value of several types', { type: ['string', 'number'] }],
    ['an `allOf` of two', { allOf: [{ type: 'string' }, { minLength: 1 }] }],
    // Each beside a schema that would otherwise be read, so leaving the
    // keyword out is what draws the field - silently without its rule.
    ['`patternProperties` beside properties', { type: 'object', properties: { a: { type: 'string' } }, patternProperties: { '^x': { type: 'string' } } }],
    ['a tuple beside its items', { type: 'array', items: { type: 'string' }, prefixItems: [{ type: 'number' }] }],
    ['`not`', { type: 'string', not: { const: 'root' } }],
    ['`if`', { type: 'string', if: { minLength: 3 }, then: { pattern: '^a' } }],
    ['a list that may hold null', { type: 'array', items: { type: ['string', 'null'] } }],
    ['a list of dates', { type: 'array', items: { type: 'string', format: 'date' } }],
    ['a remote reference', { $ref: 'https://example.com/schema.json' }],
    ['a reference to nothing', { $ref: '#/$defs/Missing' }],
    ['`x-control` on the wrong type', { type: 'number', 'x-control': 'multiline' }],
    ['an `x-control` that does not exist', { type: 'string', 'x-control': 'wysiwyg' }],
    ['a pattern that does not compile', { type: 'string', pattern: '(' }],
    ['an answer that is an object', { enum: [{ a: 1 }] }],
  ])('%s', (_, property) => {
    expect(refusal(property as JsonSchema).key).toBe('thing')
  })

  it('a reference to itself, rather than drawing forever', () => {
    const error = refusal({ $ref: '#/$defs/Node' }, { $defs: { Node: { $ref: '#/$defs/Node' } } })
    expect(error.reason).toContain('refers to itself')
  })

  it('a root that is not an object schema', () => {
    expect(() => readSchema({ type: 'string' })).toThrow(SchemaError)
    expect(() => readSchema(true)).toThrow(SchemaError)
  })

  it('nothing the product draws itself - a refused field named in `custom` is read for its words', () => {
    const fields = readSchema(
      {
        type: 'object',
        properties: { stops: { type: 'array', title: 'Stops', items: { type: 'object', properties: {} } } },
      },
      ['stops'],
    )
    expect(fields[0]).toMatchObject({ control: 'custom', label: 'Stops' })
  })

  it('names the nested key, so the message says where', () => {
    try {
      readSchema({ type: 'object', properties: { server: { type: 'object', properties: { tags: { type: 'object' } } } } })
      throw new Error('read without a word')
    } catch (error) {
      expect((error as SchemaError).key).toBe('server.tags')
      expect((error as SchemaError).message).toContain('server.tags')
    }
  })
})

describe('patternOf', () => {
  it('reads a pattern the way ajv does, with `u`', () => {
    expect(patternOf('^\\p{L}+$').test('Привет')).toBe(true)
  })

  it('falls back to no flags for a pattern only valid without `u`', () => {
    // `\-` outside a class is an identity escape `u` forbids.
    expect(patternOf('^a\\-b$').test('a-b')).toBe(true)
  })
})
