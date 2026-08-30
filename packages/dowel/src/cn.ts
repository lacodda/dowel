import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Join class names, letting the caller win.
 *
 * Every primitive takes a `className` and has to decide what happens when it
 * conflicts with its own: `"px-3" + "px-6"` is two paddings, and CSS resolves
 * that by source order rather than by intent. `twMerge` resolves it by
 * utility group instead, so the last one written wins - which is what someone
 * passing a `className` means.
 *
 * It works with this theme's vocabulary as it stands: `tailwind-merge` groups
 * by the utility prefix rather than by a list of known values, so `bg-accent`
 * against `bg-raise`, or `rounded-md` against `rounded-xl`, resolve correctly
 * even though neither value exists in stock Tailwind. Checked, because the
 * theme drops the stock palette and that could plausibly have broken it.
 */
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values))
}
