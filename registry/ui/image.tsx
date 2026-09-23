import {
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'dowel-ui'

/*
 * AspectRatio and Image.
 *
 * The layout jump a loading picture leaves behind is not a styling defect,
 * it is a missing number: the browser has nowhere to put the box until the
 * file arrives and tells it the pixel size, so everything below the picture
 * slides down and back up. `AspectRatio` is that number, given up front by
 * the caller rather than discovered by the browser - a plain box on CSS
 * `aspect-ratio` that reserves its space the instant it is in the tree, and
 * lets any child (an `<img>`, a map, a video) fill it with `size-full`.
 *
 * `Image` is what goes inside one. It carries its own three-state life, the
 * same shape `Avatar` already uses for its picture - loading, loaded, and
 * failed - because a face and a photograph fail to load for the same
 * reasons and should not fail differently:
 *
 * - **Loading** shows a placeholder in the exact box the ratio already
 *   reserved, built from `Skeleton`'s own look (`animate-pulse bg-soft`)
 *   rather than a new grey rectangle invented for this one component - one
 *   loading language for the set, not two that drift apart over time.
 * - **Loaded** fades the picture in over `--duration-base` rather than
 *   popping it in, because a sudden picture reads as a flash the eye has to
 *   catch; the theme's own reduced-motion media query cuts every duration to
 *   near zero for a reader who asked for that, so nothing extra is wired up
 *   here for it. The `<img>` itself is always in the DOM - hidden with
 *   opacity and `aria-hidden`, not unmounted - so the load event has
 *   something to fire on the first render rather than never.
 * - **Failed** shows `fallback` instead of the browser's own broken-image
 *   glyph, which looks like the product forgot the picture rather than that
 *   the network did.
 *
 * The state a naive version gets wrong is the fourth one: a picture already
 * in the browser's cache is already `complete` the instant the `<img>` mounts,
 * and no `load` event follows - there is nothing left to load. Without the
 * check in the effect below, that picture's placeholder would sit forever,
 * because the one event this component was waiting for already happened
 * before it started listening. The same effect is what makes navigating back
 * to an already-seen picture look instant instead of re-showing a skeleton
 * for a picture that is sitting in memory.
 *
 * Base UI has no image-loading primitive of its own to reach for here - its
 * `Avatar` component is a separate package this workspace does not install,
 * and this line's own `Avatar` already reimplements the same loaded/failed
 * state by hand for the same reason: a picture is common enough, and small
 * enough, that a dependency would cost more than the `useState` it replaces.
 * `Image` follows that precedent rather than inventing a second one.
 */

export const aspectRatioVariants = cva('relative w-full overflow-hidden bg-soft', {
  variants: {
    /** How the box is shaped. `square` and `video` are named because those
     * are the two ratios a product reaches for by name; anything else is a
     * plain number on `ratio`. */
    ratio: {
      square: 'aspect-square',
      video: 'aspect-video',
    },
  },
})

/* `ratio` carries both the named steps and a raw number, which `cva`'s own
 * variant type cannot express - its keys are strings, not numbers. The prop
 * is widened here and split apart in the component instead. */
type AspectRatioVariant = VariantProps<typeof aspectRatioVariants>['ratio'] | number

export interface AspectRatioProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The box's shape: `square`, `video`, or a raw number as width / height -
   * `4 / 3`, `21 / 9` - for anything the named steps do not cover. */
  ratio?: AspectRatioVariant
  children?: ReactNode
}

/** A box that keeps its shape before, during and after whatever fills it
 * loads. `size-full` on the child is the contract: this component reserves
 * the rectangle, the child covers it. */
export function AspectRatio({ ratio, className, children, style, ...props }: AspectRatioProps) {
  const named = typeof ratio === 'number' ? undefined : ratio
  const numeric = typeof ratio === 'number' ? ratio : undefined

  return (
    <div
      className={cn(aspectRatioVariants({ ratio: named }), className)}
      style={numeric ? { aspectRatio: numeric, ...style } : style}
      {...props}
    >
      {children}
    </div>
  )
}

export const imageVariants = cva('size-full', {
  variants: {
    /** How the picture fills a box that is not its own shape. `cover` for a
     * photo standing in for the whole box; `contain` for a logo or a
     * diagram where cropping would cut off the point of it. */
    fit: {
      cover: 'object-cover',
      contain: 'object-contain',
    },
  },
  defaultVariants: { fit: 'cover' },
})

export interface ImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError' | 'placeholder'>,
    VariantProps<typeof imageVariants> {
  /** Required, with no default: a decorative picture says so explicitly with
   * `alt=""` rather than by omission, which is indistinguishable from a
   * picture nobody described yet. */
  alt: string
  /** What stands in the box when the picture fails to load - the product's
   * text or icon, not a default this component would have to write in some
   * one language. */
  fallback?: ReactNode
}

/** A picture that reserves its box, shows `Skeleton`'s placeholder while it
 * loads, fades in once it has, and shows `fallback` instead of a broken-image
 * glyph if it can't be loaded at all. */
export function Image({ fallback, fit, className, src, alt, ...props }: ImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')
  const ref = useRef<HTMLImageElement>(null)

  // A picture already in the browser's cache is already `complete` the
  // instant this mounts, and fires no `load` event of its own - there is
  // nothing left to load. Without this check the placeholder above it would
  // never be told to leave. `useLayoutEffect` rather than `useEffect`, so a
  // cached picture never paints its placeholder for even one frame - only
  // the layout-timed effect runs before the browser has painted.
  useLayoutEffect(() => {
    const img = ref.current
    setStatus(img && img.complete && img.naturalWidth > 0 ? 'loaded' : 'loading')
  }, [src])

  return (
    <span className="relative block size-full overflow-hidden">
      {status !== 'failed' && (
        <img
          {...props}
          ref={ref}
          src={src}
          alt={alt}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
          className={cn(
            imageVariants({ fit }),
            'absolute inset-0 transition-opacity duration-base ease-out',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            className,
          )}
          // Hidden from a reader until there is a picture to announce - an
          // `alt` describing content that is not there yet, or never
          // arrives, is worse than saying nothing.
          aria-hidden={status !== 'loaded'}
        />
      )}
      {status === 'loading' && (
        <span aria-hidden className="absolute inset-0 animate-pulse rounded-md bg-soft" />
      )}
      {status === 'failed' && fallback && (
        <span className="absolute inset-0 flex items-center justify-center text-dim">{fallback}</span>
      )}
    </span>
  )
}
