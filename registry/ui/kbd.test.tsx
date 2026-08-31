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

  it('writes a shortcut as separate keys', () => {
    const { container } = render(<Kbd keys={['Mod', 'K']} />)
    expect(container.querySelectorAll('kbd')).toHaveLength(2)
  })
})

describe('keyLabel', () => {
  it('writes the modifier the way this platform does', () => {
    // The reason this exists: `Ctrl+K` is simply wrong on a Mac, and every
    // product either hard-codes one of them or writes the branch again.
    expect(keyLabel('Mod', true)).toBe('⌘')
    expect(keyLabel('Mod', false)).toBe('Ctrl')
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

  it('passes axe as a shortcut of several keys', async () => {
    // Not interactive - nothing to press, only whether a row of `<kbd>`
    // elements reads cleanly.
    await expectNoA11yViolations(<Kbd keys={['Mod', 'K']} />)
  })
})
