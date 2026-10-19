import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'

/*
 * The classes the set writes, read out of its source.
 *
 * Shared by every gate that asks what a class turns into - that it compiles at
 * all, that its motion rests, that it is timed by a step - so they all agree
 * on what a class is.
 *
 * A class is a word in a string, and most strings in a component are not
 * classes: `type="button"`, `side === 'bottom'`, a key, a variant's default.
 * The source is parsed rather than searched, and where a string stands says
 * what it is:
 *
 * - **sure** - in a `className` attribute, an argument of `cn()`, or where
 *   `cva()` reads classes: its base, a variant's options, a compound's
 *   `class`. Every word of it is a class, and one that compiles to nothing is
 *   dead.
 * - **loose** - anywhere else: a constant, a prop's value. Its words are taken
 *   for classes only when one of them is one - `'flex shrink-0 gap-1'` held in
 *   a constant is a class list, `'button, a, input'` is a selector.
 *
 * A string that is compared, indexed, or handed to some other function is
 * not a class list even inside `cn()`: `cn(variant === 'ghost' && 'bg-soft')`
 * writes one class, not two.
 */

const root = resolve(import.meta.dirname, '..')

export interface Source {
  /** `ui/spinner.tsx`, as the registry names the file. */
  file: string
  /** The file as written. */
  text: string
  /** The code with its comments taken out: a class named in prose is not a
   * class anything is drawn with. */
  code: string
}

/** Every primitive and block, as shipped. */
export function registrySources(): Source[] {
  return ['ui', 'blocks'].flatMap((dir) =>
    readdirSync(resolve(root, 'registry', dir))
      .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
      .map((file) => {
        const text = readFileSync(resolve(root, 'registry', dir, file), 'utf8')
        return { file: `${dir}/${file}`, text, code: withoutComments(text) }
      }),
  )
}

export function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

export interface ClassList {
  /** The line the string starts on, from one. */
  line: number
  /** Its words. A word joined to a `${}` is left out: `h-${size}` is not a
   * class until it is run. */
  classes: string[]
  sure: boolean
}

/** Functions whose every argument is a list of classes. */
const JOINERS = new Set(['cn', 'clsx', 'twMerge'])

/** Each string the source holds, as a list of words, with where it stands. */
export function classLists(source: Pick<Source, 'file' | 'text'>): ClassList[] {
  const tree = ts.createSourceFile(source.file, source.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const lists: ClassList[] = []
  const visit = (node: ts.Node) => {
    const words = wordsOf(node)
    if (words !== undefined) {
      // A module's name, a directive: never classes, and never worth a look.
      const loose = ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent) || ts.isExpressionStatement(node.parent)
      const place = loose ? 'none' : placeOf(node)
      if (place !== 'none' && words.length > 0) {
        const { line } = tree.getLineAndCharacterOfPosition(node.getStart(tree))
        lists.push({ line: line + 1, classes: words, sure: place === 'sure' })
      }
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return lists
}

/* The words of a string, a template's included; `undefined` for anything that
 * is not one. A word that touches a `${}` is dropped. */
function wordsOf(node: ts.Node): string[] | undefined {
  const MARK = '\u0000'
  let text: string
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text
  else if (ts.isTemplateExpression(node)) text = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(MARK)
  else return undefined
  return text.split(/\s+/).filter((word) => word !== '' && !word.includes(MARK))
}

/* Whether the string at `node` is a class list for certain, may be one, or is
 * plainly something else - read from the chain of what holds it. */
function placeOf(node: ts.Node): 'sure' | 'loose' | 'none' {
  let child: ts.Node = node
  let parent: ts.Node = node.parent
  for (;;) {
    // Passed through unchanged: the string is still the value.
    if (
      ts.isParenthesizedExpression(parent) ||
      ts.isAsExpression(parent) ||
      ts.isSatisfiesExpression(parent) ||
      ts.isArrayLiteralExpression(parent) ||
      ts.isJsxExpression(parent) ||
      ts.isSpreadElement(parent)
    ) {
      child = parent
      parent = parent.parent
      continue
    }
    // `a ? 'x' : 'y'` - either branch, never the condition.
    if (ts.isConditionalExpression(parent)) {
      if (child === parent.condition) return 'none'
      child = parent
      parent = parent.parent
      continue
    }
    // `open && 'x'`, `x || 'y'`, `x ?? 'y'` - the value side; a comparison
    // or any other operator makes the string an operand, not a value.
    if (ts.isBinaryExpression(parent)) {
      const kind = parent.operatorToken.kind
      const joins =
        kind === ts.SyntaxKind.BarBarToken ||
        kind === ts.SyntaxKind.QuestionQuestionToken ||
        (kind === ts.SyntaxKind.AmpersandAmpersandToken && child === parent.right)
      if (!joins) return 'none'
      child = parent
      parent = parent.parent
      continue
    }
    if (ts.isJsxAttribute(parent)) {
      return /(^c|C)lassName$/.test(parent.name.getText()) ? 'sure' : 'none'
    }
    if (ts.isCallExpression(parent)) {
      if (child === parent.expression) return 'none'
      const callee = parent.expression.getText()
      if (JOINERS.has(callee)) return 'sure'
      if (callee === 'cva') return parent.arguments[0] === child ? 'sure' : 'none'
      return 'none'
    }
    if (ts.isPropertyAssignment(parent)) {
      if (child === parent.name) return 'none'
      return inCva(parent) ?? 'loose'
    }
    // Held in a constant, returned, given as a default: may be a class list.
    if (
      ts.isVariableDeclaration(parent) ||
      ts.isReturnStatement(parent) ||
      ts.isBindingElement(parent) ||
      ts.isParameter(parent) ||
      ts.isArrowFunction(parent) ||
      ts.isPropertyDeclaration(parent)
    ) {
      return 'loose'
    }
    return 'none'
  }
}

/* Inside `cva(base, config)`, where the config holds classes: an option of a
 * variant (`variants.size.sm`), or a compound's `class`. A default names an
 * option, and a compound's other keys pick the variants it applies to.
 * `undefined` when the property is not inside a `cva` config at all. */
function inCva(property: ts.PropertyAssignment): 'sure' | 'none' | undefined {
  const path: string[] = []
  let node: ts.Node = property
  while (!ts.isCallExpression(node)) {
    if (ts.isPropertyAssignment(node)) path.unshift(node.name.getText())
    else if (!ts.isObjectLiteralExpression(node) && !ts.isArrayLiteralExpression(node)) return undefined
    node = node.parent
    if (node === undefined) return undefined
  }
  if (node.expression.getText() !== 'cva') return undefined
  if (path[0] === 'variants' && path.length === 3) return 'sure'
  if (path[0] === 'compoundVariants' && path.length === 2 && (path[1] === 'class' || path[1] === 'className')) return 'sure'
  return 'none'
}

/** The utility a class ends in, past its variants: `transition-[top,height]`
 * for `data-[orientation=vertical]:transition-[top,height]`. A colon inside
 * brackets belongs to the value, not to a variant. */
export function utilityOf(name: string): string {
  let depth = 0
  let start = 0
  for (let at = 0; at < name.length; at++) {
    const char = name[at]
    if (char === '[' || char === '(') depth++
    else if (char === ']' || char === ')') depth--
    else if (char === ':' && depth === 0) start = at + 1
  }
  return name.slice(start).replace(/^!/, '')
}

/** A class as it appears in a selector: every character outside a-z, 0-9,
 * `-` and `_` escaped, as `CSS.escape` and Tailwind escape it. */
export function selectorOf(name: string): string {
  return `.${name.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`)}`
}

/** Whether the stylesheet has a rule for the class - the selector, followed by
 * something that ends a class name, so `.transition` is not found inside
 * `.transition-colors`. */
export function hasRule(css: string, name: string): boolean {
  const selector = selectorOf(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`${selector}(?![a-zA-Z0-9_\\\\-])`).test(css)
}
