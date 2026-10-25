import { declareValuePlugin, PluginKind } from '@stryker-mutator/api/plugin'

/*
 * A Stryker ignorer: what no unit test should hold is not mutated - class
 * lists above all.
 *
 * A primitive is mostly classes, and Stryker would turn every one of them into
 * an empty string - a mutant no unit test should kill, because a unit test
 * that asserts `rounded-md` is a test of the source text, not of the
 * component. What a class list promises is held elsewhere, and harder: every
 * class compiles (`tests/classes.test.ts`), motion rests (`motion.test.ts`),
 * every ink is a promised pair (`inks.test.ts`), every surface fits its room
 * (`ceilings.test.ts`), and the stand is photographed in both themes. Left in,
 * these mutants would bury the ones that matter - a condition flipped, a
 * handler dropped, a prop ignored - under thousands that do not.
 *
 * Where a string stands decides it, as in `tests/classes.ts`: inside a
 * `className` attribute, an argument of `cn`/`clsx`/`twMerge`, or anywhere in
 * a `cva()` call. A condition inside `cn()` is still mutated - in
 * `cn(open && 'x')` the `open` is logic, only the `'x'` is a class.
 *
 * And the text of a console message, which is read by a developer in a
 * console, not by a test.
 */

const JOINERS = new Set(['cn', 'clsx', 'twMerge', 'cva'])

/** A node that can hold classes: a string, or the array or object a `cva()`
 * config holds them in. An object handed to a variants function -
 * `menuPopupVariants({ size })` - is not one: that is a prop being wired,
 * which a test should hold. */
const mayHoldClasses = (path) =>
  path.isStringLiteral() || path.isTemplateLiteral() || path.isArrayExpression() || path.isObjectExpression()

/** Why the string at `path` is a class list, or `undefined` when it is not. */
function classPlace(path) {
  let child = path
  let parent = path.parentPath
  while (parent) {
    const node = parent.node
    if (parent.isArrayExpression() || parent.isJSXExpressionContainer() || parent.isObjectExpression()) {
      // passed through unchanged
    } else if (parent.isObjectProperty()) {
      if (child.node === node.key) return undefined
    } else if (parent.isConditionalExpression()) {
      if (child.node === node.test) return undefined
    } else if (parent.isLogicalExpression()) {
      if (node.operator === '&&' && child.node === node.left) return undefined
    } else if (parent.isJSXAttribute()) {
      return /(^c|C)lassName$/.test(node.name.name) ? 'a className attribute' : undefined
    } else if (parent.isCallExpression()) {
      const callee = node.callee
      if (child.node === callee) return undefined
      if (callee.type === 'Identifier' && JOINERS.has(callee.name)) return `an argument of ${callee.name}()`
      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'console'
      ) {
        return 'a console message'
      }
      return undefined
    } else {
      return undefined
    }
    child = parent
    parent = parent.parentPath
  }
  return undefined
}

const HOOKS_WITH_DEPENDENCIES = new Set(['useEffect', 'useLayoutEffect', 'useMemo', 'useCallback', 'useInsertionEffect'])

/*
 * Two more places where a mutant changes nothing a test could rightly hold:
 *
 * - a hook's dependency array. Emptied, the effect or memo runs once instead
 *   of whenever its inputs change - a real defect, and one the lint rule
 *   `react-hooks/exhaustive-deps` already refuses statically, for every hook,
 *   better than a test written per array could.
 * - the value of a boolean attribute: `setAttribute('data-x', '')`, or
 *   `data-x={on ? '' : undefined}` in JSX, is read by its presence, so `''`
 *   and any other string are the same attribute.
 */
function otherPlace(path) {
  // `data-active={active ? '' : undefined}` - the same, in JSX.
  if (path.isStringLiteral() && path.node.value === '') {
    let up = path.parentPath
    while (up?.isConditionalExpression() || up?.isLogicalExpression() || up?.isJSXExpressionContainer()) up = up.parentPath
    if (up?.isJSXAttribute() && /^data-/.test(up.node.name.name)) return 'the value of a boolean attribute, which is read by its presence'
  }
  const parent = path.parentPath
  if (!parent?.isCallExpression()) return undefined
  const { callee, arguments: args } = parent.node
  if (path.isArrayExpression() && args[1] === path.node) {
    const name = callee.type === 'Identifier' ? callee.name : callee.type === 'MemberExpression' ? callee.property.name : ''
    if (HOOKS_WITH_DEPENDENCIES.has(name)) return `the dependencies of ${name}(), held by react-hooks/exhaustive-deps`
  }
  if (
    path.isStringLiteral() &&
    path.node.value === '' &&
    args[1] === path.node &&
    callee.type === 'MemberExpression' &&
    callee.property.name === 'setAttribute'
  ) {
    return 'the value of a boolean attribute, which is read by its presence'
  }
  return undefined
}

export const strykerPlugins = [
  declareValuePlugin(PluginKind.Ignore, 'not-for-unit-tests', {
    shouldIgnore(path) {
      const other = otherPlace(path)
      if (other !== undefined) return `Not a test's to hold: ${other}.`
      if (!mayHoldClasses(path)) return undefined
      const place = classPlace(path)
      return place === undefined
        ? undefined
        : `A class list (${place}): held by the class, ink, motion and ceiling gates and the stand's pictures, not by unit tests.`
    },
  }),
]
