import { useState } from 'react'
import { ReaderScreen } from '../../../registry/blocks/reader-screen'
import { Button } from '../../../registry/ui/button'
import { Row } from '../row'
import { WidthSwitch, Window, type WindowWidth } from './window'

/*
 * The stand for ReaderScreen: a short story of the stand's harbour, read in a
 * window - scroll it and the bar follows the paragraph being read; sweep a
 * paragraph to the right with a finger and it is marked as known.
 */

const STORY = [
  'The tide tables said four o’clock, and at four the water came over the harbour wall as though it had been waiting for permission.',
  'Nobody on the wall had seen it come so fast. The gulls went up first, then the men with the nets, then the woman who sold tickets for the boat that had stopped running in September.',
  'By five the boats were level with the road. A dog stood on the roof of the bait shop and barked at each one as it went by, as if counting them.',
  'By six the road was gone, and the town that had always been at the end of it was, for one evening, an island with a lighthouse and a bakery and no way off.',
  'The bakery stayed open. Somebody had to.',
  'In the morning the water went back where it had come from, leaving the road a little narrower and the tide tables, everyone agreed, a little less to be trusted.',
]

export function ReaderScreenSection() {
  const [width, setWidth] = useState<WindowWidth>('wide')
  const [known, setKnown] = useState<number | null>(null)
  const [at, setAt] = useState(0)

  return (
    <Row label="scroll the story: the bar follows the paragraph being read; with a finger, sweep a paragraph to the right to mark it">
      <div className="flex w-full flex-col gap-3">
        <WidthSwitch value={width} onChange={setWidth} />
        <Window width={width}>
          <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
            <ReaderScreen
              title="Tide tables"
              byline="Ines Duarte · six minutes"
              count={STORY.length}
              renderParagraph={(index) => STORY[index]}
              onParagraphChange={setAt}
              onSwipe={setKnown}
              marked={known}
              foot={
                <Button size="sm" onClick={() => setKnown(at)}>
                  I know the rest
                </Button>
              }
              after={
                <Button variant="primary" className="self-start">
                  I have read it
                </Button>
              }
              words={{ progress: (paragraph, count) => `Paragraph ${paragraph} of ${count}` }}
            />
          </div>
        </Window>
      </div>
    </Row>
  )
}
