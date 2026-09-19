// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar, AvatarGroup, initialsOf } from './avatar'
import { expectNoA11yViolations } from '../../tests/a11y'

describe('initialsOf', () => {
  it('takes the first and the last word, not the first of every word', () => {
    // A middle name has no business on a tile eight pixels wide.
    expect(initialsOf('Ada Byron Lovelace')).toBe('AL')
  })

  it('treats a hyphenated name as one word', () => {
    // Splitting on punctuation is the version everyone writes, and it turns
    // one surname into two letters that are not the person's.
    expect(initialsOf('Anne-Marie Dubois')).toBe('AD')
  })

  it('gives a single word two letters', () => {
    // One letter is a smaller difference between two people than the tile is
    // wide.
    expect(initialsOf('Prince')).toBe('PR')
  })

  it('does not cut a character in half', () => {
    // `charAt` on a name outside the basic plane returns half a surrogate
    // pair, and the tile shows a replacement glyph.
    expect(initialsOf('𝒜da Lovelace')).toBe('𝒜L')
    expect(initialsOf('😀 Smith')).toBe('😀S')
  })

  it('raises case once, at the end', () => {
    expect(initialsOf('ada lovelace')).toBe('AL')
  })

  it('has nothing to say about an empty name', () => {
    expect(initialsOf('   ')).toBe('')
  })
})

describe('Avatar', () => {
  it('announces the person once', () => {
    // The picture carries `alt=""` so the name comes from the tile and not
    // from both.
    const { container } = render(<Avatar name="Ada Lovelace" src="https://example.test/a.png" />)
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeDefined()
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
  })

  it('falls back to initials when there is no picture', () => {
    render(<Avatar name="Ada Lovelace" />)
    expect(screen.getByText('AL')).toBeDefined()
  })

  it('falls back to initials when the picture fails to load', () => {
    // The common case, not the odd one: profile links expire, and without
    // this the tile shows a broken-image glyph over the letters it replaced.
    const { container } = render(<Avatar name="Ada Lovelace" src="https://example.test/gone.png" />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()

    fireEvent.error(img!)

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('AL')).toBeDefined()
  })

  it('takes a fallback of its own for a thing that is not a person', () => {
    render(<Avatar name="dowel" fallback={<svg data-testid="mark" />} />)
    expect(screen.getByTestId('mark')).toBeDefined()
    expect(screen.queryByText('DO')).toBeNull()
  })

  it('carries no colour outside the vocabulary', () => {
    // In particular no hue derived from the name: a face is not `--bad`, and a
    // hash into a palette collides with the status vocabulary.
    const { container } = render(<Avatar name="Ada Lovelace" />)
    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('bg-soft')
    expect(className).not.toMatch(/\bdark:/)
    expect(className).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(<Avatar name="Ada Lovelace" className="rounded-none" />)
    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('rounded-none')
    expect(className).not.toContain('rounded-full')
  })

  it('passes the accessibility gate', async () => {
    await expectNoA11yViolations(<Avatar name="Ada Lovelace" />)
  })
})

describe('AvatarGroup', () => {
  const people = [
    { name: 'Ada Lovelace' },
    { name: 'Alan Turing' },
    { name: 'Grace Hopper' },
    { name: 'Edsger Dijkstra' },
    { name: 'Barbara Liskov' },
  ]

  it('shows the count of the ones it did not draw', () => {
    render(<AvatarGroup people={people} max={3} />)
    expect(screen.getByText('+2')).toBeDefined()
    expect(screen.getAllByRole('img')).toHaveLength(3)
  })

  it('says nothing about a remainder there is none of', () => {
    render(<AvatarGroup people={people.slice(0, 2)} max={3} />)
    expect(screen.queryByText(/^\+/)).toBeNull()
  })

  it('paints the first face on top of the second', () => {
    // Later siblings paint over earlier ones by default, which would put the
    // last face over the first. The eye reads left to right and expects the
    // leftmost tile whole.
    const { container } = render(<AvatarGroup people={people} max={3} />)
    const tiles = [...container.querySelectorAll('[role="img"]')] as HTMLElement[]
    const depth = tiles.map((tile) => Number(tile.style.zIndex))
    // Strictly falling: the leftmost tile is painted over every one after it.
    expect(depth).toEqual([...depth].sort((left, right) => right - left))
    expect(new Set(depth).size).toBe(depth.length)
  })

  it('puts the count behind every face', () => {
    const { container } = render(<AvatarGroup people={people} max={2} />)
    const count = screen.getByText('+3') as HTMLElement
    const first = container.querySelector('[role="img"]') as HTMLElement
    expect(Number(count.style.zIndex)).toBeLessThan(Number(first.style.zIndex))
  })

  it('does not name the count as a person', () => {
    // There is nobody behind `+3`, so it is text rather than a labelled image.
    render(<AvatarGroup people={people} max={2} />)
    expect(screen.getAllByRole('img')).toHaveLength(2)
  })

  it('names the row when the product gives it a name', () => {
    render(<AvatarGroup people={people} max={2} label="Assignees" />)
    expect(screen.getByRole('group', { name: 'Assignees' })).toBeDefined()
  })

  it('passes the accessibility gate', async () => {
    await expectNoA11yViolations(<AvatarGroup people={people} max={3} label="Assignees" />)
  })
})
