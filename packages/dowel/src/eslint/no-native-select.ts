import type { Rule } from 'eslint'

/*
 * `no-native-select` - the oldest convention in the line, from atlas.
 *
 * A `<select>` cannot be made to look like the rest of an application. The
 * browser draws its popup itself, in the operating system's chrome, with the
 * operating system's fonts and spacing - and no amount of CSS reaches inside
 * it. On a screen where every other control is the product's own, the one
 * native dropdown reads as a foreign object, and on Windows it reads as a
 * foreign object from 1998.
 *
 * So the rule is about the element, not about a name: `Select` from this set
 * renders `<button role="combobox">` and no `<select>` at all, which is what
 * the convention was always asking for.
 *
 * `<option>` and `<optgroup>` are reported too. They exist only inside a
 * `<select>`, so one appearing on its own is either a `<select>` being
 * assembled somewhere else or a misunderstanding - both worth saying out loud.
 */

const NATIVE = new Set(['select', 'option', 'optgroup'])

const MESSAGE =
  'A native `<{{name}}>` cannot be styled to match the rest of the application - ' +
  'the browser draws its popup in the operating system chrome. Use the Select or ' +
  'Combobox component instead.'

export const noNativeSelect: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid the native `<select>` element, which cannot be styled to match the product.',
      url: 'https://lacodda.github.io/dowel/guides/linting/',
    },
    schema: [],
    messages: { native: MESSAGE },
  },
  create(context) {
    return {
      // `JSXOpeningElement` is not in ESLint's own AST types - the JSX nodes
      // come from the TypeScript parser - so the visitor is declared by name
      // and the node is read structurally.
      JSXOpeningElement(node: Rule.Node) {
        const name = (node as unknown as { name?: { type?: string; name?: string } }).name
        // A lower-case identifier is an HTML tag; `<Select>` is a component,
        // and a member expression like `<Base.Select>` is somebody's namespace.
        if (name?.type !== 'JSXIdentifier' || typeof name.name !== 'string') return
        if (!NATIVE.has(name.name)) return

        context.report({ node, messageId: 'native', data: { name: name.name } })
      },
    } as Rule.RuleListener
  },
}
