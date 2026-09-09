// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './error-boundary'

/*
 * ErrorBoundary.
 *
 * React logs every caught error to the console, on purpose - so a test that
 * throws prints a wall of red that looks like a failure. It is silenced here
 * rather than left, because a suite whose passing output looks broken is a
 * suite nobody reads.
 */

const labels = {
  title: 'Something went wrong',
  body: 'The screen could not be drawn.',
  details: 'Details',
  retry: 'Try again',
}

function Boom({ throws = true }: { throws?: boolean }) {
  if (throws) throw new Error('the render threw')
  return <p>the content</p>
}

let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleError.mockRestore()
})

describe('what it catches', () => {
  it('shows the fallback instead of the crash', () => {
    render(
      <ErrorBoundary labels={labels}>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeDefined()
  })

  it('leaves a working tree alone', () => {
    render(
      <ErrorBoundary labels={labels}>
        <Boom throws={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('the content')).toBeDefined()
  })

  it('keeps the message where whoever files the bug can copy it', () => {
    // The reader cannot fix it, but the reader is who reports it - and a
    // screen that hides the one string worth quoting turns a report into a
    // guess.
    render(
      <ErrorBoundary labels={labels}>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText('the render threw')).toBeDefined()
  })

  it('folds the message away rather than shouting it', () => {
    const { container } = render(
      <ErrorBoundary labels={labels}>
        <Boom />
      </ErrorBoundary>,
    )
    // Evidence, not an instruction: inside a `<details>`, closed.
    const details = container.querySelector('details')
    expect(details).not.toBeNull()
    expect(details?.hasAttribute('open')).toBe(false)
  })

  it('hands the error on to whoever is listening', () => {
    const onError = vi.fn()
    render(
      <ErrorBoundary labels={labels} onError={onError}>
        <Boom />
      </ErrorBoundary>,
    )
    expect(onError).toHaveBeenCalled()
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error)
  })
})

describe('the way out', () => {
  it('clears the error when retried', async () => {
    /* The failure is switched off from outside rather than by a counter in the
     * child.
     *
     * "Throws once, then renders" is the obvious way to write a transient
     * failure and does not work here: React re-runs the whole tree
     * synchronously after a caught error, so the second render already
     * succeeds and the boundary never shows its screen at all. Found by that
     * test failing on `getByText`, not on the retry it meant to check. */
    let failing = true
    const Flaky = () => {
      if (failing) throw new Error('once')
      return <p>the content</p>
    }

    render(
      <ErrorBoundary labels={labels}>
        <Flaky />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeDefined()

    failing = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('the content')).toBeDefined()
  })

  it('clears when the reset key changes', () => {
    // Without this a boundary that has caught once stays caught: the reader
    // navigates away and the crash follows them, because nothing told the
    // boundary the reason had gone.
    const { rerender } = render(
      <ErrorBoundary labels={labels} resetKey="/a">
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeDefined()

    rerender(
      <ErrorBoundary labels={labels} resetKey="/b">
        <Boom throws={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('the content')).toBeDefined()
  })

  it('does not clear on an ordinary re-render', () => {
    // Resetting whenever the parent renders re-runs the throwing child at
    // once, and the screen flickers between the crash and the fallback for as
    // long as the cause is there.
    const { rerender } = render(
      <ErrorBoundary labels={labels} resetKey="/a">
        <Boom />
      </ErrorBoundary>,
    )
    rerender(
      <ErrorBoundary labels={labels} resetKey="/a">
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeDefined()
  })

  it('lets a product draw its own screen, with a way to retry', () => {
    render(
      <ErrorBoundary
        labels={labels}
        fallback={(error, reset) => (
          <div>
            <p>ours: {error.message}</p>
            <button onClick={reset}>reset</button>
          </div>
        )}
      >
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText('ours: the render threw')).toBeDefined()
    expect(screen.getByRole('button', { name: 'reset' })).toBeDefined()
  })
})
