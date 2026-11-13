import { useState } from 'react'
import { Row } from '../row'
import { TileButton } from '../../../registry/ui/tile-button'

/*
 * The stand for TileButton: a strip of frames with one chosen, a folder's file
 * tiles where the picture is the control and the name sits under it, and cards
 * picked from a row. The pictures are drawn in place from the theme's tokens,
 * so the stand loads nothing and follows the accent and the theme.
 */

/** A picture standing in for a frame: a sky, a hill and a sun, in tokens. */
function Frame({ tone }: { tone: 'accent' | 'good' | 'info' | 'warn' }) {
  const sky = { accent: 'fill-accent-soft', good: 'fill-good-soft', info: 'fill-info-soft', warn: 'fill-warn-soft' }[tone]
  const sun = { accent: 'fill-accent', good: 'fill-good', info: 'fill-info', warn: 'fill-warn' }[tone]
  return (
    <svg viewBox="0 0 80 80" className="block size-20" aria-hidden>
      <rect width="80" height="80" className={sky} />
      <circle cx="58" cy="24" r="9" className={sun} />
      <path d="M0 64 L26 40 L44 56 L58 46 L80 64 L80 80 L0 80 Z" className="fill-line-2" />
    </svg>
  )
}

const FRAMES = [
  { id: 1, tone: 'accent' },
  { id: 2, tone: 'info' },
  { id: 3, tone: 'good' },
  { id: 4, tone: 'warn' },
] as const

const STYLES = [
  { id: 'tape', name: 'Warm tape', note: 'Hiss, wow and a soft top end' },
  { id: 'glass', name: 'Clear glass', note: 'Bright, close and dry' },
  { id: 'room', name: 'Big room', note: 'Far away, with a long tail' },
] as const

export function TileButtonSection() {
  const [chosen, setChosen] = useState(2)
  const [style, setStyle] = useState<string>('tape')

  return (
    <>
      <Row label="a strip of frames - the picture is the control, and the chosen one has the doubled accent edge">
        <div className="flex gap-2">
          {FRAMES.map((frame) => (
            <TileButton
              key={frame.id}
              aria-label={`Frame ${frame.id}`}
              selected={chosen === frame.id}
              onClick={() => setChosen(frame.id)}
              className="shrink-0"
            >
              <Frame tone={frame.tone} />
            </TileButton>
          ))}
        </div>
      </Row>

      <Row label="a folder's file tiles - the well is the control, the name stands under it, outside the button">
        <ul className="grid w-88 grid-cols-2 gap-2.5">
          {(['Cover', 'Poster'] as const).map((name, index) => (
            <li key={name} className="overflow-hidden rounded-md border border-line bg-raise">
              <TileButton
                aria-label={`Open ${name}`}
                className="h-26 w-full items-center justify-center rounded-none border-0 bg-bg focus-visible:-outline-offset-2"
              >
                <Frame tone={index === 0 ? 'accent' : 'info'} />
              </TileButton>
              <p className="truncate px-2 py-1.5 text-xs">{name.toLowerCase()}.png</p>
            </li>
          ))}
        </ul>
      </Row>

      <Row label="cards picked from a row - a toggle names its own state with aria-pressed; one is disabled">
        <div className="flex w-full max-w-160 gap-2.5">
          {STYLES.map((item, index) => (
            <TileButton
              key={item.id}
              aria-pressed={style === item.id}
              selected={style === item.id}
              disabled={index === 2}
              onClick={() => setStyle(item.id)}
              className="flex-1 gap-1 bg-raise p-3"
            >
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-xs text-dim">{item.note}</span>
            </TileButton>
          ))}
        </div>
      </Row>
    </>
  )
}
