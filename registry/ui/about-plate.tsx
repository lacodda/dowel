import type { ReactNode } from 'react'
import { cn } from 'dowel-ui'
import type { MarkName } from 'dowel-ui/marks'
import { LineMark, ProductMark } from './product-mark'

/*
 * AboutPlate - what a product says about itself on its About screen, in the
 * same shape across the line.
 *
 * Every desktop product has an About box and every one of them was written
 * from scratch: the mark at whatever size came to hand, the version as a
 * string in the middle of a sentence, a line about the family somewhere or
 * nowhere. Read side by side they looked like products of different makers,
 * which is the one thing a line of products is supposed not to look like.
 *
 * The plate is the mark at its largest level (the one with the metaphor - the
 * About screen is where a person has the time to see it), the name, the
 * version in the monospace face a version is read in, the one-line promise,
 * whatever the product adds (licence, links, a build hash) and, under a rule,
 * the λ tile with the words the product gives it: this product belongs to the
 * lacodda line. The words are the product's, like every other string here.
 */

export interface AboutPlateProps {
  /** Which product's mark to draw. */
  product: MarkName
  /** The product's name, as it is written. */
  name: string
  /** The version, as the product shows it: "v0.31.0". */
  version: string
  /** The one-line promise, as on the product's README. */
  tagline?: string
  /** What the product adds: licence, links, where its data lives. */
  children?: ReactNode
  /** The words beside λ, e.g. "Part of the lacodda line". */
  lineLabel: string
  /** Where those words lead, if anywhere. */
  lineHref?: string
  className?: string
}

export function AboutPlate({
  product,
  name,
  version,
  tagline,
  children,
  lineLabel,
  lineHref,
  className,
}: AboutPlateProps) {
  const line = (
    <>
      <LineMark size={16} />
      <span>{lineLabel}</span>
    </>
  )

  return (
    <section aria-label={name} className={cn('flex flex-col items-center gap-3 text-center', className)}>
      <ProductMark product={product} size={96} />
      <div className="flex flex-col items-center gap-1">
        <h2 className="m-0 text-lg font-semibold text-text">{name}</h2>
        <span className="font-mono text-xs text-dim">{version}</span>
      </div>
      {tagline && <p className="m-0 max-w-prose text-sm text-dim">{tagline}</p>}
      {children && <div className="flex flex-col items-center gap-1 text-xs text-dim">{children}</div>}
      <div className="mt-2 flex w-full justify-center border-t border-line pt-3">
        {lineHref ? (
          <a
            href={lineHref}
            className={cn(
              'inline-flex items-center gap-2 rounded-sm text-xs text-dim underline-offset-4 hover:text-text hover:underline',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            {line}
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs text-dim">{line}</span>
        )}
      </div>
    </section>
  )
}
