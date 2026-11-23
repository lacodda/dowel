import { useState } from 'react'
import { Row } from '../row'
import { TableSortButton } from '../../../registry/ui/table'
import { ariaSort, type Sort } from '../../../registry/ui/table-sort'
import { VirtualGrid, VirtualGridCell, VirtualGridColumn, type VirtualGridView } from '../../../registry/ui/virtual-grid'

/*
 * The stand for VirtualGrid: fifty thousand commits in four columns, one
 * chosen, a heading that stands, and a layer over the rows in view drawing the
 * graph's line and dots - the shape furca's commit graph has. Made, not
 * stored, and the same on every load, so the picture holds still.
 *
 * The author column sorts, and the others do not: a heading of both is what
 * showed that a sort button lost the caption's capitals (midda's EntryTable),
 * so the picture holds the two side by side.
 */

const AUTHORS = ['Ines Duarte', 'Tomas Reyes', 'Mira Kos', 'Lio Park']
const WORDS = ['fix', 'feat', 'docs', 'refactor', 'test']
const AREAS = ['table', 'theme', 'calendar', 'tree', 'dialog', 'stand']

const ROW = 26
const COUNT = 50_000

/* The authors in the order a reader sorts them, as indexes into AUTHORS. */
const BY_NAME = AUTHORS.map((_, index) => index).sort((a, b) => AUTHORS[a]!.localeCompare(AUTHORS[b]!, 'en'))

/** The commit shown at a row, under a sort by author. The rows are made
 * rather than stored, so the order is arithmetic: every fourth commit is one
 * author's, and a sort lays the four runs end to end. */
function commitAt(row: number, sort: Sort | undefined): number {
  if (sort === undefined) return row
  const run = COUNT / AUTHORS.length
  const position = sort.direction === 'asc' ? row : COUNT - 1 - row
  return Math.floor(position % run) * AUTHORS.length + BY_NAME[Math.floor(position / run)]!
}

/** The graph for the rows in view: one line down the column, a dot a row. */
function Graph({ start, end, rowHeight }: VirtualGridView) {
  const rows = end - start
  return (
    <svg width="24" height={rows * rowHeight} className="block" aria-hidden>
      <line x1="12" x2="12" y1="0" y2={rows * rowHeight} className="stroke-line-2" strokeWidth="2" />
      {Array.from({ length: rows }, (_, offset) => (
        <circle
          key={start + offset}
          cx="12"
          cy={offset * rowHeight + rowHeight / 2}
          r="4"
          className={(start + offset) % 7 === 0 ? 'fill-accent' : 'fill-dim'}
        />
      ))}
    </svg>
  )
}

export function VirtualGridSection() {
  const [selected, setSelected] = useState<number | null>(2)
  const [opened, setOpened] = useState<number | null>(null)
  const [sort, setSort] = useState<Sort | undefined>(undefined)
  // A third press puts the commits back in the order they were made.
  const reorder = (column: string) =>
    setSort((now) => (now === undefined ? { column, direction: 'asc' } : now.direction === 'asc' ? { column, direction: 'desc' } : undefined))

  return (
    <>
      <Row label="fifty thousand commits - Tab in, then the arrows, PageUp and PageDown, Home and End; Enter opens; the graph is a layer over the rows in view; Author sorts, in the caption's capitals">
        <div className="flex w-full max-w-160 flex-col gap-2">
          <VirtualGrid
            label="Commits"
            count={COUNT}
            rowHeight={ROW}
            columns="grid-cols-[2rem_1fr_9rem_5rem]"
            header={
              <>
                <VirtualGridColumn>
                  <span className="sr-only">Graph</span>
                </VirtualGridColumn>
                <VirtualGridColumn>Message</VirtualGridColumn>
                <VirtualGridColumn aria-sort={ariaSort(sort, 'author')}>
                  <TableSortButton column="author" sort={sort} onSortChange={reorder}>
                    Author
                  </TableSortButton>
                </VirtualGridColumn>
                <VirtualGridColumn>Hash</VirtualGridColumn>
              </>
            }
            renderRow={(row) => {
              const index = commitAt(row, sort)
              return (
                <>
                  <VirtualGridCell />
                  <VirtualGridCell>
                    {WORDS[index % WORDS.length]}({AREAS[index % AREAS.length]}): change {COUNT - index}
                  </VirtualGridCell>
                  <VirtualGridCell className="text-dim">{AUTHORS[index % AUTHORS.length]}</VirtualGridCell>
                  <VirtualGridCell className="font-mono text-xs text-dim">
                    {((index * 2654435761) >>> 0).toString(16).padStart(8, '0').slice(0, 7)}
                  </VirtualGridCell>
                </>
              )
            }}
            selected={selected}
            onSelectedChange={setSelected}
            onActivate={setOpened}
            layer={(view) => (
              <div className="pl-1">
                <Graph {...view} />
              </div>
            )}
            className="h-72 rounded-md border border-line bg-raise"
          />
          <span className="text-xs text-dim">
            {opened === null ? 'Nothing opened' : `Opened change ${COUNT - commitAt(opened, sort)}`}
          </span>
        </div>
      </Row>
    </>
  )
}
