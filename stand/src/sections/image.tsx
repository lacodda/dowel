import { useMemo, useState } from 'react'
import { Button } from '../../../registry/ui/button'
import { Row } from '../row'
import { AspectRatio, Image } from '../../../registry/ui/image'

/*
 * The stand for AspectRatio and Image.
 *
 * No picture here comes from the network - a stand that hotlinks the
 * internet breaks the moment that host is slow, blocked, or gone, and every
 * one of this component's states can be shown without it:
 *
 * - a real picture is a small SVG gradient, inlined as a data URI, so it
 *   paints instantly and still exercises the same `<img>` path a photo
 *   would. Its two stops are read off the live theme with `getComputedStyle`
 *   rather than written down as hex here, so the demo follows the product
 *   accent and the light/dark switch the same way every other primitive on
 *   this page does, and carries no colour of its own for `no-raw-color` to
 *   catch;
 * - the broken state is a source that simply does not resolve to anything
 *   (`broken-image`), which the browser treats exactly like a 404 or a dead
 *   host without this stand depending on one;
 * - the pending state is a source that never arrives at all - kept as
 *   `undefined` in state rather than pointed at a slow host, so the
 *   placeholder is guaranteed to still be there whenever a reader looks,
 *   with a button to resolve it on demand.
 */

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function gradientDataUri(fromToken: string, toToken: string): string {
  const from = readToken(fromToken)
  const to = readToken(toToken)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}" />
        <stop offset="1" stop-color="${to}" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#g)" />
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function ImageSection() {
  const [pendingSrc, setPendingSrc] = useState<string | undefined>(undefined)

  // Read once per mount rather than on every render: the gradient is a demo
  // picture, not a live swatch, and re-reading the theme on every keystroke
  // elsewhere on the page would be work this section has no reason to do.
  const accentPicture = useMemo(() => gradientDataUri('--accent', '--accent-2'), [])
  const warmPicture = useMemo(() => gradientDataUri('--warn', '--bad'), [])

  return (
    <>
      <Row label="a ratio box, reserved before the picture arrives">
        <AspectRatio ratio="video" className="w-64 rounded-lg">
          <Image src={accentPicture} alt="A gradient standing in for a photograph" className="rounded-lg" />
        </AspectRatio>
      </Row>

      <Row label="cover vs. contain - a photo fills the box, a diagram should not be cropped">
        <AspectRatio ratio="square" className="w-40 rounded-lg">
          <Image src={warmPicture} alt="A gradient standing in for a photograph" fit="cover" />
        </AspectRatio>
        <AspectRatio ratio="square" className="w-40 rounded-lg bg-raise">
          <Image src={warmPicture} alt="A gradient standing in for a photograph" fit="contain" />
        </AspectRatio>
      </Row>

      <Row label="a source that never resolves - the placeholder stays until it does">
        <AspectRatio ratio="video" className="w-64 rounded-lg">
          <Image
            key={pendingSrc ?? 'pending'}
            src={pendingSrc}
            alt="A gradient that has not been asked for yet"
            className="rounded-lg"
          />
        </AspectRatio>
        <Button size="sm" className="shrink-0" onClick={() => setPendingSrc(accentPicture)}>
          Load it
        </Button>
      </Row>

      <Row label="a source that fails - a quiet fallback rather than the browser's glyph">
        <AspectRatio ratio="video" className="w-64 rounded-lg">
          <Image
            src="broken-image"
            alt="A picture that fails to load"
            className="rounded-lg"
            fallback={<span className="text-xs">Could not load image</span>}
          />
        </AspectRatio>
      </Row>
    </>
  )
}
