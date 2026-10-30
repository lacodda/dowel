import { describe, expect, it } from 'vitest'
import { snippetFor, snippetsFile, snippetsFor, type ComponentEntry } from './snippets.js'

/*
 * What a snippet asks for. It is only worth typing `dw-` for if what comes
 * out compiles: the props the component cannot do without are there to be
 * filled, a variant offers its choices with the default first, and a
 * component that takes children is written open and closed.
 */

const button: ComponentEntry = {
  name: 'Button',
  description: 'A button.',
  props: [
    { name: 'variant', type: 'primary | ghost | soft', default: "'ghost'", variant: true },
    { name: 'disabledReason', type: 'string', description: 'Why it is off.' },
  ],
  inherits: [{ kind: 'react', type: 'ButtonHTMLAttributes<HTMLButtonElement>' }],
}

describe('a snippet', () => {
  it('offers a variant as a choice, its default first', () => {
    expect(snippetFor(button).body).toEqual(['<Button variant="${1|ghost,primary,soft|}">', '\t$0', '</Button>'])
  })

  it('asks for what is required, before the variants, in the shape its type wants', () => {
    const field: ComponentEntry = {
      name: 'CopyButton',
      props: [
        { name: 'size', type: 'sm | md', variant: true },
        { name: 'value', type: 'string', required: true },
        { name: 'onCopied', type: '() => void', required: true },
        { name: 'quiet', type: 'boolean', required: true },
      ],
    }
    expect(snippetFor(field).body).toEqual(['<CopyButton value="${1}" onCopied={${2}} quiet size="${4|sm,md|}" />$0'])
  })

  it('leaves out what is optional and not a variant', () => {
    expect(snippetFor(button).body.join('')).not.toContain('disabledReason')
  })

  it('closes itself when the component takes nothing to put inside', () => {
    expect(snippetFor({ name: 'Spinner', props: [] }).body).toEqual(['<Spinner />$0'])
  })

  it('is called by the component name, the way the registry names files', () => {
    expect(snippetFor({ name: 'DateRangePicker', props: [] }).prefix).toBe('dw-date-range-picker')
  })

  it('does not offer a type that is not a list of words as a choice', () => {
    const odd: ComponentEntry = { name: 'Odd', props: [{ name: 'at', type: 'number | Date', required: true }] }
    expect(snippetFor(odd).body[0]).toBe('<Odd at={${1}} />$0')
  })
})

describe('the edges of a snippet', () => {
  it('takes a single literal as a choice of one, and a type in a union as no choice at all', () => {
    const odd: ComponentEntry = {
      name: 'Odd',
      props: [
        { name: 'tone', type: 'warn', required: true },
        { name: 'side', type: 'top | Side', required: true },
        { name: 'items', type: 'left | right[]', required: true },
        { name: 'flag', type: 'true', required: true },
      ],
    }
    expect(snippetFor(odd).body[0]).toBe('<Odd tone="${1|warn|}" side={${2}} items={${3}} flag={${4}} />$0')
  })

  it('keeps the written order when the default is not one of the choices', () => {
    const odd: ComponentEntry = { name: 'Odd', props: [{ name: 'size', type: 'sm | md', default: "'huge'", variant: true }] }
    expect(snippetFor(odd).body[0]).toBe('<Odd size="${1|sm,md|}" />$0')
  })

  it('puts a default written in double quotes first too', () => {
    const odd: ComponentEntry = { name: 'Odd', props: [{ name: 'size', type: 'sm | md', default: '"md"', variant: true }] }
    expect(snippetFor(odd).body[0]).toBe('<Odd size="${1|md,sm|}" />$0')
  })

  it('never asks for children as an attribute, even required', () => {
    const card: ComponentEntry = { name: 'Card', props: [{ name: 'children', type: 'ReactNode', required: true }] }
    expect(snippetFor(card).body).toEqual(['<Card>', '\t$0', '</Card>'])
  })

  it('writes a component with no props of its own open and closed when it passes on an element', () => {
    expect(snippetFor({ name: 'Plain', inherits: [{ kind: 'react' }] }).body).toEqual(['<Plain>', '\t$0', '</Plain>'])
  })

  it('writes a component that is a Base UI part open and closed', () => {
    expect(snippetFor({ name: 'Select', is: { kind: 'base-ui' } }).body).toEqual(['<Select>', '\t$0', '</Select>'])
  })

  it('takes the description, the name when there is none, and the scope of a React file', () => {
    expect(snippetFor(button).description).toBe('A button.')
    const plain = snippetFor({ name: 'Spinner', props: [] })
    expect(plain.description).toBe('Spinner')
    expect(plain.scope).toBe('typescriptreact,javascriptreact')
  })
})

describe('the file', () => {
  it('is in the order of the items, and skips an item the package does not know', () => {
    const catalogue = {
      button: { dir: 'ui' as const, components: [button] },
      badge: { dir: 'ui' as const, components: [{ name: 'Badge', props: [] }] },
    }
    expect(Object.keys(snippetsFor(catalogue, ['button', 'gone', 'badge']))).toEqual(['Badge', 'Button'])
  })

  it('says it came from dowel-ui even when the version is unknown', () => {
    expect(snippetsFile({}, undefined).split('\n')[0]).toBe(
      '// Generated by `dowel snippets` from dowel-ui, for the components this project has copied.',
    )
  })

  it('holds every component of the items asked for, and no other', () => {
    const catalogue = {
      button: { dir: 'ui' as const, components: [button] },
      badge: { dir: 'ui' as const, components: [{ name: 'Badge', props: [] }] },
    }
    expect(Object.keys(snippetsFor(catalogue, ['button', 'button']))).toEqual(['Button'])
  })

  it('says where it came from, and that it is overwritten', () => {
    const text = snippetsFile({ Button: snippetFor(button) }, '0.41.0')
    expect(text).toContain('dowel-ui 0.41.0')
    expect(text).toContain('overwritten')
  })
})
