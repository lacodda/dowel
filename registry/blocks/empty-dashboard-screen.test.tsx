// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import {
  EmptyDashboardScreen,
  type EmptyDashboardScreenProps,
  type EmptyDashboardScreenWords,
  type FirstStep,
} from './empty-dashboard-screen'

const WORDS: EmptyDashboardScreenWords = {
  steps: 'Getting started',
  progress: (done, total) => `${done} of ${total} done`,
  done: 'done',
  notYet: 'not yet',
  figures: 'What will show here',
}

const STEPS: FirstStep[] = [
  { id: 'account', title: 'Make an account', done: true },
  {
    id: 'work',
    title: 'Start a work',
    description: 'A song, a clip, a cover.',
    done: false,
    action: <button type="button">New work</button>,
  },
  { id: 'version', title: 'Add a version', done: false, action: <button type="button">Add a version</button> },
]

function Screen(props: Partial<EmptyDashboardScreenProps>) {
  return (
    <EmptyDashboardScreen
      title="Welcome"
      steps={STEPS}
      figures={[{ label: 'Works' }, { label: 'Released' }]}
      words={WORDS}
      {...props}
    />
  )
}

const items = () => within(screen.getByRole('list')).getAllByRole('listitem')

describe('EmptyDashboardScreen', () => {
  it('lists the steps in order, each saying whether it is done', () => {
    render(<Screen />)
    expect(items().map((item) => item.textContent)).toEqual([
      'Make an account, done',
      '2Start a work, not yetA song, a clip, a cover.New work',
      '3Add a version, not yet',
    ])
  })

  it('marks the first step not yet done as the current one', () => {
    render(<Screen />)
    expect(items()[1]!.getAttribute('aria-current')).toBe('step')
    expect(items()[0]!.hasAttribute('aria-current')).toBe(false)
    expect(items()[2]!.hasAttribute('aria-current')).toBe(false)
  })

  it('offers one next thing, not every step at once', () => {
    render(<Screen />)
    expect(screen.getByRole('button', { name: 'New work' })).toBeDefined()
    // The third step has an action too; it waits until it is the next one.
    expect(screen.queryByRole('button', { name: 'Add a version' })).toBeNull()
  })

  it('says how far along, in words and on the bar', () => {
    render(<Screen />)
    const bar = screen.getByRole('progressbar', { name: 'Getting started' })
    expect(bar.getAttribute('aria-valuenow')).toBe('1')
    expect(bar.getAttribute('aria-valuemax')).toBe('3')
    expect(screen.getByText('1 of 3 done')).toBeDefined()
  })

  it('draws the figures to come with a dash, never a zero', () => {
    render(<Screen />)
    const figures = screen.getByRole('region', { name: 'What will show here' })
    expect(within(figures).getByText('Works')).toBeDefined()
    expect(within(figures).getAllByText('—')).toHaveLength(2)
    expect(figures.textContent).not.toMatch(/\b0\b/)
  })

  it('leaves the figures out when there are none to show', () => {
    render(<Screen figures={undefined} />)
    expect(screen.queryByRole('region', { name: 'What will show here' })).toBeNull()
  })

  it('has nothing current once every step is done', () => {
    render(<Screen steps={STEPS.map((step) => ({ ...step, done: true }))} />)
    for (const item of items()) expect(item.hasAttribute('aria-current')).toBe(false)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('3 of 3 done')).toBeDefined()
  })

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(<Screen actions={<button type="button">Import</button>} />)
  })
})
