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
    // The subpath first: a string alias also matches `dowel-ui/...` as a
    // prefix, and would send it into the index file.
    alias: {
      'dowel-ui/marks': new URL('./packages/dowel/src/marks.ts', import.meta.url).pathname,
      'dowel-ui': new URL('./packages/dowel/src/index.ts', import.meta.url).pathname,
    },
    // A ceiling on workers, because the default is one per core and every one
    // of them carries its own jsdom and its own axe. On a sixteen-core machine
    // that starved the axe checks until they hit the five-second timeout, and
    // the suite went red without a single component being wrong - a gate that
    // reports the load on the machine rather than the state of the code. Four
    // also finishes sooner than sixteen (81s against 146s): past this point
    // the workers are competing for the same cores, not using more of them.
    maxWorkers: 4,
    // The browser the palette checks need, run once before the workers start
    // rather than beside them - see the file for why.
    globalSetup: ['tests/browser.setup.ts'],
  },
})
