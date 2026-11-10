import { useState } from 'react'
import { Row } from '../row'
import { SkeletonList } from '../../../registry/ui/skeleton'
import { Button } from '../../../registry/ui/button'
import { SkeletonOf } from '../../../registry/ui/skeleton-of'
import { works } from './shared'

export function SkeletonOfSection() {
  const [pending, setPending] = useState(false)
  const [rows, setRows] = useState(3)

  return (
    <>
      <Row label="load it once, then ask again - the placeholder is the shape that was there">
        <Button onClick={() => setPending((held) => !held)}>
          {pending ? 'Show the content' : 'Pretend it is loading'}
        </Button>
        <Button variant="ghost" onClick={() => setRows((held) => (held === 3 ? 6 : 3))}>
          {rows === 3 ? 'Grow the list to six' : 'Back to three'}
        </Button>
      </Row>

      <div className="mb-4">
        <div className="mb-2 text-2xs uppercase tracking-caption text-dim">
          grow the list, then ask again: the placeholder follows, because it measures rather than
          remembering a number somebody typed
        </div>
        <div className="rounded-lg border border-line bg-raise p-4">
          <SkeletonOf
            pending={pending}
            rowSelector="[data-row]"
            gapClassName="gap-2"
            fallback={<SkeletonList rows={3} />}
          >
            <div className="flex flex-col gap-2">
              {works.slice(0, rows).map((work) => (
                <div
                  key={work.id}
                  data-row
                  className="flex items-center justify-between rounded-md border border-line px-3 py-2"
                >
                  <span className="text-sm text-text">{work.title}</span>
                  <span className="text-xs text-faint">{work.owner}</span>
                </div>
              ))}
            </div>
          </SkeletonOf>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-2xs uppercase tracking-caption text-dim">
          a block with no repeating part is one box, the height the block had
        </div>
        <div className="rounded-lg border border-line bg-raise p-4">
          <SkeletonOf pending={pending}>
            <div className="rounded-md border border-line p-4">
              <div className="text-sm text-text">Harbour lights</div>
              <p className="mt-2 text-xs text-dim">
                A card has no rows to count, so what is remembered is how tall it stood.
              </p>
            </div>
          </SkeletonOf>
        </div>
      </div>
    </>
  )
}
