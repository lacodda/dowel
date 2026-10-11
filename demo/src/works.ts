import type { Status } from '@/components/ui/status-dot'
import { worldNow, type WorkStage } from '../../fixtures/world'

/** Where a work stands, as a dot's status and the word beside it. */
export const STAGE: Record<WorkStage, { status: Status; label: string }> = {
  idea: { status: 'neutral', label: 'Idea' },
  draft: { status: 'info', label: 'Draft' },
  ready: { status: 'warn', label: 'Ready' },
  released: { status: 'good', label: 'Released' },
}

/** The moment the demo is set at: the world's, so "2 hours ago" reads the
 * same in the demo as on the stand. */
export const now = new Date(worldNow)
