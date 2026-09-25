import type { ESLint, Linter } from 'eslint'
import { noArbitraryScale } from './no-arbitrary-scale.js'
import { noImplicitLocale } from './no-implicit-locale.js'
import { noNativeSelect } from './no-native-select.js'
import { noRawButton } from './no-raw-button.js'
import { noRawColor } from './no-raw-color.js'

/*
 * The dowel ESLint plugin.
 *
 * Five rules, and each enforces a convention the system rests on: a
 * component names colours from the vocabulary and never writes one down, no
 * screen uses a native `<select>`, which the browser draws in its own chrome,
 * no date or number is formatted in the browser's language rather than the
 * application's, sizes come from the scale rather than from the eye, and a
 * screen presses Buttons rather than `<button>`s.
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
  rules: {
    'no-raw-color': noRawColor,
    'no-native-select': noNativeSelect,
    'no-implicit-locale': noImplicitLocale,
    'no-arbitrary-scale': noArbitraryScale,
    'no-raw-button': noRawButton,
  },
} satisfies ESLint.Plugin

/** The rules, applied where components live. Scoped to TypeScript sources:
 * the theme is CSS and the build tools are Node, and neither is a component.
 *
 * `no-raw-button` is kept out of `ui/`, the directory a product keeps its
 * primitives in (shadcn's `components/ui`): a primitive is where the one
 * `<button>` a screen should not write gets written, once. */
const recommended: Linter.Config[] = [
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { dowel: plugin },
    rules: {
      'dowel/no-raw-color': 'error',
      'dowel/no-native-select': 'error',
      'dowel/no-implicit-locale': 'error',
      'dowel/no-arbitrary-scale': 'error',
    },
  },
  {
    files: ['**/*.tsx'],
    ignores: ['**/ui/**'],
    plugins: { dowel: plugin },
    rules: {
      'dowel/no-raw-button': 'error',
    },
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
export { noImplicitLocale } from './no-implicit-locale.js'
export { noNativeSelect } from './no-native-select.js'
export { noArbitraryScale, findArbitraryScale, TYPE_STEPS, RADIUS_STEPS } from './no-arbitrary-scale.js'
export { noRawButton } from './no-raw-button.js'
