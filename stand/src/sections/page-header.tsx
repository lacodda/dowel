import { Row } from '../row'
import { SkeletonText } from '../../../registry/ui/skeleton'
import { Button } from '../../../registry/ui/button'
import { Container, PageHeader } from '../../../registry/ui/page-header'
import { Breadcrumbs } from '../../../registry/ui/breadcrumbs'

export function PageHeaderSection() {
  return (
    <>
      <Row label="a heading for a screen, with what acts on the whole of it">
        <div className="w-full rounded-lg border border-line bg-bg p-4">
          <PageHeader
            title="Catalogue"
            description="Everything you have written, newest first."
            actions={
              <>
                <Button variant="ghost" size="sm">
                  Export
                </Button>
                <Button size="sm">New</Button>
              </>
            }
          >
            <Breadcrumbs
              label="Trail"
              items={[
                { id: 'library', label: 'Library' },
                { id: 'catalogue', label: 'Catalogue' },
              ]}
              onSelect={() => undefined}
            />
          </PageHeader>
          <SkeletonText lines={3} />
        </div>
      </Row>

      <Row label="the four measures - how wide the content is allowed to get">
        <div className="flex w-full flex-col gap-3">
          {(['prose', 'default', 'wide', 'full'] as const).map((width) => (
            <div key={width}>
              <div className="mb-1 text-2xs uppercase tracking-caption text-dim">{width}</div>
              <Container width={width}>
                <div className="h-2 rounded-full bg-accent-soft" />
              </Container>
            </div>
          ))}
        </div>
      </Row>
    </>
  )
}
