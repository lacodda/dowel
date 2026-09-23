// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from './accordion'

/*
 * Accordion.
 *
 * What is dowel's rather than Base UI's: the header is an `<h3>` with the
 * trigger inside it, not beside it, so a reader moving by heading lands on
 * every section title - open or shut - and never on a bare button. That
 * placement is the first test, because it is the one hand-rolled accordions
 * get wrong silently: the accordion still looks and clicks correctly with
 * the trigger outside the heading, and only a heading-based reader would ever
 * notice the gap.
 *
 * The rest of the wiring (aria-expanded, Enter/Space, single vs multiple) is
 * Base UI's; these tests prove it survives dowel's markup rather than
 * re-deriving the spec. There is no arrow-key test between headers: the
 * installed Base UI (1.8.0) has already dropped the roving-focus pattern
 * following the ARIA APG's 2024 guidance update, and its trigger carries no
 * keydown handler beyond the native button's own Enter/Space - measured by
 * reading `AccordionTrigger.js`, not assumed from an older version of the
 * spec. Each header is a normal tab stop, moved between with Tab like any
 * other button.
 */

function Faq({ multiple = false, defaultValue }: { multiple?: boolean; defaultValue?: string[] }) {
  return (
    <Accordion multiple={multiple} defaultValue={defaultValue}>
      <AccordionItem value="shipping">
        <AccordionHeader>
          <AccordionTrigger>Shipping</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>Orders ship within two business days.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionHeader>
          <AccordionTrigger>Returns</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>Returns are accepted within thirty days.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="warranty">
        <AccordionHeader>
          <AccordionTrigger>Warranty</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>Every item carries a one-year warranty.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

describe('Accordion', () => {
  it('puts the trigger inside a heading, so a reader moving by heading finds every section', () => {
    render(<Faq />)
    const heading = screen.getByRole('heading', { level: 3, name: 'Shipping' })
    expect(heading.querySelector('button')).not.toBeNull()
  })

  it('reports each section through aria-expanded', async () => {
    const user = userEvent.setup()
    render(<Faq />)
    const shipping = screen.getByRole('button', { name: 'Shipping' })
    expect(shipping.getAttribute('aria-expanded')).toBe('false')

    await user.click(shipping)
    expect(shipping.getAttribute('aria-expanded')).toBe('true')
  })

  it('closes the open section when another opens, by default', async () => {
    const user = userEvent.setup()
    render(<Faq defaultValue={['shipping']} />)
    const shipping = screen.getByRole('button', { name: 'Shipping' })
    const returns = screen.getByRole('button', { name: 'Returns' })
    expect(shipping.getAttribute('aria-expanded')).toBe('true')

    await user.click(returns)
    expect(returns.getAttribute('aria-expanded')).toBe('true')
    expect(shipping.getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps more than one section open with multiple', async () => {
    const user = userEvent.setup()
    render(<Faq multiple defaultValue={['shipping']} />)
    const shipping = screen.getByRole('button', { name: 'Shipping' })
    const returns = screen.getByRole('button', { name: 'Returns' })

    await user.click(returns)
    expect(shipping.getAttribute('aria-expanded')).toBe('true')
    expect(returns.getAttribute('aria-expanded')).toBe('true')
  })

  it('is controlled when value and onValueChange are given', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    function Controlled() {
      return (
        <Accordion value={[]} onValueChange={onValueChange}>
          <AccordionItem value="shipping">
            <AccordionHeader>
              <AccordionTrigger>Shipping</AccordionTrigger>
            </AccordionHeader>
            <AccordionPanel>Orders ship within two business days.</AccordionPanel>
          </AccordionItem>
        </Accordion>
      )
    }
    render(<Controlled />)
    const shipping = screen.getByRole('button', { name: 'Shipping' })
    await user.click(shipping)
    // A controlled accordion does not open itself - the caller decides.
    expect(onValueChange).toHaveBeenCalledWith(['shipping'], expect.anything())
    expect(shipping.getAttribute('aria-expanded')).toBe('false')
  })

  it('toggles with Enter and Space', async () => {
    const user = userEvent.setup()
    render(<Faq />)
    await user.tab()
    const shipping = screen.getByRole('button', { name: 'Shipping' })
    expect(document.activeElement).toBe(shipping)

    await user.keyboard('{Enter}')
    expect(shipping.getAttribute('aria-expanded')).toBe('true')

    await user.keyboard(' ')
    expect(shipping.getAttribute('aria-expanded')).toBe('false')
  })

  it('moves between headers with Tab, each one its own stop', async () => {
    // Not arrow keys: the installed Base UI has dropped roving focus for
    // accordion headers (see the file banner above), so each header is an
    // ordinary tab stop rather than one stop with an internal cursor, the
    // way TreeView or a RadioGroup works.
    const user = userEvent.setup()
    render(<Faq />)
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Shipping' }))

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Returns' }))

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Warranty' }))
  })

  it('lets the caller win a className conflict on the trigger', () => {
    render(
      <Accordion>
        <AccordionItem value="shipping">
          <AccordionHeader>
            <AccordionTrigger className="w-16">Shipping</AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>Orders ship within two business days.</AccordionPanel>
        </AccordionItem>
      </Accordion>,
    )
    expect(screen.getByRole('button', { name: 'Shipping' }).className).toContain('w-16')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Faq defaultValue={['shipping']} />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe with sections closed and open', async () => {
    await expectNoA11yViolations(<Faq />)
    await expectNoA11yViolations(<Faq defaultValue={['shipping']} />)
  })
})
