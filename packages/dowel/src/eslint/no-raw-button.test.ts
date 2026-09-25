import { Linter, RuleTester } from 'eslint'
import { describe, expect, it } from 'vitest'
import tseslint from 'typescript-eslint'
import dowel, { noRawButton } from './index.js'

/*
 * The rule that keeps screens on Button.
 *
 * Syntactic, like `no-native-select`, so the test is a list of shapes - and
 * the pair that matters is `<button>` against `<Button>`. The other half is
 * the config: the primitives are made of `<button>`s, so the directory they
 * live in must be left alone, and nothing else may be.
 */

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

ruleTester.run('no-raw-button', noRawButton, {
  valid: [
    { code: 'const a = <Button variant="icon" aria-label="Add" />' },
    { code: 'const a = <RowButton selected>Version 3</RowButton>' },
    { code: 'const a = <Base.Button />' },
    { code: 'const a = <MenuTrigger render={<Button />} />' },
    { code: "const button = 'a'" },
  ],
  invalid: [
    { code: 'const a = <button type="button" className="rounded-full px-2">Clips</button>', errors: 1 },
    // Handed to a primitive as its trigger: still a raw button.
    { code: 'const a = <MenuTrigger render={<button />} />', errors: 1 },
  ],
})

describe('the plugin', () => {
  const linter = new Linter({ configType: 'flat' })
  const config = [
    { languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } } },
    ...dowel.configs.recommended,
  ]
  const lint = (filename: string) =>
    linter
      .verify('const a = <button type="button">x</button>', config, { filename })
      .filter((message) => message.ruleId === 'dowel/no-raw-button')

  it('reports a raw button on a screen', () => {
    expect(lint('src/screens/Catalogue.tsx')).toHaveLength(1)
  })

  it('leaves the primitives alone, which are made of buttons', () => {
    expect(lint('src/components/ui/chip.tsx')).toHaveLength(0)
  })

  it('says what to use instead', () => {
    const message = noRawButton.meta?.messages?.raw ?? ''
    expect(message).toMatch(/Button/)
    expect(message).toMatch(/RowButton/)
    expect(message).toMatch(/type="button"/)
  })
})
