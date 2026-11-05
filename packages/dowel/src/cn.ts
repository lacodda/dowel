import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/*
 * The words of the theme that `tailwind-merge` cannot guess.
 *
 * It groups a colour by its prefix, so `bg-accent` against `bg-raise` resolves
 * with no help. A size is another matter: it only knows a value it has been told
 * about, and treats `h-control` as a class it does not recognise. So `h-control
 * h-auto` kept both and CSS source order decided, which is how a wrapping
 * SegmentedControl ran over the field below it. `tests/merge.test.ts` reads this
 * list against the theme, so a token cannot be added without it.
 */
const merge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ['hair', 'list', 'rail', 'rail-compact', 'resize-corner', 'resize-edge', 'titlebar', 'window-button'],
      radius: ['inner'],
      shadow: ['lift', 'raise', 'float'],
      tracking: ['caption'],
    },
    classGroups: {
      // Written by the theme by hand, outside the namespaces of the compiler.
      h: [{ h: ['control', 'control-sm', 'control-lg'] }],
      py: [{ py: ['row'] }],
      size: [{ size: ['target'] }],
      duration: [{ duration: ['quick', 'base', 'slow'] }],
    },
  },
})

/**
 * Join class names, letting the caller win.
 *
 * Every primitive takes a `className` and has to decide what happens when it
 * conflicts with its own: `"px-3" + "px-6"` is two paddings, and CSS resolves
 * that by source order rather than by intent. `tailwind-merge` resolves it by
 * utility group instead, so the last one written wins - which is what someone
 * passing a `className` means.
 */
export function cn(...values: ClassValue[]): string {
  return merge(clsx(values))
}
