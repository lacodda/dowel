/*
 * Rewriting what Base UI renamed.
 *
 * dowel's components are built on Base UI, and a product holds Base UI in two
 * places: the copies of dowel's components, and its own code that reaches for
 * a Base UI part directly. When Base UI renames something, dowel's registry
 * moves with it - and a product's own code, and any copy it changed, does
 * not. These are the renames, as rules, so `dowel codemod` can carry a
 * product across them.
 *
 * Every breaking change Base UI's changelog records since 1.0 has an entry
 * here, by its pull request number: a rule when the change is a rename a
 * machine can make, and a note when it is not - a behaviour, which a person
 * has to read. `base-ui.test.ts` reads the changelog in the installed package
 * and fails on a breaking change with no entry, so the stack update that
 * brings a new Base UI cannot skip this table.
 *
 * Like the token rules, these make exactly the substitutions written here and
 * infer nothing: a rename is applied where the import says the name is Base
 * UI's, and nowhere else.
 */

export type BaseUiRule =
  /** A package or a subpath moved: every import of it is rewritten. */
  | { kind: 'module'; from: string; to: string }
  /** A namespace a module exports was renamed: the import, and the uses of
   * the name in the file when it was imported without an alias. */
  | { kind: 'export'; module: string; from: string; to: string }
  /** A prop of a part was renamed: the attribute is rewritten on elements of
   * that namespace (`<OTPField.Root sanitizeValue>`), whatever it is imported
   * as. */
  | { kind: 'prop'; module: string; namespace: string; from: string; to: string }

export interface BaseUiChange {
  /** The Base UI release it shipped in. */
  version: string
  /** Its pull request, as the changelog names it - the key the test checks. */
  pr: number
  summary: string
  /** What the codemod does about it. None: a person reads `note`. */
  rules: BaseUiRule[]
  /** For a change no rule can make: what to look at. */
  note?: string
}

export const baseUiChanges: readonly BaseUiChange[] = [
  {
    version: '1.0.0',
    pr: 3462,
    summary: 'The package moved from `@base-ui-components/react` to `@base-ui/react`.',
    rules: [{ kind: 'module', from: '@base-ui-components/react', to: '@base-ui/react' }],
  },
  {
    version: '1.3.0',
    pr: 4293,
    summary: 'Drawer is stable: `DrawerPreview` is now `Drawer`.',
    rules: [{ kind: 'export', module: '@base-ui/react/drawer', from: 'DrawerPreview', to: 'Drawer' }],
  },
  {
    version: '1.5.0',
    pr: 4717,
    summary: "OTP Field's `sanitizeValue` is now `normalizeValue`.",
    rules: [
      // Renamed before the namespace lost its `Preview`, so both names carry it.
      { kind: 'prop', module: '@base-ui/react/otp-field', namespace: 'OTPFieldPreview', from: 'sanitizeValue', to: 'normalizeValue' },
      { kind: 'prop', module: '@base-ui/react/otp-field', namespace: 'OTPField', from: 'sanitizeValue', to: 'normalizeValue' },
    ],
  },
  {
    version: '1.6.0',
    pr: 5029,
    summary: 'OTP Field is stable: `OTPFieldPreview` is now `OTPField`.',
    rules: [{ kind: 'export', module: '@base-ui/react/otp-field', from: 'OTPFieldPreview', to: 'OTPField' }],
  },
]

export interface BaseUiEdit {
  readonly line: number
  readonly from: string
  readonly to: string
}

function lineAt(source: string, index: number): number {
  let line = 1
  for (let i = 0; i < index; i += 1) if (source.charCodeAt(i) === 10) line += 1
  return line
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

/** `import { A as B, C } from 'module'` - each named import, by the name it
 * has in the file. */
function namedImports(source: string, module: string): { imported: string; local: string }[] {
  const found: { imported: string; local: string }[] = []
  const statement = new RegExp(`import\\s*(?:type\\s+)?\\{([^}]*)\\}\\s*from\\s*['"]${escape(module)}['"]`, 'g')
  for (const match of source.matchAll(statement)) {
    for (const specifier of match[1]!.split(',')) {
      const parts = specifier.trim().replace(/^type\s+/, '').split(/\s+as\s+/)
      if (!parts[0]) continue
      found.push({ imported: parts[0], local: parts[1] ?? parts[0] })
    }
  }
  return found
}

/** Where a JSX opening tag that starts at `start` ends: the `>` outside any
 * expression or string. */
function tagEnd(source: string, start: number): number {
  let depth = 0
  let quote: string | null = null
  for (let i = start; i < source.length; i += 1) {
    const char = source[i]!
    if (quote) {
      if (char === quote) quote = null
      continue
    }
    if (depth > 0 && (char === '"' || char === "'" || char === '`')) quote = char
    else if (depth === 0 && (char === '"' || char === "'")) quote = char
    else if (char === '{') depth += 1
    else if (char === '}') depth -= 1
    else if (char === '>' && depth === 0) return i
  }
  return source.length
}

/** Apply one rule to the text, recording each edit against the original
 * line it was made on. */
function apply(source: string, rule: BaseUiRule, edits: BaseUiEdit[]): string {
  if (rule.kind === 'module') {
    // `from '@base-ui-components/react/menu'`, `import('…')`, `export … from`.
    const specifier = new RegExp(`(['"])${escape(rule.from)}(?=['"/])`, 'g')
    return source.replace(specifier, (_match, quote: string, offset: number) => {
      edits.push({ line: lineAt(source, offset), from: rule.from, to: rule.to })
      return `${quote}${rule.to}`
    })
  }

  if (rule.kind === 'export') {
    const imports = namedImports(source, rule.module).filter((entry) => entry.imported === rule.from)
    if (imports.length === 0) return source
    let next = source.replace(
      new RegExp(`(import\\s*(?:type\\s+)?\\{[^}]*?)\\b${escape(rule.from)}\\b([^}]*\\}\\s*from\\s*['"]${escape(rule.module)}['"])`, 'g'),
      (_match, before: string, after: string, offset: number) => {
        edits.push({ line: lineAt(source, offset + before.length), from: rule.from, to: rule.to })
        return `${before}${rule.to}${after}`
      },
    )
    // Imported under its own name, the name is used under it too - as a
    // namespace (`DrawerPreview.Root`) or a type (`DrawerPreview.Root.Props`).
    if (imports.some((entry) => entry.local === rule.from)) {
      const original = next
      next = next.replace(new RegExp(`(?<![\\w$.'"])${escape(rule.from)}(?=\\s*\\.)`, 'g'), (_match, offset: number) => {
        edits.push({ line: lineAt(original, offset), from: rule.from, to: rule.to })
        return rule.to
      })
    }
    return next
  }

  // A prop, on the elements of a namespace imported from the module.
  const locals = namedImports(source, rule.module)
    .filter((entry) => entry.imported === rule.namespace)
    .map((entry) => entry.local)
  if (locals.length === 0) return source
  const opening = new RegExp(`<(?:${locals.map(escape).join('|')})\\.[A-Z]\\w*`, 'g')
  let out = ''
  let from = 0
  for (const match of source.matchAll(opening)) {
    const start = match.index
    if (start < from) continue
    const end = tagEnd(source, start + match[0].length)
    const tag = source.slice(start, end)
    const renamed = tag.replace(new RegExp(`(\\s)${escape(rule.from)}(?=[\\s=/>]|$)`, 'g'), (_hit, space: string, offset: number) => {
      edits.push({ line: lineAt(source, start + offset), from: rule.from, to: rule.to })
      return `${space}${rule.to}`
    })
    out += source.slice(from, start) + renamed
    from = end
  }
  return out + source.slice(from)
}

/** Rewrite one file across every Base UI rename. Rules apply in release
 * order, so a name renamed twice arrives at its newest form. */
export function rewriteBaseUi(source: string): { source: string; edits: BaseUiEdit[] } {
  const edits: BaseUiEdit[] = []
  let next = source
  for (const change of baseUiChanges) for (const rule of change.rules) next = apply(next, rule, edits)
  return { source: next, edits }
}
