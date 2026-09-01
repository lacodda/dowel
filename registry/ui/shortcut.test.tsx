// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { isTypingTarget, matchesShortcut, useShortcut } from './shortcut'

/*
 * Shortcut.
 *
 * Two questions, and the tests are about the ways each is got wrong.
 *
 * "Is this the shortcut?" is wrong when it is loose: `Mod+K` firing on
 * `Mod+Shift+K` steals a different command, and a bare `K` firing while
 * Control is held steals every shortcut that starts with one. So the match is
 * pinned in both directions - what must fire, and what must not.
 *
 * "Is now a moment to act on it?" is wrong when the answer is always yes. A
 * shortcut that fires into a field someone is typing in is the bug this hook
 * exists to prevent, so all three kinds of field are held here, and so is the
 * opt-out for the shortcut that belongs to the field itself.
 */

/** A keydown as the DOM would deliver it, aimed at `target`. */
function press(
  key: string,
  { target = document.body, ...modifiers }: Partial<KeyboardEventInit> & { target?: Element } = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers })
  target.dispatchEvent(event)
  return event
}

/** A component that does nothing but bind, so a test can mount and unmount
 * the binding rather than the drawing. */
function Bound({
  shortcut,
  onPress,
  ...options
}: {
  shortcut: string[]
  onPress: (event: KeyboardEvent) => void
  enabled?: boolean
  whileTyping?: boolean
}) {
  useShortcut(shortcut, onPress, options)
  return null
}

describe('matchesShortcut', () => {
  it('fires on the keystroke it is written as', () => {
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), ['Mod', 'K'])).toBe(
      true,
    )
  })

  it('reads Mod as either Control or Command', () => {
    // The half a product forgets: hard-coding `ctrlKey` leaves the shortcut
    // dead on every Mac, and hard-coding `metaKey` leaves it dead everywhere
    // else. `Mod` is whichever one the machine sends.
    for (const modifier of ['ctrlKey', 'metaKey'] as const) {
      expect(
        matchesShortcut(new KeyboardEvent('keydown', { key: 'k', [modifier]: true }), ['Mod', 'K']),
        `\`Mod\` did not match ${modifier}`,
      ).toBe(true)
    }
  })

  it('does not care how the shortcut is capitalised', () => {
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), ['mod', 'k'])).toBe(
      true,
    )
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'K', ctrlKey: true }), ['Mod', 'K'])).toBe(
      true,
    )
  })

  it('refuses a modifier the shortcut did not ask for', () => {
    // `Mod+Shift+K` is usually a different command entirely - "open in a new
    // window" next to "open" - and a loose match runs the wrong one.
    expect(
      matchesShortcut(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, shiftKey: true }), [
        'Mod',
        'K',
      ]),
      'Mod+Shift+K ran the Mod+K command',
    ).toBe(false)
    expect(
      matchesShortcut(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, altKey: true }), [
        'Mod',
        'K',
      ]),
    ).toBe(false)
  })

  it('refuses a bare key while a modifier is held', () => {
    // The other direction, and the one that is easier to miss: a bare `K`
    // that matches `Ctrl+K` swallows every shortcut in the application whose
    // letter it shares.
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'k' }), ['K'])).toBe(true)
    expect(
      matchesShortcut(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), ['K']),
      'a bare K fired on Ctrl+K',
    ).toBe(false)
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'k', metaKey: true }), ['K'])).toBe(false)
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'k', shiftKey: true }), ['K'])).toBe(false)
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'k', altKey: true }), ['K'])).toBe(false)
  })

  it('requires the modifiers it does ask for', () => {
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'k' }), ['Mod', 'K'])).toBe(false)
    expect(
      matchesShortcut(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), ['Mod', 'Shift', 'K']),
    ).toBe(false)
    expect(
      matchesShortcut(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, shiftKey: true }), [
        'Mod',
        'Shift',
        'K',
      ]),
    ).toBe(true)
  })

  it('matches nothing when there is no key to match', () => {
    // A shortcut of modifiers alone would otherwise fire on the modifier
    // being pressed, which is not a shortcut, it is a person reaching.
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }), [])).toBe(
      false,
    )
    expect(matchesShortcut(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }), ['Mod'])).toBe(
      false,
    )
  })
})

describe('isTypingTarget', () => {
  it('knows the three things that own their own keys', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const editable = document.createElement('div')
    // `isContentEditable` is computed from layout, and jsdom does not
    // implement it at all - the property is absent from `HTMLElement`, so
    // `contenteditable="true"` reads back as `undefined` there rather than as
    // `true`. It is defined on the element here instead. What that pins is
    // that the predicate consults the property; that a real browser sets it
    // from the attribute is the browser's promise, not this one's.
    Object.defineProperty(editable, 'isContentEditable', { value: true })

    expect(isTypingTarget(input)).toBe(true)
    expect(isTypingTarget(textarea)).toBe(true)
    expect(isTypingTarget(editable)).toBe(true)
  })

  it('lets everything else through', () => {
    // `toBe(false)`, not falsy: the function says it returns a boolean, and
    // under jsdom `isContentEditable` is missing, so an uncoerced return
    // hands back `undefined` here. A caller writing `=== false` would then be
    // wrong on exactly the engine that renders on a server.
    expect(isTypingTarget(document.createElement('button'))).toBe(false)
    expect(isTypingTarget(document.createElement('div'))).toBe(false)
    expect(isTypingTarget(document.body)).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})

describe('useShortcut', () => {
  it('runs the handler on a match, and not on a near miss', () => {
    const ran: string[] = []
    render(<Bound shortcut={['Mod', 'K']} onPress={() => ran.push('k')} />)

    press('j', { ctrlKey: true })
    press('k', { ctrlKey: true, shiftKey: true })
    expect(ran).toEqual([])

    press('k', { ctrlKey: true })
    expect(ran).toEqual(['k'])
  })

  it('takes the keystroke off the browser', () => {
    // Without this the page also scrolls, or Firefox opens its own search
    // bar over the one that just opened.
    render(<Bound shortcut={['Mod', 'K']} onPress={() => {}} />)

    expect(press('k', { ctrlKey: true }).defaultPrevented).toBe(true)
    expect(press('j', { ctrlKey: true }).defaultPrevented, 'a miss was swallowed too').toBe(false)
  })

  it.each([
    ['an input', () => document.createElement('input')],
    ['a textarea', () => document.createElement('textarea')],
    [
      'something contenteditable',
      () => {
        const node = document.createElement('div')
        Object.defineProperty(node, 'isContentEditable', { value: true })
        return node
      },
    ],
  ])('does not fire into %s', (_what, make) => {
    // The whole point of the helper. `Mod+K` in a text editor means "delete to
    // end of line"; a palette opening on top of that looks like the
    // application misheard, and nobody can describe it afterwards.
    const ran: string[] = []
    const target = make()
    document.body.appendChild(target)
    render(<Bound shortcut={['Mod', 'K']} onPress={() => ran.push('k')} />)

    const event = press('k', { ctrlKey: true, target })
    expect(ran).toEqual([])
    expect(event.defaultPrevented, 'the field lost the keystroke anyway').toBe(false)

    target.remove()
  })

  it('fires into a field when it is told to', () => {
    // For the shortcut that belongs to the field itself - Escape closing the
    // box it is typed in. Never for one that takes the person elsewhere.
    const ran: string[] = []
    const target = document.createElement('input')
    document.body.appendChild(target)
    render(<Bound shortcut={['Escape']} onPress={() => ran.push('esc')} whileTyping />)

    press('Escape', { target })
    expect(ran).toEqual(['esc'])

    target.remove()
  })

  it('binds nothing when it is not enabled', () => {
    const ran: string[] = []
    render(<Bound shortcut={['Mod', 'K']} onPress={() => ran.push('k')} enabled={false} />)

    const event = press('k', { ctrlKey: true })
    expect(ran).toEqual([])
    expect(event.defaultPrevented, 'a disabled shortcut still swallowed the key').toBe(false)
  })

  it('lets go of the document when it goes away', () => {
    // A listener that outlives its component is how a shortcut ends up firing
    // twice on the second visit to a screen, and how it keeps firing on a
    // screen that no longer has the thing it opens.
    const ran: string[] = []
    const { unmount } = render(<Bound shortcut={['Mod', 'K']} onPress={() => ran.push('k')} />)

    press('k', { ctrlKey: true })
    expect(ran).toEqual(['k'])

    unmount()
    const event = press('k', { ctrlKey: true })
    expect(ran, 'the listener outlived the component').toEqual(['k'])
    expect(event.defaultPrevented).toBe(false)
  })

  it('binds once for an inline handler that changes every render', () => {
    // The reason the hook reads its deps the way it does. A caller writing
    // `useShortcut(['Mod','K'], () => …)` passes a new array and a new
    // function on every render; if that rebound each time, the shortcut would
    // still work - it would just also fire twice once two listeners raced.
    const ran: string[] = []
    function Inline({ tick }: { tick: number }) {
      useShortcut(['Mod', 'K'], () => ran.push(`k${tick}`))
      return null
    }
    const { rerender } = render(<Inline tick={1} />)
    rerender(<Inline tick={2} />)
    rerender(<Inline tick={3} />)

    press('k', { ctrlKey: true })
    expect(ran, 'more than one listener was bound').toHaveLength(1)
  })

  it('hands the event to the handler', () => {
    // So a product that has to look at the original keystroke can.
    const seen: KeyboardEvent[] = []
    render(<Bound shortcut={['Mod', 'K']} onPress={(event) => seen.push(event)} />)

    press('k', { metaKey: true })
    expect(seen).toHaveLength(1)
    expect(seen[0]!.metaKey).toBe(true)
  })
})
