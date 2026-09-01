import { RuleTester } from 'eslint'
import { describe, expect, it } from 'vitest'
import tseslint from 'typescript-eslint'
import dowel, { noNativeSelect } from './index.js'

/*
 * The rule that keeps the browser's own dropdown off the screen.
 *
 * It is a syntactic rule about one element, so the test is mostly a list of
 * shapes that must and must not be reported - and the pair that matters is
 * `<select>` against `<Select>`: the convention is about the native element,
 * never about the name.
 */

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

ruleTester.run('no-native-select', noNativeSelect, {
  valid: [
    // The component. This is the point of the rule existing rather than a
    // ban on a word.
    { code: 'const a = <Select value={v} onValueChange={set} />' },
    { code: 'const a = <Combobox multiple items={items} />' },
    // Somebody's namespace.
    { code: 'const a = <Base.Select.Root />' },
    // Not the element, just a word.
    { code: "const a = <div className=\"select-none\" />" },
    { code: "const select = 'a'" },
    { code: 'const a = <input type="text" />' },
  ],
  invalid: [
    { code: 'const a = <select />', errors: 1 },
    { code: 'const a = <select><option>A</option></select>', errors: 2 },
    { code: 'const a = <optgroup label="x" />', errors: 1 },
    // Attributes do not save it.
    { code: 'const a = <select className="rounded-md" />', errors: 1 },
  ],
})

describe('the plugin', () => {
  it('turns the rule on', () => {
    expect(dowel.configs.recommended[0]?.rules?.['dowel/no-native-select']).toBe('error')
    expect(dowel.rules?.['no-native-select']).toBe(noNativeSelect)
  })

  it('says why, not merely that', () => {
    // A rule that only says "forbidden" gets an exemption written for it. The
    // message has to carry the reason: the browser draws that popup itself.
    const message = noNativeSelect.meta?.messages?.native ?? ''
    expect(message).toMatch(/styled/i)
    expect(message).toMatch(/Select or Combobox/)
  })
})
