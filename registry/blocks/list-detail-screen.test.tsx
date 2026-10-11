// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ListDetailScreen, type ListDetailScreenProps, type ListDetailScreenWords } from './list-detail-screen'

interface Item {
  id: string
  title: string
  owner: string
}

const ITEMS: Item[] = [
  { id: 'a', title: 'Harbour lights', owner: 'Ines' },
  { id: 'b', title: 'The quiet mile', owner: 'Ravi' },
  { id: 'c', title: 'Ash and after', owner: 'Ines' },
]

const WORDS: ListDetailScreenWords = {
  list: 'Works',
  search: 'Find a work',
  clear: 'Clear the search',
  back: 'All works',
  nothingYet: { title: 'No works yet', body: 'Start one and it shows up here.' },
  nothingFound: { title: 'Nothing matches', body: 'Try fewer words.' },
  nothingOpen: { title: 'Nothing open', body: 'Choose a work to read it here.' },
}

type Props = Partial<ListDetailScreenProps<Item>>

function Screen({ initial = null, ...props }: Props & { initial?: string | null }) {
  const [selected, setSelected] = useState<string | null>(initial)
  return (
    <ListDetailScreen<Item>
      title="Works"
      items={ITEMS}
      itemKey={(item) => item.id}
      row={(item) => ({ title: item.title, description: item.owner })}
      selected={selected}
      onSelect={setSelected}
      matches={(item, query) => item.title.toLowerCase().includes(query.toLowerCase())}
      detailTitle={(item) => item.title}
      detail={(item) => <p>Owned by {item.owner}</p>}
      words={WORDS}
      {...props}
    />
  )
}

const rows = () => within(screen.getByRole('group', { name: 'Works' })).getAllByRole('button')

afterEach(() => {
  vi.restoreAllMocks()
  // The narrow screen is a stub on the prototype; leave none behind.
  delete (HTMLElement.prototype as { checkVisibility?: unknown }).checkVisibility
})

describe('ListDetailScreen', () => {
  it('draws the title and a row per item', () => {
    render(<Screen />)
    expect(screen.getByRole('heading', { level: 1, name: 'Works' })).toBeDefined()
    expect(rows().map((row) => row.textContent)).toEqual([
      'Harbour lightsInes',
      'The quiet mileRavi',
      'Ash and afterInes',
    ])
  })

  it('opens what is pressed, and names it as current', async () => {
    render(<Screen />)
    await userEvent.click(screen.getByRole('button', { name: /The quiet mile/ }))
    expect(screen.getByRole('button', { name: /The quiet mile/ }).getAttribute('aria-current')).toBe('true')
    expect(screen.getByRole('heading', { level: 2, name: 'The quiet mile' })).toBeDefined()
    expect(screen.getByText('Owned by Ravi')).toBeDefined()
  })

  it('says nothing is open, where there is room to', () => {
    render(<Screen />)
    expect(screen.getByText('Nothing open')).toBeDefined()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
  })

  it('goes back to the list', async () => {
    const onSelect = vi.fn()
    render(<Screen selected="a" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'All works' }))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('puts the actions on the open thing beside its title', () => {
    render(<Screen initial="a" detailActions={() => <button type="button">Rename</button>} />)
    const head = screen.getByRole('heading', { level: 2 }).parentElement!
    expect(within(head).getByRole('button', { name: 'Rename' })).toBeDefined()
  })

  describe('the search', () => {
    it('narrows the list to what answers', async () => {
      render(<Screen />)
      await userEvent.type(screen.getByRole('searchbox', { name: 'Find a work' }), 'quiet')
      expect(rows().map((row) => row.textContent)).toEqual(['The quiet mileRavi'])
    })

    it('says when nothing answers, and offers the way out', async () => {
      render(<Screen />)
      const field = screen.getByRole('searchbox', { name: 'Find a work' })
      await userEvent.type(field, 'zzz')
      expect(screen.getByText('Nothing matches')).toBeDefined()
      const panel = screen.getByText('Nothing matches').closest('div')!.parentElement!
      await userEvent.click(within(panel).getByRole('button', { name: 'Clear the search' }))
      expect((field as HTMLInputElement).value).toBe('')
      expect(rows()).toHaveLength(3)
    })

    it('is not drawn for a list that cannot be searched', () => {
      render(<Screen matches={undefined} />)
      expect(screen.queryByRole('searchbox')).toBeNull()
    })
  })

  it('draws one empty state for a screen with nothing on it', () => {
    render(<Screen items={[]} emptyAction={<button type="button">New work</button>} />)
    expect(screen.getByText('No works yet')).toBeDefined()
    expect(screen.getByRole('button', { name: 'New work' })).toBeDefined()
    // Not an empty list beside an empty pane: two of them say it twice.
    expect(screen.queryByText('Nothing open')).toBeNull()
    expect(screen.queryByRole('searchbox')).toBeNull()
  })

  describe('the keyboard', () => {
    it('walks the list and opens what it lands on', async () => {
      render(<Screen />)
      rows()[0]!.focus()
      await userEvent.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(rows()[1])
      expect(rows()[1]!.getAttribute('aria-current')).toBe('true')
      await userEvent.keyboard('{End}')
      expect(document.activeElement).toBe(rows()[2])
      await userEvent.keyboard('{Home}')
      expect(document.activeElement).toBe(rows()[0])
      await userEvent.keyboard('{ArrowUp}')
      expect(document.activeElement, 'stops at the top rather than wrapping').toBe(rows()[0])
      await userEvent.keyboard('{End}{ArrowDown}')
      expect(document.activeElement, 'and at the bottom').toBe(rows()[2])
    })
  })

  it('draws a row as the product link when given one', async () => {
    const onSelect = vi.fn()
    render(
      <Screen
        selected={null}
        onSelect={onSelect}
        rowRender={(item) => <a href={`#/works/${item.id}`} onClick={(event) => event.preventDefault()} />}
      />,
    )
    const link = screen.getByRole('link', { name: /Harbour lights/ })
    expect(link.getAttribute('href')).toBe('#/works/a')
    await userEvent.click(link)
    // The link opens itself; the product's router sets `selected`.
    expect(onSelect).not.toHaveBeenCalled()
  })

  /*
   * The narrow width, where the list and the open thing take turns. jsdom
   * lays nothing out, so the turn is stubbed the way a browser reports it:
   * a column that has stepped aside is not visible, and neither is anything
   * in it.
   */
  describe('where only one of the two fits', () => {
    function narrow() {
      ;(HTMLElement.prototype as { checkVisibility?: () => boolean }).checkVisibility = function (this: HTMLElement) {
        const root = this.closest('[data-list-detail]')
        if (root === null) return true
        const open = root.hasAttribute('data-open')
        if (this.closest('[data-list]')) return !open
        if (this.closest('[data-detail]')) return open
        return true
      }
    }

    it('hands the focus to the open thing once the list steps aside', async () => {
      narrow()
      render(<Screen />)
      await userEvent.click(screen.getByRole('button', { name: /The quiet mile/ }))
      const heading = screen.getByRole('heading', { level: 2, name: 'The quiet mile' })
      expect(document.activeElement).toBe(heading)
      // Focusable from a script and not a stop on the way through: a heading
      // without it cannot take the focus in a browser, whatever jsdom allows.
      expect(heading.getAttribute('tabindex')).toBe('-1')
    })

    it('hands it back to the row that was open', async () => {
      narrow()
      render(<Screen />)
      await userEvent.click(screen.getByRole('button', { name: /The quiet mile/ }))
      await userEvent.click(screen.getByRole('button', { name: 'All works' }))
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /The quiet mile/ }))
    })

    it('leaves the focus alone where both fit', async () => {
      render(<Screen />)
      ;(HTMLElement.prototype as { checkVisibility?: () => boolean }).checkVisibility = () => true
      const row = screen.getByRole('button', { name: /The quiet mile/ })
      await userEvent.click(row)
      expect(document.activeElement).toBe(row)
    })

    it('does not pull the focus for a selection the reader did not make', () => {
      narrow()
      const { rerender } = render(<Screen selected={null} onSelect={() => {}} />)
      const field = screen.getByRole('searchbox')
      field.focus()
      act(() => {
        rerender(<Screen selected="b" onSelect={() => {}} />)
      })
      // An address opened `b`; the reader was typing somewhere else.
      expect(document.activeElement).not.toBe(screen.getByRole('heading', { level: 2 }))
    })
  })

  it('has no accessibility violations, with nothing open', async () => {
    await expectNoA11yViolations(<Screen />)
  })

  it('has no accessibility violations, with something open', async () => {
    await expectNoA11yViolations(<Screen initial="b" />)
  })
})
