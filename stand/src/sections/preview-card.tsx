import { Row } from '../row'
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from '../../../registry/ui/preview-card'

export function PreviewCardSection() {
  return (
    <Row label="hover the link">
      <p className="text-sm text-dim">
        The score came from{' '}
        <PreviewCard>
          <PreviewCardTrigger render={<a href="#preview-card" className="text-accent underline underline-offset-2" />}>
            the seven axes
          </PreviewCardTrigger>
          <PreviewCardPopup>
            <div className="text-sm font-semibold text-text">The seven axes</div>
            <p className="mt-1 text-xs text-dim">
              Hook, lyric, arrangement, mix, voice, novelty, fit. Each is scored on its own,
              and the tier follows from all seven.
            </p>
          </PreviewCardPopup>
        </PreviewCard>
        , not from a single number.
      </p>
    </Row>
  )
}
