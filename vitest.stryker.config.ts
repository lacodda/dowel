import { defineConfig } from 'vitest/config'
import base from './vitest.config'

/*
 * The suite Stryker runs against each mutant: the primitives' own tests.
 *
 * Not the gates under `tests/`. They read the source from disk - its classes,
 * its size, its words - and under Stryker the source on disk is the
 * instrumented copy, every mutant compiled in behind a switch: a weight gate
 * would weigh that, a word gate would read it. They also need the browser the
 * root config launches before any worker starts, which no mutant changes.
 */
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: [
      'packages/*/src/**/*.test.{ts,tsx}',
      'registry/**/*.test.{ts,tsx}',
    ],
    globalSetup: [],
    // The pool Stryker runs it on (stryker.config.mjs says why), so a run of
    // this config by hand behaves as the mutation run does.
    pool: 'vmThreads',
  },
})
