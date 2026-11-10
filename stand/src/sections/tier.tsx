import { useState } from 'react'
import { Row } from '../row'
import { AxisBar, TierBadge, TierRuler, tierAt, type Tier } from '../../../registry/ui/tier'

const standTiers: Tier[] = [
  { key: 'draft', label: 'Draft', min: 0 },
  { key: 'fair', label: 'Fair', min: 50 },
  { key: 'publishable', label: 'Publishable', min: 78 },
  { key: 'clip', label: 'A clip', min: 90 },
]

const meaningOf = [
  'barely a tune',
  'a few notes worth keeping',
  'hums, but does not stick',
  'catchy in one section',
  'catchy start to finish',
  'a hook worth building the track around',
  'memorable on first listen',
  'a clip from here',
  'carries the whole track',
  'the reason to press play',
]

export function TierSection() {
  const [melody, setMelody] = useState<number | undefined>(7)
  const [words, setWords] = useState<number | undefined>(undefined)
  const [mix, setMix] = useState<number | undefined>(6)
  const [mixPreview, setMixPreview] = useState<number | undefined>(undefined)

  return (
    <>
      <Row label="the verdict">
        <TierBadge label="Draft" status="neutral" />
        <TierBadge label="Fair" status="info" value="63" />
        <TierBadge label="Publishable" value="78.4" />
        <TierBadge label="A clip" status="good" value="91.2" />
      </Row>

      <div className="mb-4">
        <div className="mb-2 text-2xs uppercase tracking-caption text-dim">
          the road - bands to scale, and every label over the boundary it names
        </div>
        <div className="flex flex-col gap-5 rounded-lg border border-line bg-raise p-4">
          {[24, 64, 82, 96].map((score) => (
            <div key={score} className="flex items-center gap-4">
              <span className="w-10 shrink-0 text-xs text-dim">{score}</span>
              <TierRuler
                className="flex-1"
                tiers={standTiers}
                value={score}
                label="Score"
                valueText={`${score} of 100, ${tierAt(standTiers, score)?.label ?? 'unplaced'}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-2xs uppercase tracking-caption text-dim">
          one axis - click a mark, or focus the row and use the arrows; click the mark again to
          unjudge it
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-raise p-4">
          <div className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-dim">Melody</span>
            <AxisBar
              className="flex-1"
              label="Melody"
              scale={10}
              value={melody}
              onChange={setMelody}
              threshold={{ mark: 8, label: 'A clip from 8' }}
              valueText={melody === undefined ? 'unjudged' : String(melody)}
            />
            <span className="w-16 shrink-0 text-right text-xs text-faint">
              {melody ?? 'unjudged'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-dim">Words</span>
            <AxisBar
              className="flex-1"
              label="Words"
              scale={10}
              value={words}
              onChange={setWords}
              valueText={words === undefined ? 'unjudged' : String(words)}
            />
            <span className="w-16 shrink-0 text-right text-xs text-faint">
              {words ?? 'unjudged'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-dim">Mix</span>
            <AxisBar className="flex-1" label="Mix" scale={10} value={6} valueText="6, set elsewhere" />
            <span className="w-16 shrink-0 text-right text-xs text-faint">read only</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-2xs uppercase tracking-caption text-dim">
          what a mark means - hover one to preview it, before committing to anything
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-raise p-4">
          <div className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-dim">Mix</span>
            <AxisBar
              className="flex-1"
              label="Mix"
              scale={10}
              value={mix}
              onChange={setMix}
              onPreview={setMixPreview}
              threshold={{ mark: 8, label: 'A clip from 8' }}
              valueText={mix === undefined ? 'unjudged' : String(mix)}
            />
            <span className="w-16 shrink-0 text-right text-xs text-faint">{mix ?? 'unjudged'}</span>
          </div>
          <p className="m-0 text-xs text-dim">
            {(() => {
              const shown = mixPreview ?? mix
              return shown === undefined || shown < 1 ? 'unjudged' : meaningOf[shown - 1]
            })()}
          </p>
        </div>
      </div>
    </>
  )
}
