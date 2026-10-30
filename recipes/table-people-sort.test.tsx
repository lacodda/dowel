// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { people, works } from '../fixtures/world'
import { expectNoA11yViolations } from '../tests/a11y'
import { TablePeopleSort, type Row } from './table-people-sort'

/*
 * The recipe is code a product copies by reading it, so it is held to what it
 * claims: a sorted column says so, a filter that catches nothing says so, and
 * whatever changes the pages starts again at page one.
 */

// The fixture has fewer works than a few pages; repeat it so paging is real.
const rows: Row[] = Array.from({ length: 36 }, (_, index) => {
  const work = works[index % works.length]!
  return {
    id: `${work.id}-${index}`,
    title: `${work.title} ${index + 1}`,
    kind: work.kind,
    stage: work.stage,
    owner: people.find((person) => person.id === work.owner)!.name,
    updated: work.updated,
    score: work.score,
  }
})

const collator = new Intl.Collator('en')

function bodyRows() {
  return within(screen.getAllByRole('rowgroup')[1]!).getAllByRole('row')
}

function titles() {
  return bodyRows().map((row) => within(row).getAllByRole('cell')[0]!.textContent!)
}

async function filterBy(user: ReturnType<typeof userEvent.setup>, column: string, option: string) {
  await user.click(screen.getByRole('button', { name: `Filter by ${column}` }))
  await user.click(await screen.findByRole('checkbox', { name: option }))
  await user.keyboard('{Escape}')
}

describe('a table people sort and filter', () => {
  it('announces the sort on the sorted header only', async () => {
    const user = userEvent.setup()
    render(<TablePeopleSort works={rows} />)
    expect(screen.getByRole('columnheader', { name: /Updated/ }).getAttribute('aria-sort')).toBe('descending')
    expect(screen.getByRole('columnheader', { name: /Title/ }).hasAttribute('aria-sort')).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Title' }))
    expect(screen.getByRole('columnheader', { name: /Title/ }).getAttribute('aria-sort')).toBe('ascending')
    expect(screen.getByRole('columnheader', { name: /Updated/ }).hasAttribute('aria-sort')).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Title' }))
    expect(screen.getByRole('columnheader', { name: /Title/ }).getAttribute('aria-sort')).toBe('descending')
  })

  it('keeps one order across the pages when paging', async () => {
    const user = userEvent.setup()
    render(<TablePeopleSort works={rows} />)
    await user.click(screen.getByRole('button', { name: 'Title' }))
    const pageOne = titles()
    expect(pageOne).toEqual([...pageOne].sort(collator.compare))
    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    const pageTwo = titles()
    expect(pageTwo).toEqual([...pageTwo].sort(collator.compare))
    // Page two continues where page one stopped.
    expect(collator.compare(pageOne.at(-1)!, pageTwo[0]!)).toBeLessThanOrEqual(0)
    expect(screen.getByRole('columnheader', { name: /Title/ }).getAttribute('aria-sort')).toBe('ascending')
  })

  it('puts works nobody has judged last, whichever way the score points', async () => {
    const user = userEvent.setup()
    render(<TablePeopleSort works={rows} />)
    await user.click(screen.getByRole('button', { name: 'Score' }))
    await user.click(screen.getByRole('button', { name: 'Score' }))
    expect(screen.getByRole('columnheader', { name: /Score/ }).getAttribute('aria-sort')).toBe('descending')
    expect(within(bodyRows()[0]!).queryByText('Not judged')).toBeNull()
  })

  it('narrows by kind and by stage together', async () => {
    const user = userEvent.setup()
    render(<TablePeopleSort works={rows} />)
    await filterBy(user, 'kind', 'Song')
    await filterBy(user, 'stage', 'Draft')
    expect(bodyRows().length).toBeGreaterThan(0)
    for (const row of bodyRows()) {
      const cells = within(row).getAllByRole('cell')
      expect(cells[1]!.textContent).toBe('Song')
      expect(cells[2]!.textContent).toBe('Draft')
    }
    expect(screen.getByRole('button', { name: 'Filter by kind' }).hasAttribute('data-active')).toBe(true)
  })

  it('says when a filter hides everything, and offers the way back', async () => {
    const user = userEvent.setup()
    // No clips at all, so asking for clips hides every row - one filter, so
    // the test is about the empty table rather than about two popovers.
    const none = rows.filter((row) => row.kind !== 'clip')
    render(<TablePeopleSort works={none} />)
    await filterBy(user, 'kind', 'Clip')
    expect(screen.getByText('No works match these filters.')).toBeDefined()
    // The heading is still there; the table did not vanish.
    expect(screen.getByRole('columnheader', { name: /Title/ })).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Clear the filters' }))
    expect(screen.queryByText('No works match these filters.')).toBeNull()
    expect(titles()).toHaveLength(Math.min(none.length, 5))
  })

  it('returns to page one when a filter changes', async () => {
    const user = userEvent.setup()
    render(<TablePeopleSort works={rows} />)
    await user.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe('page')
    await filterBy(user, 'kind', 'Song')
    expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page')
  })

  it('returns to page one when the page size changes', async () => {
    const user = userEvent.setup()
    render(<TablePeopleSort works={rows} />)
    await user.click(screen.getByRole('button', { name: 'Page 3' }))
    await user.click(screen.getByRole('combobox', { name: 'Rows per page' }))
    await user.click(await screen.findByRole('option', { name: '10' }))
    expect(titles()).toHaveLength(10)
    expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByText('1-10 of 36')).toBeDefined()
  })

  it('right-aligns the score column, heading and cells', () => {
    render(<TablePeopleSort works={rows} />)
    expect(screen.getByRole('button', { name: 'Score' }).className).toContain('justify-end')
    const cell = within(bodyRows()[0]!).getAllByRole('cell')[5]!
    expect(cell.className).toContain('text-right')
  })

  it('passes axe with rows on screen', async () => {
    await expectNoA11yViolations(<TablePeopleSort works={rows} />)
  })

  it('passes axe with no rows', async () => {
    await expectNoA11yViolations(<TablePeopleSort works={[]} />)
  })
})
