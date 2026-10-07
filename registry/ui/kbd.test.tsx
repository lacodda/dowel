// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Kbd, keyLabel } from './kbd'

describe('Kbd', () => {
  it('is a kbd element, so it is announced as keyboard input', () => {
    // Not a styled span: a screen reader would otherwise read a stray capital
    // letter with no idea it is a key.
    const { container } = render(<Kbd>K</Kbd>)
    expect(container.querySelector('kbd')).not.toBeNull()
  })

  it('reads the notation a command is bound with', () => {
    // One string for the binding and the hint, so they cannot disagree.
    const { container } = render(<Kbd keys="mod+shift+p" />)
    expect([...container.querySelectorAll('kbd')].map((key) => key.textContent)).toEqual(['Ctrl', 'Shift', 'P'])
  })

  it('draws a sequence as steps, with a mark between them', () => {
    // G-then-D drawn like G-with-D would teach the wrong gesture, and two
    // sequences side by side read as one of four steps without the mark - the
    // stand showed it.
    const { container } = render(<Kbd keys="G D" />)
    const steps = container.querySelectorAll('[data-step]')
    expect(steps).toHaveLength(2)
    expect(steps[0]!.textContent).toBe('G')
    expect(steps[1]!.textContent).toBe('D')
    const mark = steps[0]!.nextElementSibling!
    expect(mark.textContent).toBe('›')
    // Drawn, not read: a reader hears the keys.
    expect(mark.getAttribute('aria-hidden')).toBe('true')
  })

  it('draws no mark inside one step', () => {
    const { container } = render(<Kbd keys="Mod+Shift+K" />)
    expect(container.textContent).toBe('CtrlShiftK')
  })

  it('draws a character as the character', () => {
    const { container } = render(<Kbd keys="?" />)
    expect(container.textContent).toBe('?')
  })

  it('refuses a shortcut it cannot read, rather than drawing a guess', () => {
    expect(() => render(<Kbd keys="Shift+/" />)).toThrow()
  })
})

describe('keyLabel', () => {
  it('writes the modifier the way this platform does', () => {
    // The reason this exists: `Ctrl+K` is simply wrong on a Mac, and every
    // product either hard-codes one of them or writes the branch again.
    expect(keyLabel('Mod', true)).toBe('⌘')
    expect(keyLabel('Mod', false)).toBe('Ctrl')
    expect(keyLabel('Ctrl', true)).toBe('⌃')
    expect(keyLabel('Alt', true)).toBe('⌥')
    expect(keyLabel('Alt', false)).toBe('Alt')
  })

  it('writes the keys that look the same everywhere, the same everywhere', () => {
    for (const apple of [true, false]) {
      expect(keyLabel('Enter', apple)).toBe('↵')
      expect(keyLabel('Escape', apple)).toBe('Esc')
      expect(keyLabel('ArrowUp', apple)).toBe('↑')
    }
  })

  it('leaves an ordinary key alone', () => {
    expect(keyLabel('K', true)).toBe('K')
    expect(keyLabel('F5', false)).toBe('F5')
  })
})

describe('Kbd, for a reader', () => {
  it('passes axe as a single key', async () => {
    await expectNoA11yViolations(<Kbd>K</Kbd>)
  })

  it('passes axe as a shortcut of several keys, and as a sequence', async () => {
    // Not interactive - nothing to press, only whether a row of `<kbd>`
    // elements reads cleanly.
    const { unmount } = await expectNoA11yViolations(<Kbd keys="Mod+K" />)
    unmount()
    await expectNoA11yViolations(<Kbd keys="G D" />)
  })
})
