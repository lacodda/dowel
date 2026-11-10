import { useState } from 'react'
import { Row } from '../row'
import { SkeletonText } from '../../../registry/ui/skeleton'
import { SectionHeading, SectionNav } from '../../../registry/ui/section-nav'

const settingsSections = [
  {
    id: 'general',
    label: 'General',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'card',
    label: 'Card',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="2" y="3" width="12" height="10" rx="1.5" />
        <path d="M2 7h12" />
      </svg>
    ),
  },
  {
    id: 'data',
    label: 'Data',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <ellipse cx="8" cy="4" rx="5" ry="2" />
        <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" />
      </svg>
    ),
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="3" y="5" width="10" height="8" rx="2" />
        <path d="M8 2v3M6 9h.01M10 9h.01" strokeLinecap="round" />
      </svg>
    ),
  },
]

const settingsHints: Record<string, string> = {
  general: 'Language, theme, and what the window does on close.',
  card: 'Which fields a work shows, and in what order.',
  data: 'Where it lives, and how to take it away.',
  agents: 'The command an assistant runs to reach this workspace.',
}

const workSections = [
  { id: 'overview', label: 'Overview', description: 'Title, owner, tier, and the last time it moved.' },
  {
    id: 'versions',
    label: 'Versions and every draft kept along the way, oldest first, with what changed in each one',
    description: 'Every draft kept, oldest first, with what changed.',
  },
  { id: 'releases', label: 'Releases', description: 'Where this went out, and under what title.' },
]

export function SectionNavSection() {
  const [active, setActive] = useState('data')
  const current = settingsSections.find((section) => section.id === active)!
  const [activeWork, setActiveWork] = useState('overview')
  const currentWork = workSections.find((section) => section.id === activeWork)!

  return (
    <>
      <Row label="the column and the heading it opens - press a row">
        <div className="grid w-full gap-8 md:grid-cols-[11rem_minmax(0,1fr)]">
          <SectionNav label="Settings" items={settingsSections} activeId={active} onSelect={setActive} />
          <div className="min-w-0">
            <SectionHeading title={current.label} description={settingsHints[active]} />
            <SkeletonText lines={3} />
          </div>
        </div>
      </Row>

      <Row label="with a description under each row, and the caption hidden - the heading beside it already says 'Work'">
        <div className="grid w-full gap-8 md:grid-cols-[13rem_minmax(0,1fr)]">
          <SectionNav
            label="Work"
            labelHidden
            items={workSections}
            activeId={activeWork}
            onSelect={setActiveWork}
          />
          <div className="min-w-0">
            <SectionHeading title={currentWork.label} description={currentWork.description} />
            <SkeletonText lines={3} />
          </div>
        </div>
      </Row>
    </>
  )
}
