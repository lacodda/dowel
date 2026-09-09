import { cn } from 'dowel-ui'
import { Button } from './button'

/*
 * Paging through a list, and choosing how much of it to see at once.
 *
 * The arithmetic is exported separately from the component for the same reason
 * `table-sort` is a file of its own: a product that pages on the server needs
 * the page numbers and not the buttons, and computing them a second time in a
 * different place is how the two disagree about where the last page ends.
 *
 * Two things this deliberately does not do.
 *
 * It does not fetch, and it does not slice. It is told the page and the total
 * and it says which page was asked for - because whether paging means an
 * `OFFSET` or an `Array.prototype.slice` is the product's business, and a
 * component that guesses gets it wrong for the other one.
 *
 * It does not show every page number. A list of forty pages drawn in full is a
 * row of forty targets nobody aims at; `pageWindow` gives first, last, the
 * neighbourhood of the current page, and a gap where the rest were.
 *
 * How many rows to a page is next door, in `PageSize`. They are two controls
 * that usually sit together and are needed apart often enough to be separate:
 * a list that scrolls for ever wants "how many to load at a time" and no page
 * buttons, and a table with a fixed page size wants the buttons and no choice.
 */

/** A step in the row of pages: a page to go to, or the gap where pages were
 * left out. The gap is not a page and is never clickable - rendering it as a
 * disabled button gives a keyboard three stops that lead nowhere. */
export type PageStep = number | 'gap'

/** How many pages a list of this size has. At least one: a list with nothing
 * in it is on page 1 of 1, not page 1 of 0, and the second reads as broken. */
export function pageCount(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1
  return Math.max(1, Math.ceil(total / pageSize))
}

/** The row of pages to draw: first, last, the current page and its
 * neighbours, with a gap standing in for the rest.
 *
 * `around` is how many pages sit either side of the current one. The row keeps
 * a steady width as the reader pages through it, because a row that grows and
 * shrinks moves the buttons under the pointer.
 */
export function pageWindow(page: number, pages: number, around = 1): PageStep[] {
  const total = Math.max(1, pages)
  const current = Math.min(Math.max(1, page), total)

  // How many places the row has: first, last, a gap at each end, and the
  // neighbourhood between them. This is the number the row always fills.
  const width = around * 2 + 5
  if (total <= width) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  /* The row is built to a fixed number of places, and that is the whole
   * difficulty. A window of a fixed number of *pages* looks right in the
   * middle and comes up short at the ends, where one of the gaps is not
   * needed: the row loses a place, and the "next" button moves as you use it.
   *
   * So the run of middle pages is grown to whatever fills the row - which
   * depends on how many gaps there are, which depends on where the run sits.
   * Rather than iterate towards that (it oscillates on the pages either side
   * of an end, where dropping a gap moves the run and moving the run brings
   * the gap back), each possible number of gaps is tried and the one that
   * describes itself is kept.
   */
  for (const gaps of [2, 1, 0]) {
    // Places for pages: the row, less the two ends, less the gaps.
    const run = width - 2 - gaps
    if (run > total - 2) continue
    // Centre the run on the current page, then slide it inside the ends. The
    // clamp is what pushes the neighbourhood away from an edge rather than
    // clipping it there.
    let from = Math.min(Math.max(2, current - Math.floor((run - 1) / 2)), total - run)

    // A gap that stands for a single page is a lie that costs a click: `1 … 3`
    // hides only page 2, which the row had room for. The fix is to slide the
    // run onto the end rather than to drop the page: leaving it out silently
    // is worse than the gap, because then the row says 1 is followed by 3 and
    // gives no sign that anything is missing.
    if (from === 3) from = 2
    if (from + run - 1 === total - 2) from += 1
    const to = from + run - 1

    const before = from > 2
    const after = to < total - 1
    if (Number(before) + Number(after) !== gaps) continue

    const steps: PageStep[] = [1]
    if (before) steps.push('gap')
    for (let page = from; page <= to; page += 1) steps.push(page)
    if (after) steps.push('gap')
    steps.push(total)
    return steps
  }

  // Unreachable for `total > width`: with no gaps the run covers every middle
  // page, which is the case handled above. Kept so the function has an answer
  // for every input rather than an implicit `undefined`.
  return Array.from({ length: total }, (_, index) => index + 1)
}

/** Which rows this page holds: `[from, to]`, counting from one, for the "1-20
 * of 97" a reader is shown. `to` is clamped to the total, so the last page
 * says what it actually holds rather than what a full page would. */
export function pageRange(page: number, pageSize: number, total: number): [number, number] {
  if (total <= 0) return [0, 0]
  const from = (page - 1) * pageSize + 1
  return [from, Math.min(page * pageSize, total)]
}

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** How many pages either side of the current one. */
  around?: number
  /** What a screen reader hears for the region and its buttons. Required
   * rather than defaulted: a default here would be English shipped inside a
   * primitive, and these are the only words the control has. */
  labels: PaginationLabels
  className?: string
}

export interface PaginationLabels {
  /** Names the whole control, e.g. "Pages". */
  region: string
  previous: string
  next: string
  /** Names one page button. Given the number, because "Page 3" is a sentence
   * only the product's language can build. */
  page: (page: number) => string
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  around = 1,
  labels,
  className,
}: PaginationProps) {
  const pages = pageCount(total, pageSize)
  const current = Math.min(Math.max(1, page), pages)
  const steps = pageWindow(current, pages, around)

  return (
    <nav aria-label={labels.region} className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        aria-label={labels.previous}
        disabled={current <= 1}
        onClick={() => onPageChange(current - 1)}
      >
        ‹
      </Button>

      {steps.map((step, index) =>
        step === 'gap' ? (
          // Not a button, and not `aria-hidden` either: the gap is real
          // information - there are pages here that are not shown - and a
          // reader that skips it hears a jump from 2 to 40 with no reason.
          <span
            // The index is the key on purpose: two gaps in a row are
            // indistinguishable, and there is never more than one at each end.
            key={`gap-${index}`}
            className="px-1 text-dim select-none"
          >
            …
          </span>
        ) : (
          <Button
            key={step}
            variant={step === current ? 'primary' : 'ghost'}
            size="sm"
            // The current page is announced, not only coloured. `aria-current`
            // rather than `aria-selected`, which belongs to a listbox.
            aria-current={step === current ? 'page' : undefined}
            aria-label={labels.page(step)}
            onClick={() => onPageChange(step)}
            className="tabular-nums"
          >
            {step}
          </Button>
        ),
      )}

      <Button
        variant="ghost"
        size="sm"
        aria-label={labels.next}
        disabled={current >= pages}
        onClick={() => onPageChange(current + 1)}
      >
        ›
      </Button>
    </nav>
  )
}
