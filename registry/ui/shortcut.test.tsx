// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  ariaKeyShortcuts,
  formatStroke,
  isTypingTarget,
  keysOf,
  normalizeKeys,
  parseKeys,
  sameStroke,
  strokeOf,
  typesInField,
} from './shortcut'

/*
 * Shortcut.
 *
 * Two questions, and the tests are about the ways each is got wrong.
 *
 * "How is this written?" is wrong when there are two spellings of one key:
 * `Shift+/` and `?`, `Ctrl+K` and `Mod+K` on Windows. Two spellings is two
 * commands on one key with no conflict ever seen, so each pair is held to one
 * spelling here, and the spellings the line refuses are refused out loud.
 *
 * "Which key was that?" is wrong for anyone who does not type in English.
 * The cases below are the keyboards the line's own people use: a Russian
 * layout, where `Ctrl+P` arrives as `з`; a French one, where the number row
 * types `&` under the finger that means 1; a Mac, where Option turns G into ©.
 */

/** A keydown as a browser would build it. Only the fields given are set. */
const key = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init)

describe('the notation', () => {
  it('writes every shortcut one way', () => {
    expect(normalizeKeys('mod+shift+p', false)).toBe('Mod+Shift+P')
    expect(normalizeKeys('Shift+Mod+P', false), 'modifiers have one order').toBe('Mod+Shift+P')
    expect(normalizeKeys('esc', false)).toBe('Escape')
    expect(normalizeKeys('Up', false)).toBe('ArrowUp')
    expect(normalizeKeys('f5', false)).toBe('F5')
    expect(normalizeKeys('Option+G', true)).toBe('Alt+G')
  })

  it('reads a space as the next step of a sequence', () => {
    expect(parseKeys('G D', false)).toHaveLength(2)
    expect(normalizeKeys('g  d', false)).toBe('G D')
  })

  it('has a way to write the plus key, which is also the separator', () => {
    expect(normalizeKeys('Mod++', false)).toBe('Mod++')
    expect(normalizeKeys('Mod+Plus', false)).toBe('Mod++')
    expect(normalizeKeys('+', false)).toBe('+')
  })

  it('folds Ctrl into Mod off an Apple platform, and keeps them apart on one', () => {
    // On Windows the control key is the command key: two spellings of one
    // keystroke would be two commands on it that never show as a conflict.
    expect(normalizeKeys('Ctrl+K', false)).toBe('Mod+K')
    // On a Mac they are different keys - Ctrl+Tab switches tabs where
    // Cmd+Tab belongs to the system.
    expect(normalizeKeys('Ctrl+Tab', true)).toBe('Ctrl+Tab')
    expect(normalizeKeys('Mod+Tab', true)).toBe('Mod+Tab')
  })

  it.each([
    ['Shift+/', 'a character carries its own Shift: `?` is written `?`'],
    ['Shift+1', 'without a command modifier a digit is the character typed'],
    ['Cmd+K', 'there is no Cmd: Mod is command on a Mac'],
    ['Mod+з', 'a letter of another alphabet is found by place, and written in Latin'],
    ['Mod+Escpae', 'a misspelt name is not a key'],
    ['Mod+Mod+K', 'a modifier named twice'],
    ['', 'an empty shortcut'],
    ['   ', 'a shortcut of spaces'],
  ])('refuses `%s` - %s', (written) => {
    expect(() => parseKeys(written, false)).toThrow()
  })

  it('allows Shift with a digit under a command, where the digit is a place', () => {
    expect(normalizeKeys('Mod+Shift+1', false)).toBe('Mod+Shift+1')
  })
})

describe('reading a keystroke', () => {
  const read = (init: KeyboardEventInit, apple = false) => {
    const stroke = strokeOf(key(init), apple)
    return stroke === null ? null : formatStroke(stroke)
  }

  it('reads a letter as the letter', () => {
    expect(read({ key: 'k', code: 'KeyK', ctrlKey: true })).toBe('Mod+K')
    expect(read({ key: 'K', code: 'KeyK', shiftKey: true })).toBe('Shift+K')
  })

  it('reads a letter by its place when the layout does not type Latin', () => {
    // A Russian layout: the key marked P types з. Reading `event.key` here
    // makes every shortcut stop working the moment someone switches language
    // to write a sentence.
    expect(read({ key: 'з', code: 'KeyP', ctrlKey: true })).toBe('Mod+P')
    expect(read({ key: 'п', code: 'KeyG' })).toBe('G')
  })

  it('reads a letter by what it types when the layout types Latin, wherever the key is', () => {
    // A German layout: Z and Y are swapped, and Mod+Z is undo on the key
    // marked Z - which is where KeyY is.
    expect(read({ key: 'z', code: 'KeyY', ctrlKey: true })).toBe('Mod+Z')
  })

  it('reads a character as the character, whichever keys typed it', () => {
    // US: Shift and the slash key. Russian: Shift and 7. The person means the
    // question mark on both.
    expect(read({ key: '?', code: 'Slash', shiftKey: true })).toBe('?')
    expect(read({ key: '?', code: 'Digit7', shiftKey: true })).toBe('?')
  })

  it('reads the number row by place under a command modifier', () => {
    // French: the key that types `&` is the 1, and Mod+1 is pressed there.
    expect(read({ key: '&', code: 'Digit1', ctrlKey: true })).toBe('Mod+1')
    // US: Shift is kept, because Mod+Shift+1 is not Mod+1.
    expect(read({ key: '!', code: 'Digit1', ctrlKey: true, shiftKey: true })).toBe('Mod+Shift+1')
  })

  it('reads punctuation by its place when the layout types a letter there', () => {
    // Russian: the key that types [ on a US layout types х.
    expect(read({ key: 'х', code: 'BracketLeft', ctrlKey: true })).toBe('Mod+[')
    expect(read({ key: 'Х', code: 'BracketLeft', ctrlKey: true, shiftKey: true })).toBe('Mod+{')
  })

  it('reads an Option letter on a Mac by its place', () => {
    expect(read({ key: '©', code: 'KeyG', altKey: true }, true)).toBe('Alt+G')
    expect(read({ key: 'Dead', code: 'KeyE', altKey: true }, true)).toBe('Alt+E')
  })

  it('reads the platform modifiers the platform way', () => {
    expect(read({ key: 'k', code: 'KeyK', metaKey: true }, true)).toBe('Mod+K')
    expect(read({ key: 'k', code: 'KeyK', ctrlKey: true }, true)).toBe('Ctrl+K')
    // Off a Mac the Windows key belongs to the system.
    expect(read({ key: 'k', code: 'KeyK', metaKey: true }, false)).toBeNull()
  })

  it('reads named keys by name, with Shift', () => {
    expect(read({ key: 'Escape', code: 'Escape' })).toBe('Escape')
    expect(read({ key: 'Tab', code: 'Tab', shiftKey: true })).toBe('Shift+Tab')
    expect(read({ key: ' ', code: 'Space' })).toBe('Space')
    expect(read({ key: 'F5', code: 'F5' })).toBe('F5')
  })

  it.each([
    ['a modifier pressed alone', { key: 'Control', code: 'ControlLeft', ctrlKey: true }],
    ['AltGr typing a letter', { key: 'ą', code: 'KeyA', ctrlKey: true, altKey: true, modifierAltGraph: true }],
    ['a key mid-composition', { key: 'k', code: 'KeyK', isComposing: true }],
    ['a key the line cannot read', { key: 'Unidentified', code: '' }],
  ] as const)('is not a shortcut: %s', (_what, init) => {
    expect(read(init as KeyboardEventInit)).toBeNull()
  })

  it('is exact on every modifier, in both directions', () => {
    const [modK] = parseKeys('Mod+K', false)
    expect(sameStroke(modK!, strokeOf(key({ key: 'k', ctrlKey: true }), false)!)).toBe(true)
    expect(sameStroke(modK!, strokeOf(key({ key: 'k', ctrlKey: true, shiftKey: true }), false)!)).toBe(false)
    const [bareK] = parseKeys('K', false)
    expect(sameStroke(bareK!, strokeOf(key({ key: 'k', ctrlKey: true }), false)!)).toBe(false)
    expect(sameStroke(bareK!, strokeOf(key({ key: 'k', altKey: true }), false)!)).toBe(false)
  })

  it('writes a keystroke down for a settings screen recording one', () => {
    expect(keysOf(key({ key: 'з', code: 'KeyP', ctrlKey: true, shiftKey: true }), false)).toBe('Mod+Shift+P')
    expect(keysOf(key({ key: 'Shift', code: 'ShiftLeft', shiftKey: true }), false)).toBeNull()
  })
})

describe('what a field uses', () => {
  it('knows the keys a field types and moves with', () => {
    for (const written of ['K', '?', 'Space', 'Enter', 'Tab', 'ArrowUp', 'Home', 'Backspace', 'Shift+K']) {
      expect(typesInField(parseKeys(written, false)[0]!), written).toBe(true)
    }
  })

  it('knows the keys it does not', () => {
    for (const written of ['Mod+K', 'Alt+ArrowLeft', 'Escape', 'F1', 'Mod+Enter']) {
      expect(typesInField(parseKeys(written, false)[0]!), written).toBe(false)
    }
  })
})

describe('isTypingTarget', () => {
  it('knows the fields that own their keys', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const select = document.createElement('select')
    const search = Object.assign(document.createElement('input'), { type: 'search' })
    for (const element of [input, textarea, select, search]) {
      expect(isTypingTarget(element), element.outerHTML).toBe(true)
    }
  })

  it('knows a word inside an editable paragraph', () => {
    // `target` is the innermost element - the bold word, not the paragraph
    // that was made editable. Asking the element alone misses it.
    const paragraph = document.createElement('p')
    paragraph.setAttribute('contenteditable', 'true')
    const word = document.createElement('b')
    paragraph.append(word)
    document.body.append(paragraph)
    expect(isTypingTarget(word)).toBe(true)
    paragraph.remove()
  })

  it('reads isContentEditable where the engine has it', () => {
    // jsdom does not compute it; a browser does, from the attribute and from
    // the document's design mode alike.
    const editable = document.createElement('div')
    Object.defineProperty(editable, 'isContentEditable', { value: true })
    expect(isTypingTarget(editable)).toBe(true)
  })

  it('lets everything else through, as a boolean', () => {
    // A checkbox holds no text: `?` on a focused checkbox is a question.
    const checkbox = Object.assign(document.createElement('input'), { type: 'checkbox' })
    const off = document.createElement('div')
    off.setAttribute('contenteditable', 'false')
    for (const element of [checkbox, document.createElement('button'), off, document.body]) {
      expect(isTypingTarget(element), element.outerHTML.slice(0, 40)).toBe(false)
    }
    expect(isTypingTarget(null)).toBe(false)
  })
})

describe('ariaKeyShortcuts', () => {
  it('writes the attribute in the platform names', () => {
    expect(ariaKeyShortcuts('Mod+K', false)).toBe('Control+K')
    expect(ariaKeyShortcuts('Mod+K', true)).toBe('Meta+K')
    expect(ariaKeyShortcuts('Mod++', false)).toBe('Control+Plus')
  })

  it('separates alternatives with a space, as the attribute does', () => {
    expect(ariaKeyShortcuts(['Mod+K', 'Mod+P'], false)).toBe('Control+K Control+P')
  })

  it('leaves a sequence out rather than claim its first key alone does it', () => {
    // The attribute reads a space as "or": `G D` written into it would say G
    // on its own runs the command.
    expect(ariaKeyShortcuts('G D', false)).toBeUndefined()
    expect(ariaKeyShortcuts(['G D', '?'], false)).toBe('?')
  })
})
