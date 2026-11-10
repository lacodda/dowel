import { useState } from 'react'
import { useLocale } from 'dowel-ui'
import { Row } from '../row'
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
} from '../../../registry/ui/table'
import { sortRows, toggleSort, type Sort, type SortValue } from '../../../registry/ui/table-sort'
import { NumberFormat } from '../../../registry/ui/number-format'
import { RelativeTime } from '../../../registry/ui/relative-time'
import { standNow } from '../clock'
import { type Work, works } from './shared'

const readWork = (row: Work, column: string): SortValue => row[column as keyof Work]

export function TableSortSection() {
  /* The rule, shown rather than described: the same rows, the same column,
   * both directions - and the two with no score stay at the bottom of each. */
  const locale = useLocale()
  const rows = works.map((work) => `${work.title} ${work.score ?? '—'}`)
  const ascending = sortRows(works, { column: 'score', direction: 'asc' }, readWork, { locale }).map(
    (work) => `${work.title}: ${work.score ?? '—'}`,
  )
  const descending = sortRows(works, { column: 'score', direction: 'desc' }, readWork, { locale }).map(
    (work) => `${work.title}: ${work.score ?? '—'}`,
  )

  return (
    <>
      <Row label="no markup - the same six rows, sorted by score both ways">
        <div className="flex flex-wrap gap-8">
          {[
            ['ascending', ascending],
            ['descending', descending],
          ].map(([label, list]) => (
            <div key={label as string} className="flex flex-col gap-1">
              <div className="text-2xs uppercase tracking-caption text-dim">{label}</div>
              {(list as string[]).map((line) => (
                <div key={line} className="font-mono text-xs text-dim">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Row>
      <Row label="the two with no score are last in both - that is the whole rule">
        <p className="max-w-prose text-xs text-dim">
          Rank absence with the rest and flip the sign, and a descending sort floats every empty
          row to the top: the reader asks for the highest score and is handed the rows that have
          none. {rows.length} rows, two of them unjudged.
        </p>
      </Row>
    </>
  )
}

export function TableSection() {
  const [sort, setSort] = useState<Sort>({ column: 'title', direction: 'asc' })
  const [picked, setPicked] = useState<string>('w3')
  const locale = useLocale()
  const sorted = sortRows(works, sort, readWork, { locale, tiebreak: (work) => work.id })

  return (
    <>
      <Row label="click a heading to reorder - the unjudged rows stay last either way">
        <TableScroll className="w-full">
          <Table>
            <TableHead>
              <TableRow>
                <TableSortHeader
                  column="title"
                  sort={sort}
                  onSortChange={(column) => setSort(toggleSort(sort, column))}
                >
                  Title
                </TableSortHeader>
                <TableSortHeader
                  column="owner"
                  sort={sort}
                  onSortChange={(column) => setSort(toggleSort(sort, column))}
                >
                  Owner
                </TableSortHeader>
                <TableSortHeader
                  column="score"
                  numeric
                  sort={sort}
                  onSortChange={(column) => setSort(toggleSort(sort, column))}
                >
                  Score
                </TableSortHeader>
                <TableSortHeader
                  column="words"
                  numeric
                  sort={sort}
                  onSortChange={(column) => setSort(toggleSort(sort, column))}
                >
                  Words
                </TableSortHeader>
                <TableHeader>Updated</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((work) => (
                <TableRow
                  key={work.id}
                  selected={work.id === picked}
                  onClick={() => setPicked(work.id)}
                  className="cursor-pointer"
                >
                  <TableCell>{work.title}</TableCell>
                  <TableCell>{work.owner}</TableCell>
                  <TableCell numeric>
                    {work.score === null ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <NumberFormat value={work.score} />
                    )}
                  </TableCell>
                  <TableCell numeric>
                    <NumberFormat value={work.words} />
                  </TableCell>
                  <TableCell>
                    <RelativeTime value={work.updated} now={standNow} className="text-dim" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScroll>
      </Row>

      <Row label="the same table in a compact region - one attribute, no prop">
        {/* The density comes from a container rather than from the table, so
            the same markup reads tight here and roomy above. The switch in the
            header does this to the whole stand. */}
        <TableScroll className="w-full" data-density="compact">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader numeric>Words</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {works.slice(0, 4).map((work) => (
                <TableRow key={work.id}>
                  <TableCell>{work.title}</TableCell>
                  <TableCell numeric>
                    <NumberFormat value={work.words} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScroll>
      </Row>

      <Row label="a sticky heading - scroll the box, the heading stays">
        <div tabIndex={0} role="region" aria-label="Recent works" className="h-48 w-64 overflow-y-auto rounded-md border border-line">
          <Table>
            <TableHead sticky>
              <TableRow>
                <TableHeader>Title</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...works, ...works].map((work, index) => (
                <TableRow key={`${work.id}-${index}`}>
                  <TableCell>{work.title}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Row>

      <Row label="empty - the message spans every column and the heading stays put">
        <div className="w-full rounded-md border border-line">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader numeric>Words</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableEmpty colSpan={2}>Nothing here yet</TableEmpty>
            </TableBody>
          </Table>
        </div>
      </Row>
    </>
  )
}
