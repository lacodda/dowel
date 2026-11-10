import { useState } from 'react'
import { cn } from 'dowel-ui'
import { Row } from '../row'
import { ReorderGrip, ReorderIndicator, useReorder } from '../../../registry/ui/reorderable-list'

export function ReorderableListSection() {
  const [order, setOrder] = useState(['Title', 'Owner', 'Score', 'Words', 'Updated'])
  const reorder = useReorder<string>({
    order,
    onMove: (id, to) => {
      const rest = order.filter((entry) => entry !== id)
      setOrder([...rest.slice(0, to), id, ...rest.slice(to)])
    },
  })

  return (
    <Row label="drag a row by its grip - or focus one and press Alt with an arrow">
      <div {...reorder.listProps} className="relative w-64 rounded-md border border-line bg-raise p-1">
        {order.map((id) => (
          <div
            key={id}
            tabIndex={0}
            {...reorder.rowProps(id)}
            className={cn(
              'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-text',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
              reorder.dragging === id && 'opacity-50',
            )}
          >
            <span className="flex-1">{id}</span>
            <ReorderGrip {...reorder.gripProps(id)} title="Drag to move, or Alt + arrows" />
          </div>
        ))}
        <ReorderIndicator offset={reorder.slotOffset} />
      </div>
    </Row>
  )
}
