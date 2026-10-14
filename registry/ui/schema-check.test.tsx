import { describe, expect, it } from 'vitest'
import { readSchema, type JsonSchema } from './schema-shape'
import { checkValue, valueAt, withValue, type SchemaIssue } from './schema-check'

/*
 * Holding a value to its schema.
 *
 * Each rule is shown failing and passing at its boundary, because a rule off
 * by one - `<` for `<=` - passes every test that stays away from the edge.
 * The empty value has rules of its own, and they are the ones a form meets
 * first: an optional field left empty asks nothing, a required one says so,
 * and `null` is empty only where the schema does not allow it.
 */

const fieldsOf = (properties: Record<string, JsonSchema>, required: string[] = []) =>
  readSchema({ type: 'object', properties, required })

const codes = (issues: SchemaIssue[]) => issues.map((issue) => issue.code)

describe('an empty value', () => {
  const fields = fieldsOf(
    {
      name: { type: 'string', minLength: 3 },
      nick: { type: 'string', minLength: 3 },
      phone: { type: ['string', 'null'] },
      fax: { type: ['string', 'null'] },
    },
    ['name', 'phone'],
  )

  it('is a problem only where the field is required', () => {
    expect(checkValue(fields, { phone: '1' })).toEqual([{ key: 'name', code: 'required' }])
  })

  it('is empty whether absent or an empty string, and asks nothing else of the field', () => {
    // No `minLength` on an empty optional field: it is not there to be short.
    expect(checkValue(fields, { name: 'Ada', nick: '', phone: '1' })).toEqual([])
    expect(codes(checkValue(fields, { name: '', phone: '1' }))).toEqual(['required'])
  })

  it('is null only where the schema allows null', () => {
    expect(checkValue(fields, { name: 'Ada', phone: null, fax: null })).toEqual([])
    expect(codes(checkValue(fields, { name: null, phone: '1' }))).toEqual(['required'])
  })
})

describe('text', () => {
  const fields = fieldsOf({
    code: { type: 'string', minLength: 2, maxLength: 3, pattern: '^[a-z]+$' },
    mail: { type: 'string', format: 'email' },
    site: { type: 'string', format: 'uri' },
    day: { type: 'string', format: 'date' },
    host: { type: 'string', format: 'hostname' },
  })
  const check = (value: Record<string, unknown>) => checkValue(fields, value)

  it('holds the length at both ends, counting characters as a reader does', () => {
    expect(check({ code: 'ab' })).toEqual([])
    expect(check({ code: 'abc' })).toEqual([])
    expect(check({ code: 'a' })).toEqual([{ key: 'code', code: 'minLength', limit: 2 }])
    expect(check({ code: 'abcd' })).toEqual([{ key: 'code', code: 'maxLength', limit: 3 }])
    // Two emoji are two characters, though `length` says four.
    const emoji = fieldsOf({ mood: { type: 'string', maxLength: 2 } })
    expect(checkValue(emoji, { mood: '🙂🙂' })).toEqual([])
  })

  it('holds the pattern', () => {
    expect(check({ code: 'AB' })).toEqual([{ key: 'code', code: 'pattern', pattern: '^[a-z]+$' }])
  })

  it('knows three formats, loosely', () => {
    expect(check({ mail: 'ada@example.com', site: 'https://example.com', day: '2026-02-28' })).toEqual([])
    expect(codes(check({ mail: 'ada at example' }))).toEqual(['format'])
    expect(codes(check({ site: 'example.com' }))).toEqual(['format'])
    // A day that parses arithmetically and does not exist.
    expect(codes(check({ day: '2026-02-29' }))).toEqual(['format'])
    expect(check({ day: '2028-02-29' })).toEqual([])
  })

  it('leaves a format it does not know to the receiving end', () => {
    expect(check({ host: 'not a host name at all' })).toEqual([])
  })

  it('refuses a value of the wrong type', () => {
    expect(codes(check({ code: 42 }))).toEqual(['type'])
  })
})

describe('numbers', () => {
  const fields = fieldsOf({
    port: { type: 'integer', minimum: 1, maximum: 10 },
    share: { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 1 },
    step: { type: 'number', multipleOf: 0.1 },
  })
  const check = (value: Record<string, unknown>) => checkValue(fields, value)

  it('holds an inclusive range at both ends', () => {
    expect(check({ port: 1 })).toEqual([])
    expect(check({ port: 10 })).toEqual([])
    expect(check({ port: 0 })).toEqual([{ key: 'port', code: 'minimum', limit: 1 }])
    expect(check({ port: 11 })).toEqual([{ key: 'port', code: 'maximum', limit: 10 }])
  })

  it('holds an exclusive range at both ends', () => {
    expect(check({ share: 0.5 })).toEqual([])
    expect(check({ share: 0 })).toEqual([{ key: 'share', code: 'exclusiveMinimum', limit: 0 }])
    expect(check({ share: 1 })).toEqual([{ key: 'share', code: 'exclusiveMaximum', limit: 1 }])
  })

  it('takes a multiple as one, through floating point', () => {
    expect(check({ step: 0.3 })).toEqual([])
    expect(check({ step: 0.35 })).toEqual([{ key: 'step', code: 'multipleOf', limit: 0.1 }])
  })

  it('refuses a fraction where a whole number is asked for, and anything not a number', () => {
    expect(codes(check({ port: 2.5 }))).toEqual(['type'])
    expect(codes(check({ port: '2' }))).toEqual(['type'])
    expect(codes(check({ share: Number.NaN }))).toEqual(['type'])
  })
})

describe('choices and lists', () => {
  const fields = fieldsOf({
    size: { enum: ['s', 'm', 1] },
    days: { type: 'array', items: { enum: ['mon', 'tue'] }, minItems: 1 },
    tags: { type: 'array', items: { type: 'string', maxLength: 3 }, maxItems: 2, uniqueItems: true },
    on: { type: 'boolean' },
  })
  const check = (value: Record<string, unknown>) => checkValue(fields, value)

  it('takes only an answer offered, by its type too', () => {
    expect(check({ size: 1 })).toEqual([])
    expect(codes(check({ size: '1' }))).toEqual(['enum'])
  })

  it('holds a list by its count, its answers and its uniqueness', () => {
    expect(check({ days: ['mon'] })).toEqual([])
    expect(check({ days: [] })).toEqual([{ key: 'days', code: 'minItems', limit: 1 }])
    expect(codes(check({ days: ['sun'] }))).toEqual(['enum'])
    expect(codes(check({ tags: ['a', 'a'] }))).toEqual(['uniqueItems'])
    expect(check({ tags: ['a', 'b', 'c'] })).toEqual([{ key: 'tags', code: 'maxItems', limit: 2 }])
  })

  it('holds each tag to the rules of an entry, and says which', () => {
    expect(check({ tags: ['ok', 'long'] })).toEqual([{ key: 'tags', code: 'maxLength', limit: 3, item: 'long' }])
  })

  it('takes a boolean only as a boolean', () => {
    expect(check({ on: false })).toEqual([])
    expect(codes(check({ on: 'false' }))).toEqual(['type'])
  })
})

describe('groups', () => {
  const fields = readSchema({
    type: 'object',
    properties: {
      server: { type: 'object', properties: { host: { type: 'string' } }, required: ['host'] },
      proxy: { type: 'object', properties: { host: { type: 'string' } }, required: ['host'] },
    },
    required: ['server'],
  })

  it('asks for what a required group holds, whether or not the group is there yet', () => {
    expect(checkValue(fields, {})).toEqual([{ key: 'server.host', code: 'required' }])
  })

  it('asks nothing of an optional group that is absent, and everything once it is there', () => {
    expect(checkValue(fields, { server: { host: 'a' } })).toEqual([])
    expect(checkValue(fields, { server: { host: 'a' }, proxy: {} })).toEqual([{ key: 'proxy.host', code: 'required' }])
  })
})

describe('reading and writing by path', () => {
  it('reads through objects, and gives up quietly on anything else', () => {
    expect(valueAt({ a: { b: 1 } }, ['a', 'b'])).toBe(1)
    expect(valueAt({ a: 'text' }, ['a', 'b'])).toBeUndefined()
    expect(valueAt({ a: null }, ['a', 'b'])).toBeUndefined()
  })

  it('writes a copy, leaving the original and its untouched branches as they were', () => {
    const before = { a: { b: 1, c: 2 }, d: { e: 3 } }
    const after = withValue(before, ['a', 'b'], 5)
    expect(after).toEqual({ a: { b: 5, c: 2 }, d: { e: 3 } })
    expect(before.a.b).toBe(1)
    // Untouched branches are the same objects, so React sees nothing changed
    // there.
    expect(after.d).toBe(before.d)
  })

  it('removes the key for `undefined`, and makes the objects on the way', () => {
    expect(withValue({ a: 1, b: 2 }, ['a'], undefined)).toEqual({ b: 2 })
    expect(withValue({}, ['x', 'y'], 1)).toEqual({ x: { y: 1 } })
  })
})
