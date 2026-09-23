import type { HTMLAttributes } from 'react'
import { cn, useLocale } from 'dowel-ui'

/*
 * A number, written the way the application's language writes numbers.
 *
 * Two things, and the second is the reason this is a component rather than a
 * call to `toLocaleString` at each site.
 *
 * **The separators are the language's.** A thousand is `1,000` here, `1 000`
 * there and `1.000` somewhere else, and the last one is the same string
 * another reader would read as one. `Intl` knows this and a product does not
 * have to.
 *
 * **The figures line up.** `tabular-nums` makes every digit the same width, so
 * a column of numbers has its digits above each other and the eye can compare
 * lengths without reading. Without it a proportional font gives `1` less room
 * than `8`, the column ripples, and the only way to tell 9,999 from 10,000 is
 * to count. This is the part that gets left out, because it looks fine in the
 * one number a developer tries it on and only fails in a column - which is
 * exactly where numbers live.
 *
 * `Intl.NumberFormat` covers plain numbers, currency, percentages and units
 * with the same options object, so those are not four components. What it does
 * not cover is a "compact" number that must not lose meaning - `1.2M` is a
 * choice about how much precision the reader is owed, and it is made by the
 * caller, in `notation`.
 *
 * **The language is the application's, not the browser's.** Left unset, the
 * locale is `useLocale()`'s answer: a `LocaleProvider` above, else the page's
 * `<html lang>`. It used to be the browser's language, and that is how
 * kasl-server showed an English interface with Russian week headings to a
 * reader whose browser happened to speak Russian. `formatNumber` has no
 * provider to ask, so it takes the locale as a required argument - a call
 * that forgets it does not compile.
 */

/* `style` belongs to both halves of these props and means opposite things:
 * `'currency'` to `Intl`, a CSS object to the DOM. The `Intl` one wins, since
 * it is the option a number component is actually asked for; inline styles are
 * given up in exchange, which costs nothing here - a primitive's appearance is
 * the theme's business, and `className` is still there. */
export interface NumberFormatProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'style'>,
    Intl.NumberFormatOptions {
  /* Required, and a number rather than `number | null`. A row with no value
   * shows whatever the product says absence looks like - a dash, a word, an
   * empty cell - and that is a decision about the data, not about formatting.
   * Accepting `null` here would put a default answer to it inside a primitive,
   * and the default would be wrong wherever absence means something. */
  value: number
  /** The application's language by default - see `useLocale`. */
  locale?: string
}

/** Format a number without rendering it. For a `title`, an `aria-label`, a
 * CSV, or anywhere the string is needed rather than an element. */
export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

export function NumberFormat({
  value,
  locale,
  className,
  // Everything `Intl.NumberFormat` understands, pulled out of the props so
  // what remains can go on the element. Listed rather than inferred, because
  // the two sets overlap - `style` is a valid option and a valid DOM
  // attribute, and spreading `style: 'currency'` onto a `<span>` is a runtime
  // error the type system will not catch.
  style,
  currency,
  currencyDisplay,
  currencySign,
  unit,
  unitDisplay,
  notation,
  compactDisplay,
  signDisplay,
  useGrouping,
  minimumIntegerDigits,
  minimumFractionDigits,
  maximumFractionDigits,
  minimumSignificantDigits,
  maximumSignificantDigits,
  numberingSystem,
  ...props
}: NumberFormatProps) {
  const language = useLocale(locale)
  const formatted = formatNumber(value, language, {
    style,
    currency,
    currencyDisplay,
    currencySign,
    unit,
    unitDisplay,
    notation,
    compactDisplay,
    signDisplay,
    useGrouping,
    minimumIntegerDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    minimumSignificantDigits,
    maximumSignificantDigits,
    numberingSystem,
  })

  return (
    <span className={cn('tabular-nums', className)} {...props}>
      {formatted}
    </span>
  )
}
