import { useRef, useState } from 'react'
import { Row } from '../row'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScroll,
} from '../../../registry/ui/table'
import { NumberFormat } from '../../../registry/ui/number-format'
import {
  ColumnResizeHandle,
  measureColumns,
  useColumnWidths,
} from '../../../registry/ui/column-resize-handle'
import { works } from './shared'

type SizedColumn = 'title' | 'owner' | 'words'
const sizedColumns: SizedColumn[] = ['title', 'owner', 'words']
const sizedLabels: Record<SizedColumn, string> = { title: 'Title', owner: 'Owner', words: 'Words' }

export function ColumnResizeHandleSection() {
  const [saved, setSaved] = useState('nothing saved yet')
  const widths = useColumnWidths<SizedColumn>({
    initial: {},
    onChange: (next) => setSaved(Object.keys(next).length ? JSON.stringify(next) : 'back to natural widths'),
    fallback: () => 120,
  })
  const header = useRef<HTMLTableRowElement>(null)

  return (
    <>
      <Row label="drag a heading's edge - double-click it to give the column its natural width back">
        <TableScroll className="w-full">
          <Table className={widths.sized ? 'table-fixed' : undefined}>
            <colgroup>
              {sizedColumns.map((id) => (
                <col
                  key={id}
                  style={widths.sized && id !== 'title' ? { width: widths.widthOf(id) } : undefined}
                />
              ))}
            </colgroup>
            <TableHead>
              {/* A plain `<tr>` rather than TableRow: the row is measured by
                  ref before the layout goes fixed, and TableRow passes none. */}
              <tr ref={header} className="border-b border-line">
                {sizedColumns.map((id) => (
                  <TableHeader key={id} data-column={id} numeric={id === 'words'} className="relative">
                    {sizedLabels[id]}
                    <ColumnResizeHandle
                      label={`Resize the ${sizedLabels[id]} column`}
                      hint="Drag to resize, double-click to reset"
                      onStart={() => {
                        if (header.current) widths.measure(measureColumns<SizedColumn>(header.current))
                      }}
                      onResize={(px, done) => widths.resize(id, px, done)}
                      onReset={() => widths.reset(id)}
                    />
                  </TableHeader>
                ))}
              </tr>
            </TableHead>
            <TableBody>
              {works.slice(0, 4).map((work) => (
                <TableRow key={work.id}>
                  <TableCell className="truncate">{work.title}</TableCell>
                  <TableCell className="truncate">{work.owner}</TableCell>
                  <TableCell numeric>
                    <NumberFormat value={work.words} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScroll>
      </Row>

      <Row label="what the hook persists - only when a drag is let go">
        <span className="font-mono text-xs text-dim">{saved}</span>
      </Row>
    </>
  )
}
