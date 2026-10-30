/*
 * Every form of the theme, from the one source.
 *
 * `theme.css` is written by hand and is the only place a token is defined.
 * Everything else a product reads is generated here, from one model of it,
 * in one run:
 *
 *   tokens.json           the scales, as DTCG JSON, for design tools
 *   accents/<product>.css one declaration per product of the line
 *   palettes/<product>.json  every colour resolved for that product's accent
 *   rust/<product>.rs     the same palette and scales, for a native product
 *
 * Until v0.41 these were three scripts and a fourth form lived in nitid's
 * build script. Three readers of one stylesheet each had their own idea of
 * where it ended and what a token was called; one generator has one.
 *
 *   node tools/build-tokens.mjs          # into packages/dowel/dist
 *   node tools/build-tokens.mjs <dir>    # somewhere else - the tests do
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lineProducts } from '../packages/dowel/src/line.ts'
import { accentCss } from './tokens/accents.mjs'
import { palettes } from './tokens/palettes.mjs'
import { rustModule } from './tokens/rust.mjs'
import { scales } from './tokens/scales.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
// The package's `dist` by default. The tests pass a directory of their own, so
// that no two workers ever write the files a third one is reading.
const outDir = process.argv[2] ? resolve(process.argv[2]) : resolve(root, 'packages/dowel/dist')

const css = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')
const version = JSON.parse(readFileSync(resolve(root, 'packages/dowel/package.json'), 'utf8')).version

/** A directory of generated files, emptied first so a product dropped from
 * the line does not leave its file behind. */
function fresh(name) {
  const dir = resolve(outDir, name)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  return dir
}

const tokens = scales(css)
mkdirSync(outDir, { recursive: true })
writeFileSync(resolve(outDir, 'tokens.json'), `${JSON.stringify(tokens, null, 2)}\n`)

const accents = fresh('accents')
for (const product of lineProducts) writeFileSync(resolve(accents, `${product.name}.css`), accentCss(product))

const resolved = await palettes(css, lineProducts, version)
const paletteDir = fresh('palettes')
const rustDir = fresh('rust')
for (const product of lineProducts) {
  const palette = resolved[product.name]
  writeFileSync(resolve(paletteDir, `${product.name}.json`), `${JSON.stringify(palette, null, 2)}\n`)
  writeFileSync(resolve(rustDir, `${product.name}.rs`), rustModule({ product, palette, tokens, version }))
}

console.log(`tokens: tokens.json, and ${lineProducts.length} accents, palettes and Rust modules`)
