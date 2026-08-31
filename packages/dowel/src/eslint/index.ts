import type { ESLint, Linter } from 'eslint'
import { noRawColor } from './no-raw-color.js'

/*
 * The dowel ESLint plugin.
 *
 * One rule, and it enforces the convention the whole system rests on: a
 * component names colours from the vocabulary and never writes one down.
 *
 * It ships from the package rather than the registry because it is not a
 * component - it is not copied into a product and edited there, it is a check
 * every product runs the same way, and it should improve for all of them at
 * once.
 *
 *   import dowel from 'dowel-ui/eslint'
 *
 *   export default [
 *     ...dowel.configs.recommended,
 *   ]
 */

const plugin = {
  meta: { name: 'dowel' },
  rules: { 'no-raw-color': noRawColor },
} satisfies ESLint.Plugin

/** The rule, applied where components live. Scoped to TypeScript sources: the
 * theme is CSS and the build tools are Node, and neither is a component. */
const recommended: Linter.Config[] = [
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { dowel: plugin },
    rules: { 'dowel/no-raw-color': 'error' },
  },
]

/** The plugin, with its config bundled on - the shape flat config expects
 * from a default export. Annotated rather than inferred: the inferred type
 * reaches into ESLint's internals and cannot be written down by a consumer. */
const dowel: ESLint.Plugin & { configs: { recommended: Linter.Config[] } } = Object.assign(plugin, {
  configs: { recommended },
})

export default dowel
export { noRawColor, findRawColor } from './no-raw-color.js'
