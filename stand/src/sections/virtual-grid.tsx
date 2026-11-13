import { useState } from 'react'
import { Row } from '../row'
import { VirtualGrid, VirtualGridCell, VirtualGridColumn, type VirtualGridView } from '../../../registry/ui/virtual-grid'

/*
 * The stand for VirtualGrid: fifty thousand commits in four columns, one
 * chosen, a heading that stands, and a layer over the rows in view drawing the
 * graph's line and dots - the shape furca's commit graph has. Made, not
 * stored, and the same on every load, so the picture holds still.
 */

const AUTHORS = ['Ines Duarte', 'Tomas Reyes', 'Mira Kos', 'Lio Park']
const WORDS = ['fix', 'feat', 'docs', 'refactor', 'test']
const AREAS = ['table', 'theme', 'calendar', 'tree', 'dialog', 'stand']

const ROW = 26

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

  return (
    <>
      <Row label="fifty thousand commits - Tab in, then the arrows, PageUp and PageDown, Home and End; Enter opens; the graph is a layer over the rows in view">
        <div className="flex w-full max-w-160 flex-col gap-2">
          <VirtualGrid
            label="Commits"
            count={50_000}
            rowHeight={ROW}
            columns="grid-cols-[2rem_1fr_9rem_5rem]"
            header={
              <>
                <VirtualGridColumn>
                  <span className="sr-only">Graph</span>
                </VirtualGridColumn>
                <VirtualGridColumn>Message</VirtualGridColumn>
                <VirtualGridColumn>Author</VirtualGridColumn>
                <VirtualGridColumn>Hash</VirtualGridColumn>
              </>
            }
            renderRow={(index) => (
              <>
                <VirtualGridCell />
                <VirtualGridCell>
                  {WORDS[index % WORDS.length]}({AREAS[index % AREAS.length]}): change {50_000 - index}
                </VirtualGridCell>
                <VirtualGridCell className="text-dim">{AUTHORS[index % AUTHORS.length]}</VirtualGridCell>
                <VirtualGridCell className="font-mono text-xs text-dim">
                  {((index * 2654435761) >>> 0).toString(16).padStart(8, '0').slice(0, 7)}
                </VirtualGridCell>
              </>
            )}
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
          <span className="text-xs text-dim">{opened === null ? 'Nothing opened' : `Opened change ${50_000 - opened}`}</span>
        </div>
      </Row>
    </>
  )
}
