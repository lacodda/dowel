import { Row } from '../row'
import { Breadcrumbs } from '../../../registry/ui/breadcrumbs'

const longTrail = [
  { id: 'library', label: 'Library' },
  { id: 'collections', label: 'Collections' },
  { id: 'sea-songs', label: 'Sea songs' },
  { id: 'works', label: 'Works' },
  { id: 'harbour', label: 'Harbour lights' },
]

export function BreadcrumbsSection() {
  return (
    <>
      <Row label="a short trail - the way back is a link, where you stand is not">
        <Breadcrumbs label="Trail" items={longTrail.slice(3)} onSelect={() => undefined} />
      </Row>
      <Row label="a long one, folded - the way out and the place you stand are kept">
        <Breadcrumbs label="Trail" items={longTrail} onSelect={() => undefined} />
      </Row>
      <Row label="the same trail unfolded, for comparison">
        <Breadcrumbs label="Trail" items={longTrail} max={5} onSelect={() => undefined} />
      </Row>
    </>
  )
}
