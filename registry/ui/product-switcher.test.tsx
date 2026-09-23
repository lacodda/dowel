// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ProductSwitcher, type SwitcherProduct } from './product-switcher'

/*
 * ProductSwitcher.
 *
 * It knows no addresses of its own, so the checks are that it carries the
 * caller's faithfully: links stay links, actions run, and the product already
 * open is not offered again.
 */

const products: SwitcherProduct[] = [
  { product: 'kasl', name: 'kasl', description: 'Tracks the working day' },
  { product: 'kasl-server', name: 'kasl-server', href: 'https://example.com/team' },
  { product: 'rigger', name: 'rigger', onSelect: vi.fn() },
]

const switcher = () => (
  <ProductSwitcher current="kasl" currentName="kasl" products={products} label="Switch product" />
)

describe('ProductSwitcher', () => {
  it('names the product and what the button does', () => {
    render(switcher())
    expect(screen.getByRole('button', { name: 'kasl Switch product' })).toBeDefined()
  })

  it('offers the others, not the one already open', async () => {
    const user = userEvent.setup()
    render(switcher())
    await user.click(screen.getByRole('button', { name: 'kasl Switch product' }))
    expect(await screen.findAllByRole('menuitem')).toHaveLength(2)
    // By name, not by text: the tile's code is text inside the item, and it
    // is hidden from a reader - which is what the name reflects.
    expect(screen.getByRole('menuitem', { name: 'kasl-server' })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: 'rigger' })).toBeDefined()
    expect(screen.queryByRole('menuitem', { name: 'kasl' })).toBeNull()
  })

  it('keeps a place a link', async () => {
    const user = userEvent.setup()
    render(switcher())
    await user.click(screen.getByRole('button', { name: 'kasl Switch product' }))
    const item = await screen.findByRole('menuitem', { name: 'kasl-server' })
    expect(item.tagName).toBe('A')
    expect(item.getAttribute('href')).toBe('https://example.com/team')
  })

  it('runs an action', async () => {
    const user = userEvent.setup()
    render(switcher())
    await user.click(screen.getByRole('button', { name: 'kasl Switch product' }))
    await user.click(await screen.findByRole('menuitem', { name: 'rigger' }))
    expect(products[2]!.onSelect).toHaveBeenCalledTimes(1)
  })

  it('shows each product by its own tile', async () => {
    const user = userEvent.setup()
    render(switcher())
    await user.click(screen.getByRole('button', { name: 'kasl Switch product' }))
    const item = await screen.findByRole('menuitem', { name: 'rigger' })
    expect(item.querySelector('svg[data-mark]')?.getAttribute('data-mark')).toBe('rigger')
  })

  it('passes the accessibility gate', async () => {
    await expectNoA11yViolations(switcher())
  })
})
