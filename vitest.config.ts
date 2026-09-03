import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

// The stand shows the version it was built from, and Vite substitutes it at
// build time. Under the test runner there is no such build step, so the same
// number is read from the same manifest - rather than pinned to a literal
// here, which would be a second place for the version to live and the exact
// drift the release-consistency gate exists to prevent.
const pkg = new URL('./packages/dowel/package.json', import.meta.url)
const version = JSON.parse(readFileSync(pkg, 'utf8')).version

// Workspace-level runner: package tests and the release-consistency gate
// (added with v0.1.0) run under one command.
export default defineConfig({
  define: {
    __DOWEL_VERSION__: JSON.stringify(version),
  },
  test: {
    // Testing-library unmounts between tests only when it can see the test
    // hooks; without this every render stacks up in the same document and the
    // second `getByRole` finds two buttons.
    globals: true,
    include: [
      'packages/*/src/**/*.test.{ts,tsx}',
      // Registry components live outside the package: they are copied into a
      // product rather than imported from one, but they are tested here.
      'registry/**/*.test.{ts,tsx}',
      'stand/src/**/*.test.{ts,tsx}',
      'tests/**/*.test.ts',
    ],
    // `dowel-ui` is what a copied component imports; here it is the source.
    alias: { 'dowel-ui': new URL('./packages/dowel/src/index.ts', import.meta.url).pathname },
  },
})
