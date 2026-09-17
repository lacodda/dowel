import { useMemo, useState, type KeyboardEvent } from 'react'
import { cn } from 'dowel-ui'
import {
  branchPaths,
  isBranch,
  summarise,
  visibleRows,
  type JsonRow,
  type JsonValue,
} from './json-rows'

/*
 * A JSON value, read rather than parsed by eye.
 *
 * What a product reaches for when it has to show a response, a settings file,
 * a webhook payload - data the reader needs to understand, not edit. The
 * alternative it replaces is `JSON.stringify(value, null, 2)` inside a `<pre>`,
 * which is fine for twenty lines and useless for two hundred: nothing folds,
 * nothing is findable, and the shape of the document is somewhere inside the
 * indentation.
 *
 * It is a TREE, and it deliberately does not reuse TreeView. A row here is a
 * key AND a value, and TreeView's row is one `ReactNode` label - pouring JSON
 * into it means the component can no longer colour a value by its type, tell
 * an array index from a name, or offer the two things a reader actually wants
 * (the value at this row, the path to it). What is genuinely shared is the
 * arithmetic of which rows are visible, and that is shared: `json-rows` is the
 * sibling of `tree-rows`, both with no React in them.
 *
 * The keyboard is the ARIA tree pattern, for the reason TreeView states it:
 *
 *   **One tab stop, not one per row.** A document of four hundred rows with a
 *   `tabIndex` on each is four hundred stops between whatever is above it and
 *   whatever is below.
 *
 *   **Right and Left do different things depending on where the cursor is.**
 *   Right opens a closed branch, steps into an open one, does nothing on a
 *   leaf; Left closes an open branch and otherwise jumps to the parent, which
 *   is how a reader gets out of a deep branch without walking back up through
 *   every sibling.
 *
 * Values are coloured with `--syntax-*`, the same tokens a CodeBlock uses, so
 * a string is the same green in both. Colour is never the only signal: a
 * string is quoted, a branch says how many it holds, and null is the word.
 */

export interface JsonViewerProps {
  value: JsonValue
  /** Which branches are open, by path. Uncontrolled if omitted, starting with
   * the top two levels open - the shape of an answer rather than the whole
   * document. */
  open?: ReadonlySet<string>
  onOpenChange?: (open: Set<string>) => void
  /** Told which row was activated, with its path and its value. What a product
   * hangs "copy this" or "go to this setting" on. */
  onActivate?: (row: JsonRow) => void
  /** What a screen reader calls it. Required, and without a default: a string
   * this component invents is a string the product cannot translate. */
  label: string
  /** The path the document starts at, for a viewer showing one field of a
   * larger record. Paths are then written so they still mean something in that
   * record. */
  root?: string
  className?: string
}

export function JsonViewer({
  value,
  open: openProp,
  onOpenChange,
  onActivate,
  label,
  root = '$',
  className,
}: JsonViewerProps) {
  const [openState, setOpenState] = useState(() => branchPaths(value, { root }))
  const open = openProp ?? openState

  const rows = useMemo(() => visibleRows(value, open, { root }), [value, open, root])

  /* The cursor is a path, not an index. An index would point at a different
   * value the moment a branch above it opened - the cursor would appear to
   * jump on its own. */
  const [cursor, setCursor] = useState<string>(root)
  const at = Math.max(
    0,
    rows.findIndex((row) => row.path === cursor),
  )

  const setOpen = (next: Set<string>) => {
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }

  const toggle = (path: string) => {
    const next = new Set(open)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setOpen(next)
  }

  const move = (to: number) => {
    const row = rows[Math.min(Math.max(to, 0), rows.length - 1)]
    if (row !== undefined) setCursor(row.path)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const row = rows[at]
    if (row === undefined) return

    switch (event.key) {
      case 'ArrowDown':
        move(at + 1)
        break
      case 'ArrowUp':
        move(at - 1)
        break
      case 'ArrowRight':
        // Open a closed branch; step into an open one. On a leaf, nothing -
        // rather than falling through to the next row, which would make Right
        // a second Down and lose the reader their place in the nesting.
        if (isBranch(row.kind) && !open.has(row.path)) toggle(row.path)
        else if (isBranch(row.kind)) move(at + 1)
        else return
        break
      case 'ArrowLeft':
        // Close what is open; otherwise leave the branch. The second half is
        // what makes a deep document navigable at all.
        if (isBranch(row.kind) && open.has(row.path)) toggle(row.path)
        else if (row.parent !== undefined) setCursor(row.parent)
        else return
        break
      case 'Home':
        move(0)
        break
      case 'End':
        move(rows.length - 1)
        break
      case 'Enter':
      case ' ':
        if (isBranch(row.kind)) toggle(row.path)
        onActivate?.(row)
        break
      default:
        return
    }
    // Only for a key this component handled: swallowing every keystroke would
    // take Tab and the browser's own shortcuts with it.
    event.preventDefault()
  }

  return (
    <div
      role="tree"
      aria-label={label}
      // The one tab stop. The arrows move a cursor inside it - the arrangement
      // a radio group has, and for the same reason.
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        'overflow-auto rounded-md border border-line bg-soft py-1 font-mono text-xs leading-relaxed',
        // A desktop shell turns selection off; this is data someone came to
        // take away.
        'select-text',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
        className,
      )}
    >
      {rows.map((row) => {
        const branch = isBranch(row.kind)
        const expanded = branch ? open.has(row.path) : undefined

        return (
          <div
            key={row.path}
            role="treeitem"
            aria-level={row.depth + 1}
            aria-expanded={expanded}
            aria-selected={row.path === cursor}
            onClick={() => {
              setCursor(row.path)
              if (branch) toggle(row.path)
              onActivate?.(row)
            }}
            className={cn(
              'flex cursor-default items-baseline gap-1.5 px-2 py-px',
              'hover:bg-softer',
              row.path === cursor && 'bg-accent-soft',
            )}
            // Indentation as padding rather than nested elements: a row four
            // levels down is still a sibling of every other row, which is what
            // lets the whole list be windowed.
            style={{ paddingLeft: `${row.depth * 0.9 + 0.5}rem` }}
          >
            {/* The twisty. A fixed-width slot even on a leaf, so the keys of a
              * branch and a leaf at the same level line up - without it the
              * eye reads the indentation wrong. */}
            <span className={cn('w-2 shrink-0 text-faint', !branch && 'invisible')} aria-hidden>
              {expanded === true ? '▾' : '▸'}
            </span>

            {row.key !== null && (
              <>
                <span className={row.index ? 'text-faint tabular-nums' : 'text-syntax-name'}>
                  {row.index ? row.key : `"${row.key}"`}
                </span>
                <span className="text-syntax-punctuation" aria-hidden>
                  :
                </span>
              </>
            )}

            {branch ? (
              /* A closed branch says how many it holds; an open one says it
               * too, because the count is still the fastest answer to "how big
               * is this" once the reader has scrolled past the first entries. */
              <span className="text-faint">{summarise(row)}</span>
            ) : (
              <Leaf row={row} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/*
 * A value, drawn as what it is.
 *
 * Quotes on a string are not decoration: `"1"` and `1` are different values,
 * and a viewer that draws them alike hides the commonest bug in any JSON
 * payload - a number that arrived as a string. Colour says the same thing
 * faster for those who see it; the quotes say it to everyone.
 */
function Leaf({ row }: { row: JsonRow }) {
  if (row.kind === 'string') {
    return (
      <span className="min-w-0 break-all text-syntax-string">{`"${String(row.value)}"`}</span>
    )
  }
  if (row.kind === 'number') {
    return <span className="text-syntax-number tabular-nums">{String(row.value)}</span>
  }
  if (row.kind === 'boolean') {
    return <span className="text-syntax-keyword">{String(row.value)}</span>
  }
  // `null` in the same colour as a comment: present, and nothing there. Drawn
  // as the word rather than as an empty cell, which would read as a key with
  // no value at all.
  return <span className="text-syntax-comment">null</span>
}
