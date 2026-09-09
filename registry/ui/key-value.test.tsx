// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { KeyValue, KeyValueRow } from './key-value'

/*
 * KeyValue.
 *
 * The reason to have this once rather than in every product is the markup: a
 * `<dl>` says which value belongs to which name, and two `<div>`s in a flex
 * row do not. So that is what the tests are about - the element and the
 * pairing, not the spacing.
 */

const Example = ({ layout }: { layout?: 'rows' | 'stacked' } = {}) => (
  <KeyValue layout={layout}>
    <KeyValueRow label="Created">2 hours ago</KeyValueRow>
    <KeyValueRow label="Owner">Ines</KeyValueRow>
  </KeyValue>
)

describe('the markup, which is the whole point', () => {
  it('is a description list, not a grid of divs', () => {
    const { container } = render(<Example />)
    expect(container.querySelector('dl')).not.toBeNull()
    expect(container.querySelectorAll('dt')).toHaveLength(2)
    expect(container.querySelectorAll('dd')).toHaveLength(2)
  })

  it('pairs each value with its name', () => {
    // Read out of two divs this is four unrelated pieces of text, and nothing
    // says which value belongs to which name.
    const { container } = render(<Example />)
    const terms = [...container.querySelectorAll('dt')].map((node) => node.textContent)
    const values = [...container.querySelectorAll('dd')].map((node) => node.textContent)
    expect(terms).toEqual(['Created', 'Owner'])
    expect(values).toEqual(['2 hours ago', 'Ines'])
  })

  it('puts nothing between a name and its value in rows', () => {
    // The grid lines every value up in one column only because `dt` and `dd`
    // are direct children. A wrapper per pair makes each pair its own box, and
    // the values then sit at a different place on every line.
    const { container } = render(<Example layout="rows" />)
    const list = container.querySelector('dl')
    const children = [...(list?.children ?? [])].map((node) => node.tagName)
    expect(children).toEqual(['DT', 'DD', 'DT', 'DD'])
  })

  it('wraps each pair when stacked', () => {
    // Without a wrapper the column's gap falls between `dt` and `dd` as
    // readily as between pairs, and six facts read as twelve loose lines.
    const { container } = render(<Example layout="stacked" />)
    const list = container.querySelector('dl')
    const children = [...(list?.children ?? [])].map((node) => node.tagName)
    expect(children).toEqual(['DIV', 'DIV'])
    // Still a real pair inside each wrapper - a `<dl>` allows a `div` per
    // pair, and nothing else, between the list and its terms.
    expect(list?.querySelectorAll('div > dt')).toHaveLength(2)
  })

  it('takes a node as a value, not only a string', () => {
    // Half the values in a real panel are a Badge, a RelativeTime or a link.
    render(
      <KeyValue>
        <KeyValueRow label="Status">
          <span data-testid="badge">Draft</span>
        </KeyValueRow>
      </KeyValue>,
    )
    expect(screen.getByTestId('badge')).toBeDefined()
  })
})

describe('the rest', () => {
  it('lets the caller win a conflict on the list', () => {
    const { container } = render(
      <KeyValue className="gap-x-1">
        <KeyValueRow label="a">b</KeyValueRow>
      </KeyValue>,
    )
    const className = container.querySelector('dl')?.className ?? ''
    expect(className).toContain('gap-x-1')
    expect(className).not.toContain('gap-x-4')
  })

  it('applies a row’s className in both layouts', () => {
    const rows = render(
      <KeyValue>
        <KeyValueRow label="a" className="font-mono">
          b
        </KeyValueRow>
      </KeyValue>,
    )
    expect(rows.container.querySelector('dt')?.className).toContain('font-mono')
    rows.unmount()

    const stacked = render(
      <KeyValue layout="stacked">
        <KeyValueRow label="a" className="font-mono">
          b
        </KeyValueRow>
      </KeyValue>,
    )
    expect(stacked.container.querySelector('dl > div')?.className).toContain('font-mono')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe in both layouts', async () => {
    const rows = await expectNoA11yViolations(<Example layout="rows" />)
    rows.unmount()
    await expectNoA11yViolations(<Example layout="stacked" />)
  })
})
