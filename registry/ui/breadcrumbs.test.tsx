// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Breadcrumbs, type Crumb } from './breadcrumbs'

const trail: Crumb[] = [
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'work', label: 'Harbour lights' },
]

describe('Breadcrumbs', () => {
  it('draws the whole trail', () => {
    render(<Breadcrumbs label="Breadcrumb" items={trail} />)
    expect(screen.getByText('Catalogue')).toBeDefined()
    expect(screen.getByText('Harbour lights')).toBeDefined()
  })

  it('makes where you stand text rather than somewhere to go', () => {
    render(<Breadcrumbs label="Breadcrumb" items={trail} render={(item) => <a href={`/${item.id}`} />} />)
    expect(screen.getByRole('link', { name: 'Catalogue' })).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Harbour lights' })).toBeNull()
    expect(screen.getByText('Harbour lights').getAttribute('aria-current')).toBe('page')
  })

  it('names the destination for a reader, not just the ones before it', () => {
    // Without `aria-current` a reader hears a list of four places to go and
    // is not told which one they are already on.
    render(<Breadcrumbs label="Breadcrumb" items={trail} />)
    const current = screen.getByText('Harbour lights')
    expect(current.getAttribute('aria-current')).toBe('page')
    expect(screen.getByText('Catalogue').getAttribute('aria-current')).toBeNull()
  })

  it('is a list, in order, with a name', () => {
    render(<Breadcrumbs label="Breadcrumb" items={trail} />)
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeDefined()
    expect(screen.getByRole('list')).toBeDefined()
  })

  it('keeps the separator out of what is read aloud', () => {
    // Otherwise the trail becomes "Works, greater than, Harbour lights".
    render(<Breadcrumbs label="Breadcrumb" items={trail} />)
    const separator = screen.getByText('›')
    expect(separator.getAttribute('aria-hidden')).toBe('true')
  })

  it('says which crumb was pressed', async () => {
    const onSelect = vi.fn()
    render(<Breadcrumbs label="Breadcrumb" items={trail} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Catalogue' }))
    expect(onSelect).toHaveBeenCalledWith('catalogue')
  })

  it('does not act on the crumb you are standing on', async () => {
    const onSelect = vi.fn()
    render(<Breadcrumbs label="Breadcrumb" items={trail} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('Harbour lights'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  /*
   * The fold. The first crumb is the way out and the last is where you stand;
   * everything between is what gives when the trail is longer than it is
   * wide. Wrapping onto a second line instead would change the height of a
   * title bar.
   */
  const deep: Crumb[] = [
    { id: 'a', label: 'Library' },
    { id: 'b', label: 'Collections' },
    { id: 'c', label: 'Sea songs' },
    { id: 'd', label: 'Works' },
    { id: 'e', label: 'Harbour lights' },
  ]

  it('keeps the way out and where you are, and folds the middle', () => {
    render(<Breadcrumbs label="Breadcrumb" items={deep} />)
    expect(screen.getByText('Library'), 'the way out was folded away').toBeDefined()
    expect(screen.getByText('Harbour lights'), 'where you stand was folded away').toBeDefined()
    expect(screen.getByText('…')).toBeDefined()
    expect(screen.queryByText('Collections')).toBeNull()
  })

  it('draws as many crumbs as it was told to', () => {
    render(<Breadcrumbs label="Breadcrumb" items={deep} max={4} />)
    // Four items: the first, the ellipsis, and the last two.
    expect(screen.getAllByRole('listitem').filter((li) => li.textContent !== '›')).toHaveLength(4)
  })

  it('never folds below three, whatever it is asked for', () => {
    // The first, the ellipsis and the last are the floor: below that the fold
    // would drop the thing it exists to keep.
    render(<Breadcrumbs label="Breadcrumb" items={deep} max={1} />)
    expect(screen.getByText('Library')).toBeDefined()
    expect(screen.getByText('Harbour lights')).toBeDefined()
    expect(screen.getByText('…')).toBeDefined()
  })

  it('folds nothing when the trail fits', () => {
    render(<Breadcrumbs label="Breadcrumb" items={deep} max={5} />)
    expect(screen.queryByText('…')).toBeNull()
    for (const crumb of deep) expect(screen.getByText(crumb.label as string)).toBeDefined()
  })

  it('gives the width to the crumb that may be a sentence', () => {
    // The last crumb is a title; the ones before it are screen names and keep
    // their width so the way home does not disappear first.
    render(<Breadcrumbs label="Breadcrumb" items={trail} />)
    const last = screen.getByText('Harbour lights').parentElement!
    const first = screen.getByText('Catalogue').parentElement!
    expect(last.className).toContain('min-w-0')
    expect(first.className).toContain('shrink-0')
  })
})

describe('Breadcrumbs, for a reader', () => {
  it('passes axe as buttons and as links', async () => {
    const { unmount } = await expectNoA11yViolations(
      <Breadcrumbs label="Breadcrumb" items={trail} />,
    )
    unmount()
    await expectNoA11yViolations(
      <Breadcrumbs label="Breadcrumb" items={trail} render={(item) => <a href={`/${item.id}`} />} />,
    )
  })

  it('passes axe folded', async () => {
    await expectNoA11yViolations(
      <Breadcrumbs
        label="Breadcrumb"
        items={[
          { id: 'a', label: 'Library' },
          { id: 'b', label: 'Collections' },
          { id: 'c', label: 'Sea songs' },
          { id: 'd', label: 'Harbour lights' },
        ]}
        max={3}
      />,
    )
  })
})
