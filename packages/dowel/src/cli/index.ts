import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { collectFiles, scanProject, type Finding } from './scan.js'
import { rewriteSource } from './codemod.js'
import { diagnose, readCatalogue, type Catalogue, type Diagnosis, type ProjectFacts } from './doctor.js'
import { differs, diffLines, hunks } from './diff.js'

/*
 * `dowel` - the command a product runs on itself.
 *
 * Four commands, and they divide along one line: `check`, `doctor` and `diff`
 * only read, `codemod` writes and only when asked twice. That division is the
 * design. A migration tool earns its place by being run early and often on a
 * codebase nobody is ready to change yet, and a tool that might edit is a tool
 * that gets run once, at the end, under supervision.
 *
 * Everything works offline. The catalogue a consumer needs is the one that
 * came with the package they installed, so nothing here asks the network for
 * permission to describe a project.
 */

/** ANSI, when the output is a terminal that wants it.
 *
 * `NO_COLOR` is honoured because this prints reports people paste into issues,
 * and escape codes in a paste are noise. The check is done once at import: a
 * report that is coloured at the top and plain at the bottom would mean the
 * stream changed underneath, which it does not. */
const useColor =
  process.stdout.isTTY === true && !process.env.NO_COLOR && process.env.TERM !== 'dumb'

/* The escape is written as an escape sequence rather than typed as the byte
 * itself. A literal ESC in a source file works and is invisible - which is
 * the problem: it survives no encoding conversion and no tool that rewrites
 * the file, and when it is lost the output turns into visible garbage rather
 * than failing. */
const paint = (code: string) => (text: string) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : text)
const bold = paint('1')
const dim = paint('2')
const red = paint('31')
const green = paint('32')
const yellow = paint('33')
const cyan = paint('36')

/** What a command decided. The number is the process exit code, and it is
 * deliberately narrow: 0 for a clean run, 1 for findings, 2 for being asked to
 * do something impossible. A build that treats "found things" the same as
 * "could not run" cannot be trusted either way. */
type Outcome = 0 | 1 | 2

interface Options {
  readonly root: string
  readonly write: boolean
  readonly json: boolean
  readonly positional: readonly string[]
}

function parseOptions(argv: readonly string[]): Options {
  const positional: string[] = []
  let root = process.cwd()
  let write = false
  let json = false

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    if (arg === '--write') {
      write = true
    } else if (arg === '--json') {
      json = true
    } else if (arg === '--cwd') {
      const value = argv[i + 1]
      if (value) {
        root = resolve(value)
        i += 1
      }
    } else if (arg.startsWith('--cwd=')) {
      root = resolve(arg.slice('--cwd='.length))
    } else if (!arg.startsWith('-')) {
      positional.push(arg)
    }
  }

  return { root, write, json, positional }
}

function reportCheck(findings: readonly Finding[], options: Options): Outcome {
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ findings }, null, 2)}\n`)
    return findings.length > 0 ? 1 : 0
  }

  if (findings.length === 0) {
    process.stdout.write(`${green('Nothing to migrate.')} No stock tokens, no colours written down.\n`)
    return 0
  }

  /* Grouped by file, because that is the unit a reader fixes in. Within a
   * file the findings are already in line order from the scanner. */
  const byFile = new Map<string, Finding[]>()
  for (const finding of findings) {
    const list = byFile.get(finding.file)
    if (list) list.push(finding)
    else byFile.set(finding.file, [finding])
  }

  for (const [file, list] of byFile) {
    process.stdout.write(`\n${bold(file)}\n`)
    for (const finding of list) {
      /* Three marks, not two. An ambiguous name is not a violation - it is a
       * name this tool cannot judge - and giving it the same mark as a stock
       * token would tell a migrated project it has work to do. */
      const mark =
        finding.kind === 'color'
          ? yellow('color')
          : finding.replacement?.kind === 'ambiguous'
            ? dim('both ')
            : cyan('stock')
      process.stdout.write(`  ${dim(`${finding.line}:${finding.column}`)} ${mark}  ${finding.message}\n`)
    }
  }

  const ambiguous = findings.filter((finding) => finding.replacement?.kind === 'ambiguous').length
  const stock = findings.filter((finding) => finding.kind === 'stock').length - ambiguous
  const colors = findings.filter((finding) => finding.kind === 'color').length
  const files = byFile.size

  const parts = [
    `${stock} stock ${stock === 1 ? 'name' : 'names'}`,
    `${colors} raw ${colors === 1 ? 'colour' : 'colours'}`,
  ]
  if (ambiguous > 0) parts.push(`${ambiguous} in both vocabularies`)

  process.stdout.write(
    `\n${bold(String(findings.length))} findings in ${files} file${files === 1 ? '' : 's'}` +
      ` - ${parts.join(', ')}.\n`,
  )

  const rewritable = findings.filter(
    (finding) => finding.kind === 'stock' && finding.replacement?.kind === 'token',
  ).length
  if (rewritable > 0) {
    process.stdout.write(`${dim(`${rewritable} of them can be rewritten: dowel codemod --write`)}\n`)
  }
  if (colors > 0) {
    process.stdout.write(
      `${dim('Colours are not rewritten: which token a colour meant is a decision, not a substitution.')}\n`,
    )
  }
  if (ambiguous > 0) {
    process.stdout.write(
      `${dim('Names in both vocabularies are never rewritten: on a migrated project they are already right.')}\n`,
    )
  }

  /* Ambiguous names alone are not a reason to fail. A project that has fully
   * migrated still reports them - every use of `--accent` is one - and an exit
   * code that treats "correct" as "findings" cannot be put in a build. */
  return stock + colors > 0 ? 1 : 0
}

function commandCheck(options: Options): Outcome {
  if (!existsSync(options.root)) {
    process.stderr.write(`${red('No such directory')}: ${options.root}\n`)
    return 2
  }
  return reportCheck(scanProject(options.root), options)
}

function commandCodemod(options: Options): Outcome {
  if (!existsSync(options.root)) {
    process.stderr.write(`${red('No such directory')}: ${options.root}\n`)
    return 2
  }

  const touched: { file: string; changes: number }[] = []
  const skipped: { file: string; line: number; name: string; note: string }[] = []
  let total = 0

  for (const path of collectFiles(options.root)) {
    let source: string
    try {
      source = readFileSync(path, 'utf8')
    } catch {
      continue
    }

    const name = relative(options.root, path).split(sep).join('/')
    const result = rewriteSource(source)
    for (const entry of result.skipped) skipped.push({ file: name, ...entry })
    if (result.changes.length === 0) continue

    total += result.changes.length
    touched.push({ file: name, changes: result.changes.length })
    if (options.write) writeFileSync(path, result.source)
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify({ written: options.write, touched, skipped }, null, 2)}\n`)
    return 0
  }

  if (total === 0) {
    process.stdout.write(`${green('Nothing to rewrite.')} No stock token names found.\n`)
  } else {
    for (const entry of touched) {
      process.stdout.write(`  ${bold(entry.file)} ${dim(`${entry.changes} renamed`)}\n`)
    }
    const verb = options.write ? 'Rewrote' : 'Would rewrite'
    process.stdout.write(
      `\n${verb} ${bold(String(total))} ${total === 1 ? 'name' : 'names'} in ${touched.length} file${
        touched.length === 1 ? '' : 's'
      }.\n`,
    )
    if (!options.write) {
      process.stdout.write(`${dim('Nothing was written. Run again with --write.')}\n`)
    }
  }

  /* The names deliberately left alone. These are why a run can finish and the
   * migration still not be done, so they are printed even on a clean run.
   *
   * The heading does not say why, because there are two different whys - a
   * name dowel has no equivalent for, and a name that exists in both
   * vocabularies and is probably already right. Each entry carries its own
   * reason; a single heading claiming one of them would be wrong half the
   * time, and it was: it told a migrated project that `--accent` had no
   * equivalent. */
  if (skipped.length > 0) {
    const names = [...new Set(skipped.map((entry) => entry.name))].sort()
    process.stdout.write(`\n${yellow('Left alone')} - each with its reason:\n`)
    for (const name of names) {
      const note = skipped.find((entry) => entry.name === name)!.note
      const count = skipped.filter((entry) => entry.name === name).length
      process.stdout.write(`  ${bold(name)} ${dim(`(${count})`)} - ${note}\n`)
    }
  }

  return 0
}

/** Gather what `doctor` needs from a project on disk. */
function readProject(root: string): ProjectFacts {
  const readJson = (path: string): Record<string, unknown> | undefined => {
    const full = resolve(root, path)
    if (!existsSync(full)) return undefined
    try {
      return JSON.parse(readFileSync(full, 'utf8')) as Record<string, unknown>
    } catch {
      return undefined
    }
  }

  const manifest = readJson('package.json') as ProjectFacts['manifest']
  const installedManifest = readJson('node_modules/dowel-ui/package.json') as
    | { version?: string }
    | undefined

  const stylesheets = collectFiles(root)
    .filter((path) => path.endsWith('.css'))
    .map((path) => ({
      path: relative(root, path).split(sep).join('/'),
      source: readFileSync(path, 'utf8'),
    }))

  const catalogue = readCatalogue(root)

  /* What has been copied in. A registry component is recognised by the file
   * name matching a catalogue item and the file importing the package - the
   * name alone would claim every `button.tsx` ever written. */
  const installedComponents: { name: string; source: string }[] = []
  if (catalogue) {
    const componentNames = new Set(
      catalogue.items.filter((item) => item.type === 'registry:ui').map((item) => item.name),
    )
    for (const path of collectFiles(root)) {
      if (!path.endsWith('.tsx')) continue
      const base = path.slice(path.lastIndexOf(sep) + 1).replace(/\.tsx$/, '')
      if (!componentNames.has(base)) continue
      const source = readFileSync(path, 'utf8')
      if (!source.includes('dowel-ui')) continue
      installedComponents.push({ name: base, source })
    }
  }

  return {
    root,
    manifest,
    installedVersion: installedManifest?.version,
    stylesheets,
    componentsConfig: readJson('components.json') as ProjectFacts['componentsConfig'],
    catalogue,
    installedComponents,
  }
}

function commandDoctor(options: Options): Outcome {
  if (!existsSync(options.root)) {
    process.stderr.write(`${red('No such directory')}: ${options.root}\n`)
    return 2
  }

  const findings: Diagnosis[] = diagnose(readProject(options.root))

  if (options.json) {
    process.stdout.write(`${JSON.stringify({ findings }, null, 2)}\n`)
    return findings.some((finding) => finding.severity === 'problem') ? 1 : 0
  }

  if (findings.length === 0) {
    process.stdout.write(`${green('The installation is coherent.')}\n`)
    return 0
  }

  for (const finding of findings) {
    const mark = finding.severity === 'problem' ? red('problem') : yellow('note   ')
    process.stdout.write(`${mark} ${bold(finding.check)}  ${finding.message}\n`)
    if (finding.fix) process.stdout.write(`        ${dim(finding.fix)}\n`)
  }

  const problems = findings.filter((finding) => finding.severity === 'problem').length
  return problems > 0 ? 1 : 0
}

function commandDiff(options: Options): Outcome {
  const root = options.root
  const catalogue: Catalogue | undefined = readCatalogue(root)
  if (!catalogue) {
    process.stderr.write(
      `${red('No catalogue')}: dowel-ui is not installed here, so there is nothing to compare against.\n`,
    )
    return 2
  }

  const facts = readProject(root)
  const wanted = options.positional[0]
  const targets = wanted
    ? facts.installedComponents.filter((component) => component.name === wanted)
    : facts.installedComponents

  if (wanted && targets.length === 0) {
    process.stderr.write(`${red('Not found')}: no component named ${bold(wanted)} in this project.\n`)
    return 2
  }

  const changed: { name: string; hunks: ReturnType<typeof hunks> }[] = []
  for (const component of targets) {
    const item = catalogue.items.find((candidate) => candidate.name === component.name)
    const file = item?.files?.[0]
    const upstream = (file as { content?: string } | undefined)?.content
    if (typeof upstream !== 'string') continue
    if (!differs(upstream, component.source)) continue
    changed.push({ name: component.name, hunks: hunks(diffLines(upstream, component.source)) })
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify({ changed }, null, 2)}\n`)
    return 0
  }

  /* Nothing to compare is not the same as nothing differing. "0 components
   * match the registry" reads as reassurance about work that never happened -
   * found by running the published command against a project with no
   * components in it. */
  if (targets.length === 0) {
    process.stdout.write(
      `${dim('No dowel components in this project, so there is nothing to compare.')}\n`,
    )
    return 0
  }

  if (changed.length === 0) {
    const scope = wanted ? bold(wanted) : `${targets.length} component${targets.length === 1 ? '' : 's'}`
    process.stdout.write(`${green('Unchanged')}: ${scope} ${targets.length === 1 ? 'matches' : 'match'} the registry.\n`)
    return 0
  }

  for (const component of changed) {
    process.stdout.write(`\n${bold(component.name)} ${dim('- registry above, yours below')}\n`)
    for (const hunk of component.hunks) {
      process.stdout.write(dim(`  @@ registry ${hunk.fromLine}, yours ${hunk.toLine} @@\n`))
      for (const line of hunk.lines) {
        if (line.kind === 'same') process.stdout.write(dim(`     ${line.text}\n`))
        else if (line.kind === 'removed') process.stdout.write(red(`   - ${line.text}\n`))
        else process.stdout.write(green(`   + ${line.text}\n`))
      }
    }
  }

  process.stdout.write(
    `\n${bold(String(changed.length))} of ${targets.length} ${
      targets.length === 1 ? 'component differs' : 'components differ'
    } from the registry.\n` +
      `${dim('That is allowed - a copied component is yours. Nothing here merges anything.')}\n`,
  )
  return 0
}

const USAGE = `dowel - migration tools for the lacodda design system

  dowel check              What in this project is not on the dowel vocabulary
  dowel codemod [--write]  Rewrite stock shadcn token names into dowel's
  dowel doctor             Whether this project's dowel installation is coherent
  dowel diff [component]   How a copied component differs from the registry's

Options
  --cwd <dir>   Look at this directory instead of the current one
  --json        Machine-readable output
  --write       codemod only: actually write the files

Everything reads the catalogue inside the installed package; nothing needs the
network. https://lacodda.github.io/dowel/guides/migration/
`

export function run(argv: readonly string[]): Outcome {
  const command = argv.find((arg) => !arg.startsWith('-'))
  const options = parseOptions(argv.filter((arg) => arg !== command))

  switch (command) {
    case 'check':
      return commandCheck(options)
    case 'codemod':
      return commandCodemod(options)
    case 'doctor':
      return commandDoctor(options)
    case 'diff':
      return commandDiff(options)
    case 'help':
    case undefined:
      process.stdout.write(USAGE)
      return command === undefined ? 2 : 0
    default:
      process.stderr.write(`${red('Unknown command')}: ${command}\n\n${USAGE}`)
      return 2
  }
}
