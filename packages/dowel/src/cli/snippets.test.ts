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

describe('the file', () => {
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
