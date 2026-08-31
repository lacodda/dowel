import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
// dowel lints itself with its own rule: a primitive that wrote a colour down
// would be shipped to every product of the line. It is imported from the
// build, not from `src`, so what checks this repository is the same file a
// consumer installs - and `pnpm lint` after a change to the rule needs a
// `pnpm build` first, exactly as a consumer would need a release.
import dowel from './packages/dowel/dist/eslint/index.js'

export default tseslint.config(
  // `docs` is its own Astro project with its own toolchain.
  { ignores: ['**/dist', 'docs'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  ...dowel.configs.recommended,
  // Where a colour is the subject rather than the styling. `line.ts` is the
  // brand-line registry - the products' own hues, which is where they are
  // supposed to be written down - the rule itself has to name the patterns it
  // forbids, and a test about colour has to write one to have something to
  // check. None of these is a component.
  {
    files: [
      'packages/dowel/src/line.ts',
      'packages/dowel/src/eslint/no-raw-color.ts',
      '**/*.test.{ts,tsx}',
    ],
    rules: { 'dowel/no-raw-color': 'off' },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    files: ['*.config.{js,ts}', 'packages/*/*.config.{js,ts}', 'tools/**/*.mjs', 'tests/**/*.ts', 'packages/*/src/**/*.test.ts'],
    languageOptions: { globals: globals.node },
  },
)
