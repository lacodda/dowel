import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  // `docs` is its own Astro project with its own toolchain.
  { ignores: ['**/dist', 'docs'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
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
