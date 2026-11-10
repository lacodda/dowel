import { useState } from 'react'
import { cn } from 'dowel-ui'
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
} from '../../../registry/ui/table'
import { NumberFormat } from '../../../registry/ui/number-format'
import { Checkbox } from '../../../registry/ui/checkbox'
import { FilterPopover } from '../../../registry/ui/filter-popover'
import { works } from './shared'

const owners = ['Ines', 'Ravi', 'Tomas', 'Kit']

export function FilterPopoverSection() {
  const [chosen, setChosen] = useState<string[]>(['Ines'])
  const shown = works.filter((work) => chosen.length === 0 || chosen.includes(work.owner))

  return (
    <Row label="hover the heading for the funnel - it stays, filled, while the column narrows the list">
      <TableScroll className="w-full">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Title</TableHeader>
              <TableHeader className="group">
                <span className="flex items-center gap-1">
                  Owner
                  <FilterPopover
                    title="Owner"
                    label="Filter by owner"
                    active={chosen.length > 0}
                    clearLabel="Clear"
                    onClear={() => setChosen([])}
                    className={cn(
                      'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
                      'data-[active]:opacity-100 data-[popup-open]:opacity-100',
                    )}
                  >
                    {owners.map((owner) => (
                      <Checkbox
                        key={owner}
                        checked={chosen.includes(owner)}
                        onCheckedChange={(checked) =>
                          setChosen(checked ? [...chosen, owner] : chosen.filter((entry) => entry !== owner))
                        }
                      >
                        {owner}
                      </Checkbox>
                    ))}
                  </FilterPopover>
                </span>
              </TableHeader>
              <TableHeader numeric>Words</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((work) => (
              <TableRow key={work.id}>
                <TableCell>{work.title}</TableCell>
                <TableCell>{work.owner}</TableCell>
                <TableCell numeric>
                  <NumberFormat value={work.words} />
                </TableCell>
              </TableRow>
            ))}
            {shown.length === 0 && <TableEmpty colSpan={3}>No works by anyone chosen.</TableEmpty>}
          </TableBody>
        </Table>
      </TableScroll>
    </Row>
  )
}
