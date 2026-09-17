import { useMemo, type HTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'dowel-ui'
import { CopyButton } from './copy-button'
import { countChanges, diffLines, rows, type DiffRow } from './diff-lines'

/*
 * Two drafts of the same text, with what moved between them shown.
 *
 * The question this answers is "how did this read before, and how does it read
 * now" - a version against the one before it, a proposal against what is
 * there, a file against what is on disk. Not a code review: there is no
 * staging, no comment, nothing to accept. It is for looking.
 *
 * SIDE BY SIDE, AND THE ALIGNMENT IS THE WHOLE THING. The obvious way to draw
 * two columns is to filter the change list twice - keep what is not `added` on
 * the left, what is not `removed` on the right - and it is what the product
 * this came from did. Both columns come out individually correct, and they
 * stop lining up at the first insertion: from there the reader is comparing
 * line 4 against line 3, with nothing looking wrong. `rows` in `diff-lines`
 * pairs the changes instead, so the two sides are one list and cannot drift.
 *
 * The alignment has a second half, in the drawing rather than the data: ONE
 * scrolling region holds both columns, and a row is a single grid row spanning
 * them. Two scrollers - the shape this was first written with - come apart the
 * moment a reader touches one of them, which undoes the pairing at the point
 * it matters most. It also means a row is as tall as its taller side, so a
 * wrapped line on the left keeps its partner beside it instead of pushing the
 * two texts out of step.
 *
 * Stacked below a certain width, because two columns each too narrow to hold a
 * line of text answer nothing - every line wraps into three and the comparison
 * is worse than one column would have been. The breakpoint is on the component
 * rather than the viewport (`@container`), since a diff in a side panel is
 * narrow on a wide screen.
 *
 * Colour is never the message. A changed line carries a marker glyph in the
 * gutter - `+`, `-`, `~` - so the comparison reads without hue, in a
 * screenshot, and for the eighth of men who would otherwise see two tinted
 * greys.
 */

export const diffViewVariants = cva('@container flex flex-col gap-2 text-sm', {
  variants: {
    size: {
      sm: '[--diff-max:16rem]',
      md: '[--diff-max:28rem]',
      /** No ceiling: the comparison is as tall as it is, and the page scrolls.
       * For a diff that IS the screen rather than sitting on one. */
      full: '[--diff-max:none]',
    },
  },
  defaultVariants: { size: 'md' },
})

export interface DiffViewProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onCopy'>,
    VariantProps<typeof diffViewVariants> {
  before: string
  after: string
  /** What each side is called - a version name, a date, "on disk". */
  beforeLabel: string
  afterLabel: string
  /** The line above the comparison: how much moved. The component counts, the
   * product says it in words - a count is a plural, and a plural belongs to a
   * language the component does not know. Given the two numbers, and left out
   * entirely when there is nothing to say. */
  summary?: (counts: { added: number; removed: number }) => ReactNode
  /** Numbers down each side. On by default: a comparison is usually read in
   * order to go and change something, and the number is how the reader finds
   * the place. */
  numbered?: boolean
  /**
   * Brings a copy button to each side's header, and names it.
   *
   * A function of the side's label rather than a string, because the two
   * buttons need distinguishable names - "Copy" twice on one screen tells a
   * reader using them which is which only by where they are, which is what a
   * label exists to avoid. Sticking the two together here (`${copy}: ${side}`)
   * would invent a phrase in a grammar this component does not know.
   */
  copyLabel?: (side: string) => string
  /** Announced after a successful copy. Required alongside `copyLabel`. */
  copiedLabel?: string
  /** Told what happened, for a product that wants its own toast. */
  onCopy?: (ok: boolean) => void
}

export function DiffView({
  before,
  after,
  beforeLabel,
  afterLabel,
  summary,
  numbered = true,
  copyLabel,
  copiedLabel = '',
  onCopy,
  size,
  className,
  ...props
}: DiffViewProps) {
  const changes = useMemo(() => diffLines(before, after), [before, after])
  const paired = useMemo(() => rows(changes), [changes])
  const counts = useMemo(() => countChanges(changes), [changes])

  /* Wide enough for the largest number either side will show. Sized from the
   * row count rather than from each column's own last number, so the two
   * gutters are the same width and the texts start at the same offset. */
  const width = String(paired.length).length

  return (
    <div className={cn(diffViewVariants({ size }), className)} {...props}>
      {summary !== undefined && <p className="text-xs text-dim">{summary(counts)}</p>}

      <div className="overflow-hidden rounded-lg border border-line">
        {/*
         * The headers sit outside the scroller, in the same two tracks, so
         * they stay put while the text moves under them. `grid-cols-1` until
         * the container is wide enough for two columns of prose.
         */}
        <div className="group grid grid-cols-1 border-b border-line bg-softer text-2xs font-medium text-dim @3xl:grid-cols-2">
          <span className="flex items-center gap-2 px-3 py-1">
            <span className="grow truncate">{beforeLabel}</span>
            {copyLabel !== undefined && (
              <CopyButton
                value={before}
                label={copyLabel(beforeLabel)}
                copiedLabel={copiedLabel}
                onCopy={onCopy}
              />
            )}
          </span>
          {/* Hidden while stacked: with one column the two headers would sit
            * one above the other with all of the left-hand text between them,
            * which labels nothing. Each row carries its own side marker there
            * instead. */}
          <span className="hidden items-center gap-2 border-l border-line px-3 py-1 @3xl:flex">
            <span className="grow truncate">{afterLabel}</span>
            {copyLabel !== undefined && (
              <CopyButton
                value={after}
                label={copyLabel(afterLabel)}
                copiedLabel={copiedLabel}
                onCopy={onCopy}
              />
            )}
          </span>
        </div>

        <div
          /* The one scrolling region. Focusable because it scrolls: a region a
           * pointer can reach and a keyboard cannot is the usual way a long
           * diff hides its end. */
          tabIndex={0}
          className={cn(
            'max-h-[var(--diff-max)] overflow-auto py-1 font-mono text-xs leading-relaxed',
            // A desktop shell turns selection off; a comparison is read in
            // order to copy something out of it.
            'select-text',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
          )}
        >
          <div className="grid grid-cols-1 @3xl:grid-cols-2">
            {paired.map((row, index) => (
              // Lines repeat and reorder, so the text is not an identity; the
              // list is rebuilt whole whenever either side changes.
              <Row key={index} row={row} numbered={numbered} width={width} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* The glyph in the gutter, per side. A deletion is only a deletion on the left
 * - on the right that same row is a gap - so the marker depends on which
 * column is being drawn, not on the change alone. `~` for a rewritten line,
 * which is one event with a side each. */
export function marker(row: DiffRow, side: 'before' | 'after'): string {
  const text = side === 'before' ? row.before : row.after
  if (row.kind === 'same' || text === null) return ' '
  if (row.kind === 'removed' && row.after !== null) return '~'
  return side === 'before' ? '-' : '+'
}

/*
 * One row, as its two cells.
 *
 * They are siblings in the grid rather than a wrapper holding both, because a
 * wrapper would become the grid item and the columns would stop being columns.
 * `display: contents` would do it too and is worse: it removes the element
 * from the accessibility tree in several browsers, taking any grouping with
 * it.
 */
function Row({ row, numbered, width }: { row: DiffRow; numbered: boolean; width: number }) {
  return (
    <>
      <Side row={row} side="before" numbered={numbered} width={width} />
      <Side row={row} side="after" numbered={numbered} width={width} />
    </>
  )
}

function Side({
  row,
  side,
  numbered,
  width,
}: {
  row: DiffRow
  side: 'before' | 'after'
  numbered: boolean
  width: number
}) {
  const text = side === 'before' ? row.before : row.after
  const line = side === 'before' ? row.beforeLine : row.afterLine
  const changed = row.kind !== 'same' && text !== null

  return (
    <div
      className={cn(
        'flex px-2',
        // The rule between the columns belongs to the right-hand cells, so it
        // runs the full height of the text rather than stopping at the last
        // row of a short column. Gone while stacked, where there is no second
        // column for it to divide.
        side === 'after' && 'hidden @3xl:flex @3xl:border-l @3xl:border-line',
        changed && (side === 'before' ? 'bg-bad-soft text-bad' : 'bg-good-soft text-good'),
      )}
    >
      {numbered && (
        // Never part of a selection: a reader copying a column wants the text,
        // not the text with a number welded to the front of every line.
        <span
          className="mr-2 shrink-0 select-none text-right tabular-nums text-faint"
          style={{ width: `${width}ch` }}
          aria-hidden
        >
          {line ?? ''}
        </span>
      )}

      {/* The second channel, so the comparison reads without colour.
        * `aria-hidden` because a screen reader is told what changed by the
        * text itself; a spoken "minus" before every removed line is noise. */}
      <span className="mr-1.5 shrink-0 select-none" aria-hidden>
        {marker(row, side)}
      </span>

      <span className="min-w-0 whitespace-pre-wrap break-words">
        {/* A blank line still needs its height, or a gap opposite an insertion
          * collapses and the two columns come out of step by exactly the thing
          * the pairing prevented. */}
        {text === null || text === '' ? ' ' : text}
      </span>
    </div>
  )
}
