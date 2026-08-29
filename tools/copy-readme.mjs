// One README for every storefront. npm publishes whatever sits next to
// package.json, so the root file is copied in by `prepack` - the step runs for
// a manual `npm publish` as well as for CI, unlike a workflow step would.
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../README.md', import.meta.url))
copyFileSync(root, 'README.md')
