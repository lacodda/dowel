// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { startDraft, stepDraft, useFieldDraft, type DraftEvent, type DraftState } from './field-draft'

/*
 * FieldDraft.
 *
 * Each rule in the file's comment was broken somewhere before it was written
 * down, so each has a test that names the break it prevents. The pure step
 * carries the rules; the hook tests check that the wiring does not lose them.
 */

function run(stored: string, events: DraftEvent[]): { state: DraftState; commits: string[] } {
  let state = startDraft(stored)
  const commits: string[] = []
  for (const event of events) {
    const next = stepDraft(state, event)
    state = next.state
    if (next.commit !== null) commits.push(next.commit)
  }
  return { state, commits }
}

describe('stepDraft', () => {
  it('writes nothing when a field is left unchanged', () => {
    // Tabbing through twelve fields was twelve operations and twelve toasts.
    expect(run('120', [{ type: 'focus' }, { type: 'leave' }]).commits).toEqual([])
  })

  it('writes what was typed when it is left', () => {
    expect(run('120', [{ type: 'focus' }, { type: 'type', text: '128' }, { type: 'leave' }]).commits).toEqual(['128'])
  })

  it('writes nothing when typing ends where it started', () => {
    const events: DraftEvent[] = [
      { type: 'focus' },
      { type: 'type', text: '12' },
      { type: 'type', text: '120' },
      { type: 'leave' },
    ]
    expect(run('120', events).commits).toEqual([])
  })

  it('follows the stored value while nobody is typing', () => {
    // A value a plugin wrote kept showing the old one, and the next blur
    // wrote the old one back.
    expect(run('120', [{ type: 'stored', value: '96' }]).state.draft).toBe('96')
  })

  it('keeps the words of someone typing when the stored value moves', () => {
    const { state, commits } = run('120', [
      { type: 'focus' },
      { type: 'type', text: '128' },
      { type: 'stored', value: '96' },
      { type: 'leave' },
    ])
    expect(commits).toEqual(['128'])
    expect(state.stored).toBe('96')
  })

  it('puts back what is stored on Escape and writes nothing', () => {
    const { state, commits } = run('120', [{ type: 'focus' }, { type: 'type', text: '999' }, { type: 'escape' }])
    expect(state.draft).toBe('120')
    expect(commits).toEqual([])
  })

  it('marks a refusal and clears it at the next keystroke', () => {
    const refused = run('1:00', [{ type: 'focus' }, { type: 'type', text: '1:75' }, { type: 'refuse' }])
    expect(refused.state.invalid).toBe(true)
    expect(refused.state.draft).toBe('1:75')
    const typed = stepDraft(refused.state, { type: 'type', text: '1:15' })
    expect(typed.state.invalid).toBe(false)
  })
})

function Probe({
  initial = '120',
  onCommit,
  readable,
}: {
  initial?: string
  onCommit: (text: string) => boolean | void
  readable?: (text: string) => boolean
}) {
  const [stored, setStored] = useState(initial)
  const draft = useFieldDraft(
    stored,
    (text) => {
      const answer = onCommit(text)
      if (answer !== false) setStored(text)
      return answer
    },
    { readable },
  )
  return (
    <>
      <input aria-label="BPM" {...draft} />
      <button type="button" onClick={() => setStored('96')}>
        plugin
      </button>
    </>
  )
}

const box = () => screen.getByRole('textbox', { name: 'BPM' }) as HTMLInputElement

describe('useFieldDraft', () => {
  it('commits on Enter, once', async () => {
    const onCommit = vi.fn()
    render(<Probe onCommit={onCommit} />)
    await userEvent.clear(box())
    await userEvent.type(box(), '128{Enter}')
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('128')
    expect(document.activeElement).not.toBe(box())
  })

  it('commits on leaving', async () => {
    const onCommit = vi.fn()
    render(<Probe onCommit={onCommit} />)
    await userEvent.clear(box())
    await userEvent.type(box(), '128')
    await userEvent.tab()
    expect(onCommit).toHaveBeenCalledWith('128')
  })

  it('puts the stored text back on Escape', async () => {
    const onCommit = vi.fn()
    render(<Probe onCommit={onCommit} />)
    await userEvent.type(box(), '9{Escape}')
    expect(box().value).toBe('120')
    await userEvent.tab()
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('does not let Escape reach the screen behind it', async () => {
    const onScreenEscape = vi.fn()
    render(
      <div onKeyDown={(event) => event.key === 'Escape' && onScreenEscape()}>
        <Probe onCommit={() => {}} />
      </div>,
    )
    await userEvent.type(box(), '9{Escape}')
    expect(onScreenEscape).not.toHaveBeenCalled()
  })

  it('goes back to the stored text when the commit is refused', async () => {
    render(<Probe onCommit={() => false} />)
    await userEvent.type(box(), '9{Enter}')
    expect(box().value).toBe('120')
  })

  it('shows a value written underneath it', async () => {
    render(<Probe onCommit={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'plugin' }))
    expect(box().value).toBe('96')
  })

  it('keeps unreadable text on Enter, marked invalid, and never commits it', async () => {
    const onCommit = vi.fn()
    render(<Probe onCommit={onCommit} readable={(text) => /^\d+$/.test(text)} />)
    await userEvent.type(box(), 'x{Enter}')
    expect(box().value).toBe('120x')
    expect(box().getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(box())
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('goes back to the stored text when unreadable text is left behind', async () => {
    const onCommit = vi.fn()
    render(<Probe onCommit={onCommit} readable={(text) => /^\d+$/.test(text)} />)
    await userEvent.type(box(), 'x')
    await userEvent.tab()
    expect(box().value).toBe('120')
    expect(box().hasAttribute('aria-invalid')).toBe(false)
    expect(onCommit).not.toHaveBeenCalled()
  })
})
