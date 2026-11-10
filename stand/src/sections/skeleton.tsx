import { Row } from '../row'
import { Skeleton, SkeletonGrid, SkeletonList, SkeletonText } from '../../../registry/ui/skeleton'

export function SkeletonSection() {
  return (
    <>
      <Row label="a paragraph - ragged widths, so it reads as text and not as a loading bar">
        <SkeletonText lines={4} className="w-96" />
      </Row>

      <Row label="a list, which is what most screens are waiting for">
        <SkeletonList rows={4} className="w-96 rounded-md border border-line" />
      </Row>

      <Row label="a grid: the cells and the columns are the caller's, and so is their shape">
        <SkeletonGrid cells={8} columns={4} className="w-96" />
        <SkeletonGrid cells={3} columns={3} cellClassName="aspect-video" className="w-64" />
      </Row>

      <Row label="one block, sized by the thing it stands in for">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-24 w-64" />
      </Row>
    </>
  )
}
