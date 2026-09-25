import type { Rule } from 'eslint'

/*
 * `no-raw-button` - a screen presses Buttons, not `<button>`s.
 *
 * A raw `<button className="…">` looks like the cheap way to a small control,
 * and it quietly drops everything Button knows: `type="button"`, so it does
 * not submit the form it sits in; the focus ring; the disabled look, and a
 * disabled reason a pointer and a keyboard can reach; the size of an icon
 * inside it; the control row that makes it the height of the field beside it
 * and follows `data-density`. kilna had 95 of them in 42 files, and each one
 * got some of that right and a different some wrong - three sizes of chip,
 * five recipes for the same toggle, a trash row whose reason was dead.
 *
 * The set has a primitive for each shape those buttons were: Button in six
 * variants for an action (`icon` for a glyph, `link` for one that reads as a
 * link), RowButton for a row of a list, Chip with `pressed` for a switch,
 * SegmentedControl for one of a few. Where a primitive wants a trigger it
 * takes `render={<Button />}`.
 *
 * The primitives themselves are made of `<button>`s, so the recommended
 * config leaves the directory a product keeps them in - `ui/` - alone.
 */

const MESSAGE =
  'A raw `<button>` forgets what Button knows: `type="button"`, the focus ring, the disabled look and its ' +
  'reason, the icon size and the control height. Use Button (variants ghost, icon, link, ...), RowButton for a ' +
  'row of a list, Chip with `pressed` for a switch, or `render={<Button />}` where a primitive takes a trigger.'

export const noRawButton: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Forbid the native `<button>` element outside the primitives; screens use Button and its kin.',
      url: 'https://lacodda.github.io/dowel/guides/linting/',
    },
    schema: [],
    messages: { raw: MESSAGE },
  },
  create(context) {
    return {
      // `JSXOpeningElement` is not in ESLint's own AST types - the JSX nodes
      // come from the TypeScript parser - so the visitor is declared by name
      // and the node is read structurally, as in `no-native-select`.
      JSXOpeningElement(node: Rule.Node) {
        const name = (node as unknown as { name?: { type?: string; name?: string } }).name
        // Lower case is the HTML element; `<Button>` is the component and
        // `<Base.Button>` is somebody's namespace.
        if (name?.type !== 'JSXIdentifier' || name.name !== 'button') return
        context.report({ node, messageId: 'raw' })
      },
    } as Rule.RuleListener
  },
}
