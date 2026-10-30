/*
 * Recipe: a table people sort and filter.
 *
 * The screen behind every "all of our things" page: a table the reader orders
 * by a column, narrows to the kinds and stages they care about, and walks a
 * page at a time. Each of those is easy alone; the screen is hard because
 * they share state. Sort and filter are decided over every row, and only then
 * is a page cut out - so the sort survives paging, and anything that changes
 * what the pages are made of (a filter, the page size) puts the reader back on
 * page one rather than on a page that may no longer exist.
 *
 * The table does not sort or filter anything itself; `sortRows` and
 * `toggleSort` from `table-sort` are plain functions the product calls. Wire
 * `works` to the product's own rows. For a server-side table keep the same
 * four pieces of state (sort, filters, page, page size) and send them as the
 * query instead of calling `sortRows`. Every word a reader sees is here, in
 * one place, for the product's language to replace.
 */
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FilterPopover } from '@/components/ui/filter-popover'
import { PageSize } from '@/components/ui/page-size'
import { Pagination, pageRange } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  TableScroll,
  TableSortHeader,
} from '@/components/ui/table'
import { sortRows, toggleSort, type Sort, type SortValue } from '@/components/ui/table-sort'

export type Kind = 'song' | 'clip' | 'short' | 'cover'
export type Stage = 'idea' | 'draft' | 'ready' | 'released'

export interface Row {
  id: string
  title: string
  kind: Kind
  stage: Stage
  /** Already a name; the table does not look people up. */
  owner: string
  /** An ISO timestamp. */
  updated: string
  /** Out of ten, or null while nobody has judged it. */
  score: number | null
}

const KINDS: readonly Kind[] = ['song', 'clip', 'short', 'cover']
const STAGES: readonly Stage[] = ['idea', 'draft', 'ready', 'released']
const PAGE_SIZES = [5, 10, 25]

const KIND_WORDS: Record<Kind, string> = { song: 'Song', clip: 'Clip', short: 'Short', cover: 'Cover' }
const STAGE_WORDS: Record<Stage, string> = { idea: 'Idea', draft: 'Draft', ready: 'Ready', released: 'Released' }

type Column = 'title' | 'owner' | 'updated' | 'score'

function valueOf(row: Row, column: Column): SortValue {
  return row[column]
}

const day = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' })

/** Ticks and unticks one value in a list. */
function toggled<T>(chosen: readonly T[], value: T, on: boolean): T[] {
  return on ? [...chosen, value] : chosen.filter((item) => item !== value)
}

/** The funnel shows on hover, on focus, while it narrows and while open. */
const FUNNEL =
  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[active]:opacity-100 data-[popup-open]:opacity-100'

export function TablePeopleSort({ works }: { works: readonly Row[] }) {
  // Five pieces of state decide what is on screen, and nothing else does.
  const [sort, setSort] = useState<Sort<Column>>({ column: 'updated', direction: 'desc' })
  const [kinds, setKinds] = useState<Kind[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]!)
  const [page, setPage] = useState(1)

  // An empty filter means "all", not "none": ticking nothing must not hide
  // everything.
  const narrowed = works.filter(
    (row) => (kinds.length === 0 || kinds.includes(row.kind)) && (stages.length === 0 || stages.includes(row.stage)),
  )
  // Order first, then cut the page. Sorting the page alone would reorder a few
  // rows and leave the table unsorted as a whole.
  const ordered = sortRows(narrowed, sort, valueOf, { locale: 'en', tiebreak: (row) => row.id })
  const shown = ordered.slice((page - 1) * pageSize, page * pageSize)
  const [from, to] = pageRange(page, pageSize, ordered.length)
  const filtering = kinds.length + stages.length > 0

  // Anything that changes what the pages are made of starts again at page
  // one. Page 4 of a different question is usually empty.
  function narrow(change: () => void) {
    change()
    setPage(1)
  }

  const sortProps = {
    sort,
    // Paging is deliberately not touched here: the same table, looked at from
    // the other end, stays on the page the reader is on.
    onSortChange: (column: string) => setSort((now) => toggleSort(now, column as Column)),
  }

  return (
    <section aria-labelledby="works-heading" className="flex flex-col gap-3">
      <h2 id="works-heading" className="text-lg font-semibold text-text">
        Works
      </h2>
      <TableScroll>
        <Table>
          <TableHead>
            <TableRow>
              <TableSortHeader column="title" {...sortProps}>
                Title
              </TableSortHeader>
              <TableHeader className="group">
                <span className="flex items-center gap-1">
                  Kind
                  <FilterPopover
                    title="Kind"
                    label="Filter by kind"
                    active={kinds.length > 0}
                    clearLabel="Clear"
                    onClear={() => narrow(() => setKinds([]))}
                    className={FUNNEL}
                  >
                    {KINDS.map((kind) => (
                      <Checkbox
                        key={kind}
                        checked={kinds.includes(kind)}
                        onCheckedChange={(on) => narrow(() => setKinds((now) => toggled(now, kind, on)))}
                      >
                        {KIND_WORDS[kind]}
                      </Checkbox>
                    ))}
                  </FilterPopover>
                </span>
              </TableHeader>
              <TableHeader className="group">
                <span className="flex items-center gap-1">
                  Stage
                  <FilterPopover
                    title="Stage"
                    label="Filter by stage"
                    active={stages.length > 0}
                    clearLabel="Clear"
                    onClear={() => narrow(() => setStages([]))}
                    className={FUNNEL}
                  >
                    {STAGES.map((stage) => (
                      <Checkbox
                        key={stage}
                        checked={stages.includes(stage)}
                        onCheckedChange={(on) => narrow(() => setStages((now) => toggled(now, stage, on)))}
                      >
                        {STAGE_WORDS[stage]}
                      </Checkbox>
                    ))}
                  </FilterPopover>
                </span>
              </TableHeader>
              <TableSortHeader column="owner" {...sortProps}>
                Owner
              </TableSortHeader>
              <TableSortHeader column="updated" {...sortProps}>
                Updated
              </TableSortHeader>
              <TableSortHeader column="score" numeric {...sortProps}>
                Score
              </TableSortHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.length === 0 ? (
              // Said in the table, under the heading that is still there, and
              // with the way out beside it: an empty grid reads as broken.
              <TableEmpty colSpan={6}>
                <p>{filtering ? 'No works match these filters.' : 'No works yet.'}</p>
                {filtering && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      narrow(() => {
                        setKinds([])
                        setStages([])
                      })
                    }
                  >
                    Clear the filters
                  </Button>
                )}
              </TableEmpty>
            ) : (
              shown.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-text">{row.title}</TableCell>
                  <TableCell>{KIND_WORDS[row.kind]}</TableCell>
                  <TableCell>
                    {/* Words, not only colour: the stage is the message. */}
                    <Badge variant={row.stage === 'released' ? 'good' : 'outline'}>{STAGE_WORDS[row.stage]}</Badge>
                  </TableCell>
                  <TableCell>{row.owner}</TableCell>
                  <TableCell>
                    <time dateTime={row.updated}>{day.format(new Date(row.updated))}</time>
                  </TableCell>
                  <TableCell numeric>{row.score ?? <span className="text-dim">Not judged</span>}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableScroll>
      <div className="flex flex-wrap items-center gap-3">
        <PageSize
          pageSize={pageSize}
          options={PAGE_SIZES}
          label="Rows per page"
          onPageSizeChange={(next) => {
            setPageSize(next)
            setPage(1)
          }}
        >
          Rows per page
        </PageSize>
        <p className="text-sm text-dim tabular-nums">
          {ordered.length === 0 ? '0 works' : `${from}-${to} of ${ordered.length}`}
        </p>
        {ordered.length > pageSize && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={ordered.length}
            onPageChange={setPage}
            className="ml-auto"
            labels={{ region: 'Pages', previous: 'Previous page', next: 'Next page', page: (n) => `Page ${n}` }}
          />
        )}
      </div>
    </section>
  )
}
