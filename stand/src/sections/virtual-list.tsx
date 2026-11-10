import { Row } from '../row'
import { NumberFormat } from '../../../registry/ui/number-format'
import { VirtualList } from '../../../registry/ui/virtual-list'

/* A hundred thousand rows, built once. The number is the point of the
 * component, so the stand shows the real thing rather than a polite hundred. */
const manyRows = Array.from({ length: 100_000 }, (_, index) => ({
  id: index,
  name: `Row ${index + 1}`,
}))

export function VirtualListSection() {
  return (
    <>
      <Row label="a hundred thousand rows, and about a dozen of them in the DOM at a time">
        <VirtualList
          rows={manyRows}
          rowHeight={32}
          rowKey={(row) => row.id}
          label="A hundred thousand rows"
          className="h-64 w-full rounded-md border border-line"
        >
          {(row, index) => (
            <div className="flex h-full items-center justify-between border-b border-line px-3">
              <span>{row.name}</span>
              <NumberFormat value={index} className="text-xs text-dim" />
            </div>
          )}
        </VirtualList>
      </Row>

      <Row label="the same list, taller rows - the height is given, never measured">
        <VirtualList
          rows={manyRows}
          rowHeight={56}
          rowKey={(row) => row.id}
          label="Taller rows"
          className="h-64 w-full rounded-md border border-line"
        >
          {(row) => (
            <div className="flex h-full flex-col justify-center border-b border-line px-3">
              <span>{row.name}</span>
              <span className="text-xs text-dim">a second line, to fill the height</span>
            </div>
          )}
        </VirtualList>
      </Row>

      <Row label="nothing at all, which is a list of zero rows and not a broken one">
        <VirtualList
          rows={[]}
          rowHeight={32}
          rowKey={(row: { id: number }) => row.id}
          label="Empty"
          className="h-24 w-full rounded-md border border-line"
        >
          {() => null}
        </VirtualList>
      </Row>
    </>
  )
}
