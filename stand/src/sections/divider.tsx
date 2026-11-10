import { Row } from '../row'
import { SkeletonText } from '../../../registry/ui/skeleton'
import { Button } from '../../../registry/ui/button'
import { Divider, SectionHeader } from '../../../registry/ui/divider'

export function DividerSection() {
  return (
    <>
      <Row label="a rule between two parts of a screen">
        <div className="w-full">
          <p className="text-sm text-dim">Above the line.</p>
          <Divider spacing="md" />
          <p className="text-sm text-dim">Below it.</p>
        </div>
      </Row>

      <Row label="a captioned break - a heading for a run that does not deserve one">
        <div className="w-full">
          <p className="text-sm text-dim">Entries from yesterday.</p>
          <Divider label="Today" spacing="md" />
          <p className="text-sm text-dim">Entries from this morning.</p>
        </div>
      </Row>

      <Row label="vertical, in a row of controls - it stretches rather than fills">
        <div className="flex items-center gap-1 rounded-lg border border-line bg-bg px-2 py-1.5">
          <Button variant="ghost" size="sm">
            Cut
          </Button>
          <Divider orientation="vertical" spacing="sm" decorative />
          <Button variant="ghost" size="sm">
            Copy
          </Button>
          <Divider orientation="vertical" spacing="sm" decorative />
          <Button variant="ghost" size="sm">
            Paste
          </Button>
        </div>
      </Row>

      <Row label="a section heading, one level inside the heading of the page">
        <div className="w-full">
          <SectionHeader
            title="Versions"
            description="Every take, newest first."
            actions={<Button size="sm">Add</Button>}
          />
          <SkeletonText lines={2} />
        </div>
      </Row>
    </>
  )
}
