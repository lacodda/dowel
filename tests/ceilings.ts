import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { cn } from '../packages/dowel/src/cn'
import { registrySources } from './classes'

/*
 * Everything the set draws over the page, read out of its source - and every
 * shape it can take.
 *
 * Shared by the ceiling gate and the browser that measures it. The rule (a
 * decision of 02.09): a surface over the page fits the window on both axes
 * and scrolls inside itself when there is more than fits. A short example
 * always fits, so the rule is not checked by looking at one; here every
 * surface is found by its Base UI part, every combination of its variants is
 * written out as the classes it would carry, and the browser is handed far
 * more content than any of them can hold.
 *
 * A surface is a Base UI `Popup` of any kind, and a toast's `Root` - the two
 * parts that are drawn above the page rather than in it. The elements between
 * it and its portal (a positioner, a drawer's viewport) come with it, because
 * the room a surface has is decided there.
 */

const root = resolve(import.meta.dirname, '..')

/** The Base UI parts that are drawn over the page, by module. A `Popup` of
 * any module is one. */
const SURFACE_PARTS: Record<string, string> = { '@base-ui/react/toast': 'Root' }
const isSurfacePart = (module: string, part: string) => part === 'Popup' || SURFACE_PARTS[module] === part

/** One element between the portal and the surface, or the surface itself. */
export interface Layer {
  /** `Positioner`, `Viewport`, `Popup`, `Root`, or `div`. */
  part: string
  classes: string[]
}

export interface SurfaceShape {
  /** `size=md`, `side=bottom size=lg`; empty for a surface with no variants. */
  variant: string
  /** From the outermost element inside the portal down to the surface. */
  layers: Layer[]
  /** The classes of the part its content scrolls in, when that is not the
   * surface itself - a dialog's body. */
  body?: string[]
}

export interface Surface {
  /** `ui/popover.tsx`. */
  file: string
  line: number
  /** `@base-ui/react/popover`. */
  module: string
  /** Placed against an anchor by a positioner, which publishes the room it
   * has as `--available-width` and `--available-height`. Otherwise its room
   * is the window. */
  anchored: boolean
  shapes: SurfaceShape[]
}

/** The window every surface is measured in, and the room a positioner says
 * an anchored one has inside it - smaller than the window, so that a surface
 * held to the window but not to its room is told apart.
 *
 * The room is narrower than every width a surface asks for by itself (a 16rem
 * tooltip, a 16rem popover), so a surface that keeps its own width and drops
 * the room's is too wide here. 240 is about what a phone leaves beside a
 * trigger near its edge; a room wider than a surface's own cap would let the
 * cap pass for a ceiling. */
export const CEILING_WINDOW = { width: 800, height: 600 }
export const CEILING_ROOM = { width: 240, height: 240 }

/** One shape of one surface, as the browser laid it out around far more
 * content than it can hold. */
export interface CeilingMeasure {
  file: string
  line: number
  variant: string
  anchored: boolean
  box: { left: number; top: number; width: number; height: number }
  /** The surface's own overflow: `hidden` for a surface that clips. */
  overflow: { x: string; y: string }
  /** Where the content scrolls: the surface, or the body it names. */
  scroller: 'surface' | 'body'
  scroll: { overflowY: string; overscrollY: string; scrolls: boolean }
}

/*
 * Where the content of a surface that clips goes instead.
 *
 * A dialog is a column - header, body, actions - and only the body scrolls,
 * so that the title and the answer stay in the window while a long form moves
 * between them (measured on the stand: `tests/visual/measured.spec.ts`). Such
 * a surface clips, and names here the part that gives way. A surface that
 * clips and is not listed loses whatever does not fit; one that is listed and
 * scrolls by itself is a stale entry. Both fail the gate.
 */
export const BODIES: Record<string, { file: string; part: string }> = {
  'ui/dialog.tsx': { file: 'ui/dialog.tsx', part: 'DialogBody' },
  'ui/drawer.tsx': { file: 'ui/dialog.tsx', part: 'DialogBody' },
  'ui/confirm-dialog.tsx': { file: 'ui/dialog.tsx', part: 'DialogBody' },
  'ui/command-palette.tsx': { file: 'ui/command-palette.tsx', part: 'CommandPaletteList' },
  'ui/toast.tsx': { file: 'ui/toast.tsx', part: 'ToastDescription' },
}

/** A className this reader cannot evaluate. The gate reports it rather than
 * guessing: a surface whose classes are not known is a surface not measured. */
export class Unreadable extends Error {}

/** Every surface the set draws, with every shape it can take. */
export function surfaces(): Surface[] {
  return registrySources()
    .filter((source) => source.file.startsWith('ui/'))
    .flatMap((source) => surfacesIn(source.file))
}

const trees = new Map<string, ts.SourceFile>()

function treeOf(file: string): ts.SourceFile {
  let tree = trees.get(file)
  if (tree === undefined) {
    const text = readFileSync(resolve(root, 'registry', file), 'utf8')
    tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    trees.set(file, tree)
  }
  return tree
}

/** The module each namespace import of Base UI came from: `Base` -> `@base-ui/react/popover`. */
function baseImports(tree: ts.SourceFile): Map<string, string> {
  const found = new Map<string, string>()
  for (const statement of tree.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const module = statement.moduleSpecifier.text
    if (!module.startsWith('@base-ui/react/')) continue
    for (const element of statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)
      ? statement.importClause.namedBindings.elements
      : []) {
      found.set(element.name.text, module)
    }
  }
  return found
}

type Tag = ts.JsxOpeningElement | ts.JsxSelfClosingElement

/** `{ namespace, part }` for `<Base.Popup>`, `undefined` for anything else. */
function partOf(tag: Tag): { namespace: string; part: string } | undefined {
  const name = tag.tagName
  if (ts.isPropertyAccessExpression(name) && ts.isIdentifier(name.expression)) {
    return { namespace: name.expression.text, part: name.name.text }
  }
  return undefined
}

function surfacesIn(file: string): Surface[] {
  const tree = treeOf(file)
  const imports = baseImports(tree)
  const found: Surface[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const named = partOf(node)
      const module = named && imports.get(named.namespace)
      if (named && module && isSurfacePart(module, named.part)) {
        const { line } = tree.getLineAndCharacterOfPosition(node.getStart(tree))
        found.push(surfaceAt(file, line + 1, module, node, imports))
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return found
}

function surfaceAt(file: string, line: number, module: string, tag: Tag, imports: Map<string, string>): Surface {
  // The chain from the portal down: every element that lays something out.
  // A component that is not Base UI's (a context provider) draws nothing.
  const chain: { part: string; tag: Tag }[] = []
  for (let node: ts.Node | undefined = tag; node; node = node.parent) {
    const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : undefined
    if (opening === undefined) continue
    const named = partOf(opening)
    if (named && imports.has(named.namespace)) {
      if (named.part === 'Portal') break
      chain.unshift({ part: named.part, tag: opening })
    } else if (ts.isIdentifier(opening.tagName) && /^[a-z]/.test(opening.tagName.text)) {
      chain.unshift({ part: opening.tagName.text, tag: opening })
    }
    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) break
  }
  const anchored = chain.some((layer) => layer.part === 'Positioner')
  const expressions = chain.map((layer) => ({ part: layer.part, expression: classNameOf(layer.tag) }))

  const calls = expressions.flatMap(({ expression }) => (expression ? variantCalls(file, expression) : []))
  const axes = new Map<string, Set<string>>()
  for (const call of calls) {
    for (const axis of call.axes) {
      for (const option of Object.keys(call.config.variants[axis] ?? {})) {
        if (!axes.has(axis)) axes.set(axis, new Set())
        axes.get(axis)!.add(option)
      }
    }
  }
  const body = BODIES[file]
  const bodyClasses = body ? partClasses(body.file, body.part) : undefined

  return {
    file,
    line,
    module,
    anchored,
    shapes: combinations(axes).map((env) => ({
      variant: [...env].map(([axis, option]) => `${axis}=${option}`).join(' '),
      layers: expressions.map(({ part, expression }) => ({
        part,
        classes: expression ? evaluate(file, expression, env) : [],
      })),
      ...(bodyClasses ? { body: bodyClasses } : {}),
    })),
  }
}

function classNameOf(tag: Tag): ts.Expression | undefined {
  for (const attribute of tag.attributes.properties) {
    if (!ts.isJsxAttribute(attribute) || attribute.name.getText() !== 'className') continue
    const value = attribute.initializer
    if (value === undefined) return undefined
    if (ts.isStringLiteral(value)) return value
    if (ts.isJsxExpression(value) && value.expression) return value.expression
  }
  return undefined
}

/** Every combination of the options of every axis, in a stable order. */
function combinations(axes: Map<string, Set<string>>): Map<string, string>[] {
  let all: Map<string, string>[] = [new Map()]
  for (const [axis, options] of [...axes].sort(([a], [b]) => a.localeCompare(b))) {
    all = all.flatMap((env) => [...options].map((option) => new Map([...env, [axis, option]])))
  }
  return all
}

/* A cva config, read rather than run: the registry is TSX that imports React
 * and Base UI, and the measuring happens before any test worker exists. */
interface CvaConfig {
  base: string[]
  variants: Record<string, Record<string, string[]>>
  compounds: { when: Record<string, string[]>; classes: string[] }[]
  defaults: Record<string, string>
}

/** The `x({ size, side })` calls of cva functions in a className, with the
 * axes each is given. */
function variantCalls(file: string, expression: ts.Expression): { config: CvaConfig; axes: string[] }[] {
  const calls: { config: CvaConfig; axes: string[] }[] = []
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text !== 'cn') {
      const config = cvaNamed(file, node.expression.text)
      calls.push({ config, axes: axesOf(node) })
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(expression)
  return calls
}

function axesOf(call: ts.CallExpression): string[] {
  const [options] = call.arguments
  if (options === undefined) return []
  if (!ts.isObjectLiteralExpression(options)) throw new Unreadable(`variants given as ${options.getText()}`)
  return options.properties.map((property) => {
    if (ts.isShorthandPropertyAssignment(property) || ts.isPropertyAssignment(property)) return property.name.getText()
    throw new Unreadable(`variant ${property.getText()}`)
  })
}

/** The classes a className expression gives, with `env` choosing the
 * variants. The caller's own `className` adds nothing: it is theirs. */
function evaluate(file: string, expression: ts.Expression, env: Map<string, string>): string[] {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return words(expression.text)
  if (ts.isParenthesizedExpression(expression)) return evaluate(file, expression.expression, env)
  if (ts.isIdentifier(expression)) {
    if (expression.text === 'className') return []
    return constant(file, expression.text)
  }
  if (ts.isCallExpression(expression) && ts.isIdentifier(expression.expression)) {
    // Through the real `cn`, because it is not a join: tailwind-merge drops
    // the earlier of two classes in one group, and a ceiling written first can
    // be dropped for a size written after it - the tooltip's `max-w-64` took
    // out its room's `max-w-[var(--available-width)]` exactly so.
    if (expression.expression.text === 'cn') {
      return words(cn(expression.arguments.map((argument) => evaluate(file, argument, env).join(' '))))
    }
    const config = cvaNamed(file, expression.expression.text)
    const chosen = new Map(axesOf(expression).map((axis) => [axis, env.get(axis) ?? config.defaults[axis]] as const))
    return run(config, chosen)
  }
  throw new Unreadable(`${file}: className ${expression.getText()}`)
}

function run(config: CvaConfig, chosen: Map<string, string | undefined>): string[] {
  const pick = (axis: string) => chosen.get(axis) ?? config.defaults[axis]
  const classes = [...config.base]
  for (const [axis, options] of Object.entries(config.variants)) {
    const option = pick(axis)
    if (option !== undefined) classes.push(...(options[option] ?? []))
  }
  for (const compound of config.compounds) {
    const applies = Object.entries(compound.when).every(([axis, values]) => {
      const option = pick(axis)
      return option !== undefined && values.includes(option)
    })
    if (applies) classes.push(...compound.classes)
  }
  return classes
}

const words = (text: string) => text.split(/\s+/).filter((word) => word !== '')

/** The declaration a name stands for in `file`, following one import from a
 * sibling module: `menuPopupVariants` in context-menu is menu's. */
function declarationOf(file: string, name: string): { file: string; initializer: ts.Expression } {
  const tree = treeOf(file)
  for (const statement of tree.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) {
          return { file, initializer: declaration.initializer }
        }
      }
    }
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const from = statement.moduleSpecifier.text
      const bindings = statement.importClause?.namedBindings
      if (!from.startsWith('./') || !bindings || !ts.isNamedImports(bindings)) continue
      for (const element of bindings.elements) {
        if (element.name.text === name) {
          const sibling = `${file.slice(0, file.lastIndexOf('/') + 1)}${from.slice(2)}.tsx`
          return declarationOf(sibling, (element.propertyName ?? element.name).text)
        }
      }
    }
  }
  throw new Unreadable(`${file}: no declaration of ${name}`)
}

function cvaNamed(file: string, name: string): CvaConfig {
  const found = declarationOf(file, name)
  const value = found.initializer
  // `export const comboboxPopupVariants = selectPopupVariants`
  if (ts.isIdentifier(value)) return cvaNamed(found.file, value.text)
  if (!ts.isCallExpression(value) || value.expression.getText() !== 'cva') throw new Unreadable(`${found.file}: ${name} is not a cva()`)
  const [base, options] = value.arguments
  const config: CvaConfig = { base: base ? listOf(found.file, base) : [], variants: {}, compounds: [], defaults: {} }
  if (options === undefined) return config
  if (!ts.isObjectLiteralExpression(options)) throw new Unreadable(`${found.file}: ${name}'s options`)
  for (const property of options.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    const key = property.name.getText()
    const init = property.initializer
    if (key === 'variants' && ts.isObjectLiteralExpression(init)) {
      for (const axis of init.properties) {
        if (!ts.isPropertyAssignment(axis) || !ts.isObjectLiteralExpression(axis.initializer)) continue
        const options: Record<string, string[]> = {}
        for (const option of axis.initializer.properties) {
          if (ts.isPropertyAssignment(option)) options[nameOf(option.name)] = listOf(found.file, option.initializer)
        }
        config.variants[nameOf(axis.name)] = options
      }
    } else if (key === 'compoundVariants' && ts.isArrayLiteralExpression(init)) {
      for (const element of init.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue
        const compound = { when: {} as Record<string, string[]>, classes: [] as string[] }
        for (const part of element.properties) {
          if (!ts.isPropertyAssignment(part)) continue
          const partKey = nameOf(part.name)
          if (partKey === 'class' || partKey === 'className') compound.classes = listOf(found.file, part.initializer)
          else compound.when[partKey] = ts.isArrayLiteralExpression(part.initializer)
            ? part.initializer.elements.map((value) => literal(value))
            : [literal(part.initializer)]
        }
        config.compounds.push(compound)
      }
    } else if (key === 'defaultVariants' && ts.isObjectLiteralExpression(init)) {
      for (const option of init.properties) {
        if (ts.isPropertyAssignment(option)) config.defaults[nameOf(option.name)] = literal(option.initializer)
      }
    }
  }
  return config
}

function nameOf(name: ts.PropertyName): string {
  return ts.isStringLiteral(name) || ts.isIdentifier(name) || ts.isNumericLiteral(name) ? name.text : name.getText()
}

function literal(node: ts.Expression): string {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (node.kind === ts.SyntaxKind.TrueKeyword) return 'true'
  if (node.kind === ts.SyntaxKind.FalseKeyword) return 'false'
  throw new Unreadable(`value ${node.getText()}`)
}

/** A list of classes written as a string, an array of them, or a constant. */
function listOf(file: string, node: ts.Expression): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return words(node.text)
  if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap((element) => listOf(file, element))
  if (ts.isIdentifier(node)) return constant(file, node.text)
  throw new Unreadable(`${file}: classes ${node.getText()}`)
}

function constant(file: string, name: string): string[] {
  const found = declarationOf(file, name)
  return listOf(found.file, found.initializer)
}

/** The classes of an exported part: the className of the element it returns,
 * through an alias (`export const DrawerBody = DialogBody`). */
export function partClasses(file: string, part: string): string[] {
  const tree = treeOf(file)
  for (const statement of tree.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === part) {
      let tag: Tag | undefined
      const visit = (node: ts.Node) => {
        if (tag === undefined && ts.isReturnStatement(node) && node.expression) {
          const returned = ts.isParenthesizedExpression(node.expression) ? node.expression.expression : node.expression
          tag = ts.isJsxElement(returned) ? returned.openingElement : ts.isJsxSelfClosingElement(returned) ? returned : undefined
        }
        if (tag === undefined) ts.forEachChild(node, visit)
      }
      visit(statement)
      const expression = tag && classNameOf(tag)
      if (expression === undefined) throw new Unreadable(`${file}: ${part} returns no element with a className`)
      return evaluate(file, expression, new Map())
    }
  }
  const alias = declarationOf(file, part)
  if (ts.isIdentifier(alias.initializer)) return partClasses(alias.file, alias.initializer.text)
  throw new Unreadable(`${file}: ${part} is not a component`)
}
