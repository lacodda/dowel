/*
 * `node tools/import-marks.mjs <masters>` - take the line's marks in.
 *
 * The masters are drawn by the brand-line generator, which lives outside this
 * repository. A build must not reach into it, so the files are copied here by
 * hand when a mark changes or a product is added, and committed: from then on
 * `assets/marks/` is what the package ships and what `src/marks.ts` is
 * generated from.
 */
import { copyFileSync, readdirSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderMarksModule } from './marks-module.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = process.argv[2]
if (!source) {
  console.error('usage: node tools/import-marks.mjs <directory of *-L.svg, *-M.svg, *-S.svg masters>')
  process.exit(1)
}

const target = resolve(root, 'assets/marks')
rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })
const masters = readdirSync(source).filter((file) => /-[LMS]\.svg$/.test(file))
for (const file of masters) copyFileSync(resolve(source, file), resolve(target, file))

writeFileSync(resolve(root, 'packages/dowel/src/marks.ts'), renderMarksModule(target))
console.log(`marks: ${masters.length} masters, ${masters.length / 3} marks`)
