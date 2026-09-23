import { useEffect, useState } from 'react'
import { cn } from 'dowel-ui'
import { contrastPairs, contrastRatio, paintedColour } from './contrast'

/*
 * The contrast of every pair the theme promises, for the accent and the
 * theme on screen now.
 *
 * Re-measured whenever the root changes - the accent switch writes
 * `--accent-base` on it, the theme switch a class - so the table follows the
 * header without either telling it. A pass or a miss is said in a word as
 * well as a colour: this is the page that checks legibility, and it would be
 * a poor joke for it to depend on telling green from red.
 */

interface Measured {
  ink: string
  ground: string
  role: string
  needs: number
  ratio: number | null
}

function measure(): Measured[] {
  return contrastPairs.map((pair) => {
    const ink = paintedColour(pair.ink)
    const ground = paintedColour(pair.ground)
    return { ...pair, ratio: ink && ground ? contrastRatio(ink, ground) : null }
  })
}

export function ContrastReport() {
  const [rows, setRows] = useState<Measured[]>([])

  useEffect(() => {
    // Measured after paint, and once more on the next frame: a theme switch
    // swaps a class and the new values resolve a frame later.
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setRows(measure()))
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  const misses = rows.filter((row) => row.ratio !== null && row.ratio < row.needs).length

  return (
    <section aria-labelledby="contrast-heading" className="mt-8">
      <h2 id="contrast-heading" className="mb-1 text-lg font-semibold">
        Contrast, in this accent and this theme
      </h2>
      <p className="mb-3 max-w-prose text-sm text-dim">
        Measured from the colours the browser painted, so the shades derived from the accent are
        included. {rows.length > 0 && (misses === 0 ? 'Every pair clears its floor.' : `${misses} pair(s) below the floor.`)}
      </p>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-raise text-left text-xs text-dim">
              <th className="px-3 py-2 font-medium">Pair</th>
              <th className="px-3 py-2 font-medium">Used for</th>
              <th className="px-3 py-2 text-right font-medium">Ratio</th>
              <th className="px-3 py-2 text-right font-medium">Needs</th>
              <th className="px-3 py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const passes = row.ratio !== null && row.ratio >= row.needs
              return (
                <tr key={`${row.ink}/${row.ground}`} className="border-b border-line last:border-b-0">
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-flex size-6 items-center justify-center rounded-sm border border-line text-xs font-semibold"
                        style={{ background: `var(--${row.ground})`, color: `var(--${row.ink})` }}
                      >
                        Aa
                      </span>
                      <code className="font-mono text-xs">
                        {row.ink} on {row.ground}
                      </code>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-dim">{row.role}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {row.ratio === null ? '-' : `${row.ratio.toFixed(2)}:1`}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-dim tabular-nums">{row.needs}:1</td>
                  <td className={cn('px-3 py-2 font-medium', passes ? 'text-good' : 'text-bad')}>
                    {row.ratio === null ? 'not measured' : passes ? 'passes' : 'below the floor'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
