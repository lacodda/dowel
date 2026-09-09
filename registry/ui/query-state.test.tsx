// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { EmptyState } from './empty-state'
import { QueryState } from './query-state'

/*
 * QueryState.
 *
 * The component is an order of cases, so that is what the tests are: which one
 * wins when two are true at once. Every combination here is one a real screen
 * reaches - a refetch that fails, a filter that empties a list that also
 * failed - and getting the order wrong shows the reader the wrong thing
 * without ever throwing.
 */

const Content = () => <p>the content</p>

describe('which case wins', () => {
  it('shows the placeholder while pending', () => {
    render(
      <QueryState pending>
        <Content />
      </QueryState>,
    )
    expect(screen.queryByText('the content')).toBeNull()
  })

  it('prefers pending over an error', () => {
    // A refetch after a failure: something is happening again, and saying so
    // is more useful than repeating a failure that is being retried.
    render(
      <QueryState pending error={{ message: 'nope' }}>
        <Content />
      </QueryState>,
    )
    expect(screen.queryByText('nope')).toBeNull()
  })

  it('prefers an error over empty', () => {
    // "Nothing found" for a request that failed is a lie: nothing is missing,
    // something broke.
    render(
      <QueryState error={{ message: 'nope' }} empty emptyState={<p>nothing here</p>}>
        <Content />
      </QueryState>,
    )
    expect(screen.getByText('nope')).toBeDefined()
    expect(screen.queryByText('nothing here')).toBeNull()
  })

  it('shows empty only once something has arrived', () => {
    render(
      <QueryState empty emptyState={<p>nothing here</p>}>
        <Content />
      </QueryState>,
    )
    expect(screen.getByText('nothing here')).toBeDefined()
    expect(screen.queryByText('the content')).toBeNull()
  })

  it('shows the content when nothing is wrong', () => {
    render(
      <QueryState>
        <Content />
      </QueryState>,
    )
    expect(screen.getByText('the content')).toBeDefined()
  })

  it('shows the content when empty is true and there is no empty screen', () => {
    // A caller that says `empty` without saying what to draw for it gets the
    // children rather than a blank - it is not the component's place to
    // invent a sentence.
    render(
      <QueryState empty>
        <Content />
      </QueryState>,
    )
    expect(screen.getByText('the content')).toBeDefined()
  })
})

describe('what it takes, and what it does not', () => {
  it('takes an error object with a message', () => {
    render(
      <QueryState error={{ message: 'the server said no' }}>
        <Content />
      </QueryState>,
    )
    expect(screen.getByText('the server said no')).toBeDefined()
  })

  it('takes a plain string too', () => {
    render(
      <QueryState error="the server said no">
        <Content />
      </QueryState>,
    )
    expect(screen.getByText('the server said no')).toBeDefined()
  })

  it('never prints the message twice', () => {
    // With a title given, the message moves to the body; without one, it is
    // the title. Either way it is shown once and never lost.
    render(
      <QueryState error="the server said no" errorLabels={{ title: 'Could not load' }}>
        <Content />
      </QueryState>,
    )
    expect(screen.getByText('Could not load')).toBeDefined()
    expect(screen.getAllByText('the server said no')).toHaveLength(1)
  })

  it('hands the message to a caller that draws its own screen', () => {
    render(
      <QueryState error={{ message: 'boom' }} errorState={(message) => <p>caught: {message}</p>}>
        <Content />
      </QueryState>,
    )
    expect(screen.getByText('caught: boom')).toBeDefined()
  })

  it('takes a shape for the placeholder', () => {
    render(
      <QueryState pending skeleton={<p data-testid="card">a card</p>}>
        <Content />
      </QueryState>,
    )
    expect(screen.getByTestId('card')).toBeDefined()
  })
})

describe('what it says to a screen reader', () => {
  it('marks the region busy while pending, and not otherwise', () => {
    // Said once, on the region - which is why the Skeletons inside are
    // `aria-hidden`.
    const pending = render(
      <QueryState pending>
        <Content />
      </QueryState>,
    )
    expect(pending.container.firstElementChild?.getAttribute('aria-busy')).toBe('true')
    pending.unmount()

    const done = render(
      <QueryState>
        <Content />
      </QueryState>,
    )
    expect(done.container.firstElementChild?.hasAttribute('aria-busy')).toBe(false)
  })

  it('passes axe in every state', async () => {
    const pending = await expectNoA11yViolations(
      <QueryState pending>
        <Content />
      </QueryState>,
    )
    pending.unmount()

    const failed = await expectNoA11yViolations(
      <QueryState error="nope" errorLabels={{ title: 'Could not load' }}>
        <Content />
      </QueryState>,
    )
    failed.unmount()

    await expectNoA11yViolations(
      <QueryState empty emptyState={<EmptyState title="Nothing yet" />}>
        <Content />
      </QueryState>,
    )
  })
})
