/*
 * What a JSON value looks like as a list of rows, with no React in it.
 *
 * The sibling of `tree-rows`, built the same way and for the same reason: a
 * product that wants to count the rows before drawing any of them - to put a
 * viewer inside a VirtualList, to say "1,204 entries" - imports this and never
 * the component.
 *
 * Flattening is also what makes the keyboard simple. Down is the next row of
 * this list and Up the previous, whatever the nesting; a recursive walk at
 * every keystroke asks the same question and answers it differently at each
 * depth.
 */

/** What a value is, for drawing and for deciding whether it opens.
 *
 * `null` is its own kind rather than an absence: in JSON it is a value
 * somebody wrote, and a viewer that shows it as an empty cell says the key is
 * missing when it is present and null - a distinction that decides bugs. */
export type JsonKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

/** Any value `JSON.parse` can return. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface JsonRow {
  /**
   * Where this sits, in JSONPath: `$.items[3].name`.
   *
   * The identity of a row, and deliberately not its index: a row's index
   * changes when a branch above it opens, and anything remembered by index -
   * which rows are open, which is selected - would jump to a different value
   * the moment something above it moved. It is also what a reader copies when
   * they want to point at this value from somewhere else.
   */
  path: string
  /** The key, or the index as written in the path. `null` only for the root. */
  key: string | null
  /** True when the key is an array index rather than an object's name - drawn
   * differently, because `0` as a name and `0` as a position are not the same
   * thing. */
  index: boolean
  kind: JsonKind
  /** The value itself, for a leaf. A branch has none: what it holds is in the
   * rows below it. */
  value?: string | number | boolean | null
  depth: number
  /** How many entries a branch holds, so a closed one can say so without being
   * opened. */
  size?: number
  /** The path of the branch this row sits in, if any. What Left uses to get
   * out of a deep branch in one press. */
  parent?: string
}

export function kindOf(value: JsonValue): JsonKind {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value as JsonKind
}

export function isBranch(kind: JsonKind): boolean {
  return kind === 'object' || kind === 'array'
}

/*
 * A key as it appears in a path.
 *
 * Dot notation where the key is an ordinary identifier, brackets otherwise -
 * which is not decoration. `$.user name` is not a path anything can resolve,
 * and a key containing a dot (`$.a.b` for the single key `"a.b"`) is a path
 * that resolves to the WRONG value silently. Both are common in real data:
 * configuration files and anything exported from a spreadsheet.
 */
function step(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `.${key}`
    : `[${JSON.stringify(key)}]`
}

/**
 * The rows a value shows, in the order the eye and the keyboard travel.
 *
 * Only what is visible: a closed branch contributes its own row and nothing
 * below it. That is what keeps a viewer of a large document cheap - a
 * thousand-entry array that nobody opened costs one row.
 */
export function visibleRows(
  value: JsonValue,
  open: ReadonlySet<string>,
  { root = '$' }: { root?: string } = {},
): JsonRow[] {
  const rows: JsonRow[] = []

  const walk = (
    node: JsonValue,
    path: string,
    key: string | null,
    index: boolean,
    depth: number,
    parent?: string,
  ): void => {
    const kind = kindOf(node)

    if (!isBranch(kind)) {
      rows.push({ path, key, index, kind, value: node as string | number | boolean | null, depth, parent })
      return
    }

    const entries: [string, JsonValue][] = Array.isArray(node)
      ? node.map((item, at) => [String(at), item])
      : Object.entries(node as { [key: string]: JsonValue })

    rows.push({ path, key, index, kind, depth, size: entries.length, parent })

    if (!open.has(path)) return

    for (const [childKey, child] of entries) {
      walk(
        child,
        Array.isArray(node) ? `${path}[${childKey}]` : `${path}${step(childKey)}`,
        childKey,
        Array.isArray(node),
        depth + 1,
        path,
      )
    }
  }

  walk(value, root, null, false, 0)
  return rows
}

/**
 * The paths to open so a document arrives readable.
 *
 * Bounded twice, by depth AND by size, and the second bound is the one that
 * does the work. A depth bound alone reads as sufficient and is not: the cost
 * of opening is measured in ROWS, while depth counts LEVELS, and those track
 * each other only while the branches are small - which is the case nobody
 * needed protecting from.
 *
 * Measured, not reasoned: a payload holding `assets: [1204 entries]` at its
 * top level rendered 1216 rows and 24,000 pixels of scroll on arrival under a
 * depth-2 bound, because the array sits AT depth 2. That is exactly the freeze
 * the bound exists to prevent, produced by the bound itself. The shape that
 * hurts is one huge branch near the surface, and a level count is blindest to
 * precisely that shape.
 *
 * So a branch opens when it is shallow enough AND holds fewer than `size`
 * entries. A branch left shut is not descended through either - what is inside
 * something the reader cannot see does not need deciding about.
 */
export function branchPaths(
  value: JsonValue,
  {
    root = '$',
    depth = 2,
    /** How many entries a branch may hold and still open by itself. Twenty is
     * about a screen: enough that a settings file arrives open, few enough
     * that a list of records arrives as a list of records. */
    size = 20,
  }: { root?: string; depth?: number; size?: number } = {},
): Set<string> {
  const paths = new Set<string>()

  const walk = (node: JsonValue, path: string, level: number): void => {
    const kind = kindOf(node)
    if (!isBranch(kind) || level > depth) return

    const entries: [string, JsonValue][] = Array.isArray(node)
      ? node.map((item, at) => [String(at), item])
      : Object.entries(node as { [key: string]: JsonValue })

    // Too big to open, so it stays shut - and nothing below it is considered:
    // those rows are not going to be drawn either way.
    if (entries.length > size) return

    paths.add(path)

    for (const [key, child] of entries) {
      walk(child, Array.isArray(node) ? `${path}[${key}]` : `${path}${step(key)}`, level + 1)
    }
  }

  walk(value, root, 1)
  return paths
}

/**
 * What a closed branch says about itself: `{ 4 }` or `[ 1204 ]`.
 *
 * The count rather than a preview of the contents. A preview of the first
 * entries reads as though those are all of them, which is the one thing a
 * closed branch must not imply.
 */
export function summarise(row: JsonRow): string {
  if (row.kind === 'array') return `[ ${row.size ?? 0} ]`
  return `{ ${row.size ?? 0} }`
}
