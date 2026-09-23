import type { ReactNode } from 'react'

/*
 * The stand's own furniture, shared by every section.
 *
 * Its own module so a section can live in a file of its own under
 * `sections/` rather than in the one file every component used to share.
 *
 * The caption is `text-dim`, not `text-faint`: `--faint` is verified against
 * the grounds at body size, and at `text-2xs` it measured 3.03:1 in the light
 * theme against AA's 4.5:1. A caption nobody can read is a caption doing
 * nothing.
 */

/** A row of examples with a label above it. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-2xs uppercase tracking-caption text-dim">{label}</div>
      {/* `items-end`, not `items-center`.
        *
        * A row mixes controls of different heights - a bare Input beside a
        * Field, which carries a label above and a hint below. Centred, their
        * boxes float at different heights and the row reads as misaligned;
        * aligned to the bottom, the controls themselves line up and the label
        * simply sits above its own. That is what a form does. */}
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-raise p-4">
        {children}
      </div>
    </div>
  )
}
