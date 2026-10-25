/*
 * Mutation testing: whether the tests would notice the code being wrong.
 *
 * A green test proves the code passes it, not that it checks anything. Stryker
 * changes the code one small way at a time - a condition flipped, a branch
 * emptied, a call dropped - and runs the tests that cover the change. A mutant
 * that survives is code no test holds. What survives, and why it may, is the
 * report; `pnpm mutate` writes it to reports/mutation/.
 *
 * Class lists are not mutated, nor the few other things no unit test should
 * hold (`tools/stryker-ignorers.mjs` says why), and the gates under `tests/`
 * are not run (`vitest.stryker.config.ts`).
 */

import { mutable } from './tools/mutation-shard.mjs'

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  // `vmThreads`: each test file still gets a module registry of its own, in a
  // VM context, but not a process of its own. On the default pool every file a
  // mutant touched paid ~4s to start a fork and a jsdom, and the full run was a
  // ten-hour estimate; the suite itself runs in 49s here against 186s.
  // Without isolation at all (`isolate: false`) the suite hangs.
  vitest: { configFile: 'vitest.stryker.config.ts', related: true, pool: 'vmThreads' },
  plugins: ['@stryker-mutator/vitest-runner', './tools/stryker-ignorers.mjs'],
  ignorers: ['not-for-unit-tests'],
  // One list of what is mutated, shared with the CI shards that split it.
  mutate: mutable(),
  // Only what the primitives' tests read is copied into the sandbox: not the
  // documentation, its published registry snapshots, the stand or the demo.
  ignorePatterns: ['docs', 'demo', 'stand', 'assets', 'reports', 'test-results', 'tests/visual'],
  coverageAnalysis: 'perTest',
  // A mutant in code that runs once, as the module loads - a lookup table, a
  // constant built at the top of a file - cannot be traced to the tests that
  // read it, so Stryker runs every test for it. They are a fifth of the
  // mutants (2,312 of 11,792 at v0.40) and made the first full run a
  // forty-hour estimate; they are reported as ignored rather than left out of
  // sight. What they hold is mostly read by the components' render, which the
  // tests that do run exercise.
  ignoreStatic: true,
  // Colours in the report only. What fails a run is a file under its own
  // floor (`tools/mutation-floor.mjs`), not one number for the whole set.
  thresholds: { high: 90, low: 75, break: null },
  // Each mutant is run against the tests that covered its line, and nothing
  // else - which is what makes a run over a hundred primitives finish. A
  // runner on vmThreads is one thread and ~200MB, so most of the machine's
  // cores can each carry one: twelve on a sixteen-core laptop (four of them
  // left the CPU at 23%), three on a CI runner.
  concurrency: '75%',
  timeoutMS: 10_000,
  // The first run is every primitive's tests at once, instrumented and
  // measuring which test covers which line: about twice the three minutes the
  // suite takes on its own, past Stryker's default of five.
  dryRunTimeoutMinutes: 30,
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  clearTextReporter: { allowColor: false, logTests: false, reportScoreTable: true, reportMutants: false },
  // Unchanged code keeps its last result, so a run after a small change takes
  // minutes, not the hour of a full one.
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  tempDirName: '.stryker-tmp',
  cleanTempDir: 'always',
}
