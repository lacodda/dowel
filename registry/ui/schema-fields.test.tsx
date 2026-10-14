// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { expectNoA11yViolations } from '../../tests/a11y'
import { SchemaFields, type SchemaFieldsProps, type SchemaFieldsWords } from './schema-fields'
import type { JsonSchema } from './schema-shape'

/*
 * SchemaFields.
 *
 * Every control is found the way a reader finds it - by its role and its name
 * - because the promise is that a schema becomes a form someone can use, and
 * a field drawn but not named is not that. Every write is read back as the
 * value the product receives, with its type: a choice of `1` stays the number
 * 1, an emptied optional field is gone rather than an empty string.
 */

const words: SchemaFieldsWords = {
  issue: (issue) => `${issue.code}${'limit' in issue ? ` ${issue.limit}` : ''}`,
  none: 'None',
  choose: 'Choose',
  pickDate: 'Pick a day',
  previousMonth: 'Back',
  nextMonth: 'On',
  showSecret: 'Show',
  hideSecret: 'Hide',
  removeTag: (tag) => `Remove ${tag}`,
}

type HarnessProps = Omit<SchemaFieldsProps, 'value' | 'onValueChange' | 'words'> & {
  initial?: Record<string, unknown>
  onChange?: (value: Record<string, unknown>) => void
}

/** The fields as a product holds them: one object in state. */
function Harness({ initial = {}, onChange, ...props }: HarnessProps) {
  const [value, setValue] = useState(initial)
  return (
    <SchemaFields
      {...props}
      value={value}
      words={words}
      onValueChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

const last = (spy: ReturnType<typeof vi.fn>) => spy.mock.calls[spy.mock.calls.length - 1]?.[0]

const settings: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name', minLength: 2 },
    bio: { type: 'string', title: 'About', 'x-control': 'multiline' },
    mail: { type: 'string', title: 'Mail', format: 'email' },
    site: { type: 'string', title: 'Site', format: 'uri' },
    token: { type: 'string', title: 'Token', writeOnly: true },
    born: { type: 'string', title: 'Born', format: 'date' },
    port: { type: 'integer', title: 'Port', minimum: 1, maximum: 65535 },
    ratio: { type: 'number', title: 'Ratio' },
    letter: { type: 'boolean', title: 'Weekly letter', description: 'Sundays, at nine.', default: true },
    size: { title: 'Size', enum: ['s', 'm', 'l'] },
    theme: { title: 'Theme', enum: ['light', 'dark'], 'x-control': 'segmented' },
    pace: {
      title: 'Pace',
      oneOf: [
        { const: 'slow', title: 'Slow', description: 'One a day.' },
        { const: 'fast', title: 'Fast' },
      ],
      'x-control': 'radio',
    },
    days: { title: 'Days', type: 'array', items: { enum: ['mon', 'tue', 'wed'] } },
    tags: { title: 'Tags', type: 'array', items: { type: 'string' } },
    kind: { const: 'profile' },
    server: {
      title: 'Server',
      type: 'object',
      properties: { host: { type: 'string', title: 'Host' } },
      required: ['host'],
    },
  },
  required: ['name', 'size', 'server'],
}

describe('SchemaFields draws every kind of field, each named by its label', () => {
  it.each([
    ['textbox', 'Name'],
    ['textbox', 'About'],
    ['textbox', 'Mail'],
    ['textbox', 'Site'],
    ['button', 'Born Pick a day'],
    ['textbox', 'Port'],
    ['textbox', 'Ratio'],
    ['switch', 'Weekly letter'],
    ['combobox', 'Size'],
    ['radiogroup', 'Theme'],
    ['radiogroup', 'Pace'],
    ['group', 'Days'],
    ['textbox', 'Tags'],
    ['group', 'Server'],
    ['textbox', 'Host'],
  ] as const)('a %s called %s', (role, name) => {
    render(<Harness schema={settings} />)
    expect(screen.getByRole(role, { name })).toBeDefined()
  })

  it('draws a secret as a password, behind its reveal', () => {
    render(<Harness schema={settings} />)
    expect(screen.getByLabelText('Token').getAttribute('type')).toBe('password')
    expect(screen.getByRole('button', { name: 'Show' })).toBeDefined()
  })

  it('draws a box of the kind the format asks for', () => {
    render(<Harness schema={settings} />)
    expect(screen.getByRole('textbox', { name: 'Mail' }).getAttribute('type')).toBe('email')
    expect(screen.getByRole('textbox', { name: 'Site' }).getAttribute('type')).toBe('url')
    expect(screen.getByRole('textbox', { name: 'About' }).tagName).toBe('TEXTAREA')
  })

  it('does not draw a value nobody chooses', () => {
    render(<Harness schema={settings} />)
    expect(screen.queryByText('kind')).toBeNull()
  })

  it('describes a field with its help, and an answer with its own', () => {
    render(<Harness schema={settings} />)
    expect(screen.getByRole('switch', { name: 'Weekly letter', description: 'Sundays, at nine.' })).toBeDefined()
    expect(screen.getByText('One a day.')).toBeDefined()
  })

  it('marks a required field', () => {
    render(<Harness schema={settings} />)
    expect(screen.getByText('Name').querySelector('[aria-hidden]')?.textContent).toBe('*')
  })

  it('shows an absent boolean as its default, which is what it will be taken to be', () => {
    render(<Harness schema={settings} />)
    expect(screen.getByRole('switch', { name: 'Weekly letter' }).getAttribute('aria-checked')).toBe('true')
  })
})

describe('what the fields write', () => {
  it('writes text, and removes the key when an optional box is emptied', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness schema={settings} onChange={onChange} initial={{ name: 'Ada', mail: 'a@b.c' }} />)
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'm')
    expect(last(onChange)).toMatchObject({ name: 'Adam' })
    await user.clear(screen.getByRole('textbox', { name: 'Mail' }))
    expect(last(onChange)).not.toHaveProperty('mail')
  })

  it('writes null for an emptied box the schema allows to be null', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const schema = { type: 'object', properties: { nick: { type: ['string', 'null'], title: 'Nick' } } }
    render(<Harness schema={schema} onChange={onChange} initial={{ nick: 'A' }} />)
    await user.clear(screen.getByRole('textbox', { name: 'Nick' }))
    expect(last(onChange)).toEqual({ nick: null })
  })

  it('writes a number as a number', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness schema={settings} onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: 'Port' }), '8080')
    await user.tab()
    expect(last(onChange)).toMatchObject({ port: 8080 })
  })

  it('writes a boolean', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness schema={settings} onChange={onChange} />)
    await user.click(screen.getByRole('switch', { name: 'Weekly letter' }))
    expect(last(onChange)).toMatchObject({ letter: false })
  })

  it('writes the answer chosen, as the value the schema offers - a number stays a number', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const schema = { type: 'object', properties: { level: { title: 'Level', enum: [1, 2, 3] } } }
    render(<Harness schema={schema} onChange={onChange} />)
    await user.click(screen.getByRole('combobox', { name: 'Level' }))
    await user.click(await screen.findByRole('option', { name: '2' }))
    expect(last(onChange)).toEqual({ level: 2 })
  })

  it('offers the way back to nothing only where nothing is allowed', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const schema = {
      type: 'object',
      properties: { a: { title: 'A', enum: ['x'] }, b: { title: 'B', enum: ['x'] } },
      required: ['b'],
    }
    render(<Harness schema={schema} onChange={onChange} initial={{ a: 'x', b: 'x' }} />)
    await user.click(screen.getByRole('combobox', { name: 'A' }))
    await user.click(await screen.findByRole('option', { name: 'None' }))
    expect(last(onChange)).toEqual({ b: 'x' })
    await user.click(screen.getByRole('combobox', { name: 'B' }))
    await screen.findByRole('option', { name: 'x' })
    expect(screen.queryByRole('option', { name: 'None' })).toBeNull()
  })

  it('writes a segment and a radio answer', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness schema={settings} onChange={onChange} />)
    await user.click(screen.getByRole('radio', { name: 'dark' }))
    expect(last(onChange)).toMatchObject({ theme: 'dark' })
    await user.click(screen.getByRole('radio', { name: /Fast/ }))
    expect(last(onChange)).toMatchObject({ pace: 'fast' })
  })

  it('writes several answers in the order the schema offers them, not the order ticked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness schema={settings} onChange={onChange} />)
    await user.click(screen.getByRole('checkbox', { name: 'wed' }))
    await user.click(screen.getByRole('checkbox', { name: 'mon' }))
    expect(last(onChange)).toMatchObject({ days: ['mon', 'wed'] })
  })

  it('writes tags', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness schema={settings} onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: 'Tags' }), 'night{Enter}')
    expect(last(onChange)).toMatchObject({ tags: ['night'] })
  })

  it('writes a day as the calendar date it is', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness schema={settings} onChange={onChange} initial={{ born: '2026-09-02' }} />)
    await user.click(screen.getByRole('button', { name: /^Born/ }))
    await user.click(await screen.findByRole('button', { name: /September 14, 2026/ }))
    expect(last(onChange)).toMatchObject({ born: '2026-09-14' })
  })

  it('writes inside a group, making the group on the way', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness schema={settings} onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: 'Host' }), 'a')
    expect(last(onChange)).toMatchObject({ server: { host: 'a' } })
  })
})

describe('what is wrong, and when it is said', () => {
  it('says nothing about a field nobody has left yet', () => {
    render(<Harness schema={settings} />)
    expect(screen.queryByText('required')).toBeNull()
  })

  it('says it once the field is left, as the field’s description', async () => {
    const user = userEvent.setup()
    render(<Harness schema={settings} />)
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'A')
    expect(screen.queryByText('minLength 2')).toBeNull()
    await user.tab()
    const box = screen.getByRole('textbox', { name: 'Name', description: 'minLength 2' })
    expect(box.getAttribute('aria-invalid')).toBe('true')
  })

  it('does not count a move into the field’s own reveal button as leaving', async () => {
    const user = userEvent.setup()
    const schema = { type: 'object', properties: { key: { type: 'string', title: 'Key', writeOnly: true, minLength: 9 } } }
    render(<Harness schema={schema} />)
    await user.type(screen.getByLabelText('Key'), 'short')
    await user.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.queryByText('minLength 9')).toBeNull()
  })

  it('says everything at once when told to reveal', () => {
    render(<Harness schema={settings} reveal />)
    expect(screen.getByRole('textbox', { name: 'Name', description: 'required' })).toBeDefined()
    expect(screen.getByRole('combobox', { name: 'Size', description: 'required' })).toBeDefined()
    expect(screen.getByRole('textbox', { name: 'Host', description: 'required' })).toBeDefined()
  })

  it('says an error from elsewhere at once, and over the schema’s own', () => {
    render(<Harness schema={settings} reveal errors={{ name: 'Taken.', 'server.host': 'Unreachable.' }} />)
    expect(screen.getByRole('textbox', { name: 'Name', description: 'Taken.' })).toBeDefined()
    expect(screen.getByRole('textbox', { name: 'Host', description: 'Unreachable.' })).toBeDefined()
  })

  it('hands the words the issue and the field it belongs to', () => {
    const issue = vi.fn(() => 'wrong')
    render(<SchemaFields schema={settings} value={{}} onValueChange={() => {}} reveal words={{ ...words, issue }} />)
    expect(issue).toHaveBeenCalledWith({ key: 'name', code: 'required' }, expect.objectContaining({ label: 'Name' }))
  })
})

describe('what the product draws itself', () => {
  const schema = {
    type: 'object',
    properties: {
      stops: { title: 'Stops', type: 'array', items: { type: 'object', properties: { at: { type: 'string' } } } },
    },
  }

  it('hands a field it cannot draw to the product, with its words and its error', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Harness
        schema={schema}
        onChange={onChange}
        errors={{ stops: 'Too many.' }}
        custom={{
          stops: ({ field, onValueChange, error }) => (
            <button type="button" onClick={() => onValueChange([{ at: 'noon' }])}>
              {field.label}: {error}
            </button>
          ),
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Stops: Too many.' }))
    expect(last(onChange)).toEqual({ stops: [{ at: 'noon' }] })
  })

  it('refuses the schema, by the field, when the product has not drawn it', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Harness schema={schema} />)).toThrow(/stops/)
    vi.mocked(console.error).mockRestore()
  })
})

describe('a zod schema, as a product hands it over', () => {
  const Profile = z.object({
    handle: z.string().min(3).meta({ title: 'Handle' }),
    age: z.number().int().min(13).optional().meta({ title: 'Age' }),
    plan: z.enum(['free', 'team']).meta({ title: 'Plan' }),
  })

  it('draws it and holds the value to it', async () => {
    const user = userEvent.setup()
    render(<Harness schema={z.toJSONSchema(Profile) as JsonSchema} initial={{ plan: 'free' }} />)
    await user.type(screen.getByRole('textbox', { name: 'Age' }), '9')
    await user.tab()
    expect(screen.getByRole('textbox', { name: 'Age', description: 'minimum 13' })).toBeDefined()
  })
})

describe('the whole form', () => {
  it('disables every field at once', () => {
    render(<Harness schema={settings} disabled />)
    for (const name of ['Name', 'Port']) {
      expect((screen.getByRole('textbox', { name }) as HTMLInputElement).disabled).toBe(true)
    }
    expect(screen.getByRole('switch', { name: 'Weekly letter' }).hasAttribute('data-disabled')).toBe(true)
    expect((screen.getByRole('combobox', { name: 'Size' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps a read-only field readable and not writable', () => {
    const schema = { type: 'object', properties: { id: { type: 'string', title: 'Id', readOnly: true } } }
    render(<Harness schema={schema} initial={{ id: 'abc' }} />)
    const box = screen.getByRole('textbox', { name: 'Id' }) as HTMLInputElement
    expect(box.readOnly).toBe(true)
    expect(box.value).toBe('abc')
  })

  it('passes axe, quiet and with every problem showing', async () => {
    await expectNoA11yViolations(<Harness schema={settings} />)
    await expectNoA11yViolations(<Harness schema={settings} reveal errors={{ port: 'Busy.' }} />)
  })
})
