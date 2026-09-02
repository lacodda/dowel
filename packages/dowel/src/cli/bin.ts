#!/usr/bin/env node
import { run } from './index.js'

/*
 * The executable. Deliberately three lines: everything worth testing lives in
 * `index.ts` and returns an exit code instead of calling `process.exit`, so a
 * test can run a whole command without the runner exiting underneath it.
 */

process.exitCode = run(process.argv.slice(2))
