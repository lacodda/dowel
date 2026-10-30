/*
 * Every component's props, read from its TypeScript.
 *
 * The tables on the component pages were written by hand, and a hand-kept
 * table is a second copy of the types that drifts from them: the Menu page once
 * credited dowel with defaults for `side` and `align` that Base UI decides,
 * and a prop added in a fix reaches the page only if somebody remembers. Here
 * the source is read instead - the names, the types, what is required, the
 * defaults in the destructuring and in a `cva`'s `defaultVariants`, and the
 * doc comment on each prop. The comment is the description, so it is written
 * once, where a product's editor shows it too: a copied component carries its
 * documentation into the product that copied it.
 *
 * A prop is *own* when it is declared in the component's file: its own
 * interface, a type literal, the variants of its `cva`. Everything else the
 * props type takes from elsewhere - Base UI, the DOM, another dowel component -
 * is named as a whole rather than listed, because those are documented where
 * they are declared, and a table of forty inherited props hides the five that
 * are dowel's.
 *
 * Output: `registry/props.json`, committed - the documentation site is built
 * without the workspace's build, as `registry/history.json` is - and checked
 * against the source by `tests/props.test.ts`.
 */
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const outPath = resolve(root, 'registry/props.json')
const distDir = resolve(root, 'packages/dowel/dist')

/** The registry's sources, components and blocks, without their tests. */
export function sources() {
  return ['ui', 'blocks'].flatMap((dir) =>
    readdirSync(resolve(root, 'registry', dir))
      .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
      .sort()
      .map((file) => ({ dir, name: basename(file, '.tsx'), path: resolve(root, 'registry', dir, file) })),
  )
}

const posix = (path) => path.replaceAll('\\', '/')

/** The first paragraph of a doc comment: what a table cell can hold. */
const firstParagraph = (text) => text.split(/\n\s*\n/)[0].replace(/\s*\n\s*/g, ' ').trim()

/** `"sm" | "md" | undefined` as `sm | md`; anything else as TypeScript writes it. */
function typeText(checker, type) {
  const members = (type.isUnion() ? type.types : [type]).filter((member) => !(member.flags & ts.TypeFlags.Undefined))
  // A set of choices - a variant, a side - is written as the choices.
  // `boolean` arrives as `true | false`, and is one type to a reader. A `null`
  // the prop takes is kept: it says something, where `undefined` only says
  // the prop is optional.
  const booleans = members.filter((member) => member.flags & ts.TypeFlags.BooleanLiteral)
  const nulls = members.filter((member) => member.flags & ts.TypeFlags.Null)
  const literals = members.filter((member) => member.isStringLiteral() || member.isNumberLiteral())
  if (literals.length > 0 && literals.length + booleans.length + nulls.length === members.length) {
    return [
      ...literals.map((member) => String(member.value)),
      ...(booleans.length > 0 ? ['boolean'] : []),
      ...(nulls.length > 0 ? ['null'] : []),
    ].join(' | ')
  }
  // Anything else as TypeScript writes it - aliases kept, so `ReactNode` stays
  // `ReactNode` - without the `undefined` an optional prop adds. Only the
  // outermost union loses it: a callback's `(value: string | undefined)` is
  // the callback's business.
  const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType
  const outer = topLevel(checker.typeToString(type, undefined, flags)).filter((part) => part !== 'undefined')
  return outer.length === 1 ? unwrapped(outer[0]) : outer.join(' | ')
}

/** A type's text split at the `|` that are not inside brackets. */
function topLevel(text) {
  const parts = []
  let depth = 0
  let start = 0
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if ('([{<'.includes(char)) depth += 1
    else if (')]}>'.includes(char) && text[index - 1] !== '=') depth -= 1
    else if (char === '|' && depth === 0) {
      parts.push(text.slice(start, index).trim())
      start = index + 1
    }
  }
  parts.push(text.slice(start).trim())
  return parts.filter(Boolean)
}

/** `((pressed: boolean) => void)` - the brackets a union needed around a
 * function type, left behind once `| undefined` is gone. */
function unwrapped(text) {
  if (!text.startsWith('(') || !text.endsWith(')')) return text
  let depth = 0
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '(') depth += 1
    if (text[index] === ')') depth -= 1
    if (depth === 0 && index < text.length - 1) return text
  }
  return unwrapped(text.slice(1, -1))
}

/** The function a component export is, whatever it is wrapped in. */
function functionOf(node) {
  if (!node) return null
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return node
  if (ts.isVariableDeclaration(node)) return functionOf(node.initializer)
  if (node && ts.isCallExpression(node)) return node.arguments.map(functionOf).find(Boolean) ?? null
  if (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node))) {
    return functionOf(node.expression)
  }
  return null
}

/** `{ size = 'md', ...props }` gives `size: 'md'`. */
function destructuredDefaults(fn) {
  const parameter = fn?.parameters[0]
  if (!parameter || !ts.isObjectBindingPattern(parameter.name)) return {}
  // No prototype: `'toString' in {}` is true, and a prop by that name would
  // look as though this file gave it a default.
  const defaults = Object.create(null)
  for (const element of parameter.name.elements) {
    if (element.dotDotDotToken || !element.initializer) continue
    const key = (element.propertyName ?? element.name).getText()
    defaults[key] = element.initializer.getText()
  }
  return defaults
}

/** The `cva(…)` call a variant's declaration sits in, and its default. */
function variantDefault(declaration, name) {
  // variants: { size: { … } } - the property, its object, `variants`, the
  // config object, the call.
  const config = declaration.parent?.parent?.parent
  if (!config || !ts.isObjectLiteralExpression(config)) return undefined
  const defaults = config.properties.find(
    (property) => ts.isPropertyAssignment(property) && property.name.getText() === 'defaultVariants',
  )
  if (!defaults || !ts.isObjectLiteralExpression(defaults.initializer)) return undefined
  const entry = defaults.initializer.properties.find(
    (property) => ts.isPropertyAssignment(property) && property.name.getText() === name,
  )
  return entry ? entry.initializer.getText() : undefined
}

/** A variant's choices in the order its `cva` writes them - TypeScript's
 * union is in the order it met the literals, which reads as shuffled. A
 * variant of `true` and `false` is a boolean. */
function variantChoices(declaration) {
  if (!declaration || !ts.isPropertyAssignment(declaration) || !ts.isObjectLiteralExpression(declaration.initializer)) {
    return null
  }
  const variants = declaration.parent?.parent
  if (!variants || !ts.isPropertyAssignment(variants) || variants.name.getText() !== 'variants') return null
  const keys = declaration.initializer.properties.map((property) => property.name.getText().replace(/^['"]|['"]$/g, ''))
  if (keys.every((key) => key === 'true' || key === 'false')) return 'boolean'
  return keys.join(' | ')
}

/** Which namespace each Base UI import alias stands for: `Base` -> `Select`. */
function baseUiAliases(file) {
  const aliases = {}
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    const from = statement.moduleSpecifier.text
    if (!from.startsWith('@base-ui/react')) continue
    for (const element of statement.importClause?.namedBindings?.elements ?? []) {
      aliases[element.name.text] = { name: (element.propertyName ?? element.name).text, module: from }
    }
  }
  return aliases
}

function inheritedFrom(checker, file, node, aliases, own) {
  if (ts.isParenthesizedTypeNode(node)) return inheritedFrom(checker, file, node.type, aliases, own)
  if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
    return node.types.flatMap((member) => inheritedFrom(checker, file, member, aliases, own))
  }
  if (ts.isTypeLiteralNode(node)) return []
  const name = ts.isTypeReferenceNode(node) ? node.typeName : ts.isExpressionWithTypeArguments(node) ? node.expression : null
  if (!name) return [{ kind: 'other', type: node.getText() }]
  const text = name.getText()
  const args = node.typeArguments ?? []
  // A cva's variants are listed as own props; the wrapper itself is not a source.
  if (text === 'VariantProps') return []
  if (['Omit', 'Pick', 'Partial', 'Readonly', 'Required'].includes(text) && args[0]) {
    const omitted = text === 'Omit' && args[1] ? literalKeys(args[1]) : []
    return inheritedFrom(checker, file, args[0], aliases, own).map((source) =>
      omitted.length > 0 ? { ...source, omits: [...(source.omits ?? []), ...omitted] } : source,
    )
  }
  let symbol = checker.getSymbolAtLocation(ts.isQualifiedName(name) || ts.isPropertyAccessExpression(name) ? name.right ?? name.name : name)
  if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
  const declaration = symbol?.declarations?.[0]
  const where = declaration ? posix(declaration.getSourceFile().fileName) : ''
  if (declaration && declaration.getSourceFile() === file) {
    // One of this file's own types: what it extends is what is inherited.
    own.add(declaration)
    if (ts.isInterfaceDeclaration(declaration)) {
      return (declaration.heritageClauses ?? []).flatMap((clause) =>
        clause.types.flatMap((type) => inheritedFrom(checker, file, type, aliases, own)),
      )
    }
    if (ts.isTypeAliasDeclaration(declaration)) return inheritedFrom(checker, file, declaration.type, aliases, own)
    return []
  }
  if (where.includes('@base-ui/react')) {
    const [head, ...rest] = text.split('.')
    const alias = aliases[head]
    const part = [alias?.name ?? head, ...rest].filter((piece) => piece !== 'Props').join('.')
    return [{ kind: 'base-ui', part, module: alias?.module ?? '@base-ui/react' }]
  }
  if (where.includes('/registry/')) {
    return [{ kind: 'dowel', item: basename(where).replace(/\.tsx?$/, ''), type: node.getText() }]
  }
  if (where.includes('@types/react')) return [{ kind: 'react', type: node.getText() }]
  return [{ kind: 'other', type: node.getText() }]
}

function literalKeys(node) {
  const members = ts.isUnionTypeNode(node) ? node.types : [node]
  return members
    .filter((member) => ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal))
    .map((member) => member.literal.text)
}

/** What an exported component is, read from its declaration. */
function component(checker, file, symbol, aliases) {
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]
  const description = firstParagraph(ts.displayPartsToString(symbol.getDocumentationComment(checker)))
  const entry = { name: symbol.name, ...(description ? { description } : {}) }

  // `export const Select = Base.Root`: Base UI's own part, under dowel's name.
  const initializer = declaration && ts.isVariableDeclaration(declaration) ? declaration.initializer : undefined
  if (initializer && (ts.isPropertyAccessExpression(initializer) || ts.isIdentifier(initializer))) {
    const [head, ...rest] = initializer.getText().split('.')
    const alias = aliases[head]
    if (alias) return { ...entry, is: { kind: 'base-ui', part: [alias.name, ...rest].join('.'), module: alias.module } }
    let target = checker.getSymbolAtLocation(initializer)
    if (target && target.flags & ts.SymbolFlags.Alias) target = checker.getAliasedSymbol(target)
    const where = posix(target?.declarations?.[0]?.getSourceFile().fileName ?? '')
    if (where.includes('/registry/')) {
      return { ...entry, is: { kind: 'dowel', item: basename(where).replace(/\.tsx?$/, ''), name: target.name } }
    }
  }

  const fn = functionOf(declaration)
  const shape = checker.getTypeOfSymbolAtLocation(symbol, declaration)
  // A class component - an error boundary has to be one - is constructed
  // with its props rather than called with them.
  const signature = shape.getCallSignatures()[0] ?? shape.getConstructSignatures()[0]
  // A capitalised value that cannot be called is a constant - `STEPS`, a
  // table - not a component.
  if (!signature) return null
  const parameter = signature.getParameters()[0]
  if (!parameter) return { ...entry, props: [], inherits: [] }

  const parameterNode = fn?.parameters[0]
  // For a class, the props are the first type argument of what it extends:
  // `extends Component<ErrorBoundaryProps, State>`.
  const typeNode =
    parameterNode?.type ??
    (declaration && ts.isClassDeclaration(declaration)
      ? declaration.heritageClauses?.[0]?.types[0]?.typeArguments?.[0]
      : undefined)
  const own = new Set()
  const inherits = typeNode ? inheritedFrom(checker, file, typeNode, aliases, own) : []
  const defaults = destructuredDefaults(fn)
  const propsType = typeNode
    ? checker.getTypeFromTypeNode(typeNode)
    : checker.getTypeOfSymbolAtLocation(parameter, parameterNode ?? declaration)

  /*
   * A props type may be a union of shapes - the line's way of saying two props
   * come together or not at all (`onRetry` with `retryLabel`). It is read shape
   * by shape: a prop typed `never` or `undefined` is absent from that shape, a
   * prop is required only when every shape requires it, and one required in
   * some shapes is required *with* the others that shape requires.
   */
  const shapes = propsType.isUnion() ? propsType.types : [propsType]
  const found = new Map()
  for (const shape of shapes) {
    const requiredHere = []
    for (const prop of checker.getPropertiesOfType(shape)) {
      const declarations = prop.declarations ?? []
      const local = declarations.find((node) => node.getSourceFile() === file)
      // Inherited, and named as a whole above - unless this file gives it a
      // default, which is dowel's decision and belongs in the table.
      if (!local && !(prop.name in defaults)) continue
      const at = local ?? declarations[0]
      const type = checker.getTypeOfSymbolAtLocation(prop, at ?? declaration)
      if (checker.getNonNullableType(type).flags & ts.TypeFlags.Never) continue
      const entry = found.get(prop.name) ?? {
        at,
        shapes: 0,
        required: 0,
        types: [],
        doc: '',
        with: new Set(),
        variant: false,
        inherited: !local,
      }
      entry.shapes += 1
      if (!(prop.flags & ts.SymbolFlags.Optional)) {
        entry.required += 1
        requiredHere.push(prop.name)
      }
      const choices = variantChoices(at)
      if (choices) entry.variant = true
      const text = choices ?? typeText(checker, type)
      if (!entry.types.includes(text)) entry.types.push(text)
      entry.doc ||= ts.displayPartsToString(prop.getDocumentationComment(checker)).trim()
      found.set(prop.name, entry)
    }
    for (const name of requiredHere) for (const other of requiredHere) if (other !== name) found.get(name).with.add(other)
  }

  // The props a shape requires alongside this one, less those every shape
  // requires anyway.
  const partners = (entry) =>
    [...entry.with].filter((other) => found.get(other).required !== shapes.length).sort()
  const props = []
  for (const [name, entry] of found) {
    const variant = entry.at && ts.isPropertyAssignment(entry.at) ? variantDefault(entry.at, name) : undefined
    const fallback = defaults[name] ?? variant
    const required = entry.required === shapes.length
    props.push({
      name,
      type: entry.types.join(' | '),
      ...(required ? { required: true } : {}),
      ...(!required && entry.required > 0 && partners(entry).length > 0 ? { requiredWith: partners(entry) } : {}),
      ...(fallback !== undefined ? { default: fallback } : {}),
      // A cva variant: its choices are its type, and the page's prose says
      // what each looks like.
      ...(entry.variant ? { variant: true } : {}),
      // Declared elsewhere - the DOM's `role`, Base UI's `disabled` - and
      // listed because this file gives it a default. Its description is
      // wherever it is declared.
      ...(entry.inherited ? { inherited: true } : {}),
      ...(entry.doc ? { description: firstParagraph(entry.doc) } : {}),
    })
  }
  // In the order the source declares them, then the inherited ones a default
  // pulled in, by name.
  const position = (prop) => {
    const symbolOfProp = propsType.getProperty(prop.name)
    const at = symbolOfProp?.declarations?.find((node) => node.getSourceFile() === file)
    return at ? at.getStart() : Number.MAX_SAFE_INTEGER
  }
  props.sort((a, b) => position(a) - position(b) || a.name.localeCompare(b.name))
  return { ...entry, props, inherits: dedupe(inherits) }
}

function dedupe(sources) {
  const seen = new Set()
  return sources.filter((source) => {
    const key = JSON.stringify(source)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** An export is a component when its name is one - capitalised - and it is a
 * value. Types, `cva`s, hooks and helpers are lower-case or not values. */
function isComponentExport(symbol) {
  if (!/^[A-Z]/.test(symbol.name)) return false
  if (symbol.flags & ts.SymbolFlags.Class) {
    // A class is a component when it extends React's: `SchemaError extends
    // Error` is a value with a capital letter and a constructor, and no props.
    const heritage = symbol.valueDeclaration?.heritageClauses?.[0]?.types[0]?.expression.getText() ?? ''
    return /(^|\.)(Pure)?Component$/.test(heritage)
  }
  return Boolean(symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable))
}

export function buildProps() {
  const configPath = resolve(root, 'tsconfig.registry.json')
  const config = ts.getParsedCommandLineOfConfigFile(configPath, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} })
  const files = sources()
  const program = ts.createProgram(
    files.map((source) => source.path),
    config.options,
  )
  const checker = program.getTypeChecker()
  const items = {}
  for (const source of files) {
    const file = program.getSourceFile(source.path)
    const moduleSymbol = checker.getSymbolAtLocation(file)
    const aliases = baseUiAliases(file)
    const components = []
    for (let symbol of moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []) {
      if (symbol.flags & ts.SymbolFlags.Alias) {
        // `export { X } from './y'`: listed by the file that declares it.
        continue
      }
      if (!isComponentExport(symbol)) continue
      const entry = component(checker, file, symbol, aliases)
      if (entry) components.push(entry)
    }
    const order = (entry) => {
      const declared = moduleSymbol && checker.getExportsOfModule(moduleSymbol).find((s) => s.name === entry.name)
      return declared?.declarations?.[0]?.getStart() ?? 0
    }
    components.sort((a, b) => order(a) - order(b))
    if (components.length > 0) items[source.name] = { dir: source.dir, components }
  }
  return items
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const items = buildProps()
  const text = `${JSON.stringify(items, null, 2)}\n`
  writeFileSync(outPath, text)
  // In the package too, for whatever reads the set without the site - an
  // editor's snippets, an assistant, a product's own documentation.
  if (existsSync(distDir)) writeFileSync(resolve(distDir, 'props.json'), text)
  const count = Object.values(items).reduce((sum, item) => sum + item.components.length, 0)
  console.log(`props: ${count} components in ${Object.keys(items).length} items`)
}
