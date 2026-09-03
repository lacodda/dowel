import { useId, useState, type ReactNode } from 'react'
import { cn, lineProducts } from 'dowel-ui'
import { fieldClasses } from './input'

/*
 * ColorField.
 *
 * Picking a colour for something the product stores: a tag, a project, a
 * calendar. Note what that is *not* - it is not choosing the appearance of the
 * interface. The theme decides that, from one accent, and a field that let a
 * reader repaint the chrome would undo the argument the whole system rests on.
 *
 * So the palette comes first and the free field second. The swatches are the
 * line's own fourteen accents plus the four semantic tokens, which is the
 * vocabulary a product already speaks; a value picked there is a *name*
 * (`kilna`, `good`), not a hex, and it keeps meaning the right thing when the
 * theme changes underneath it.
 *
 * Free hex is available because the owner asked for it, and it is worth
 * saying why that does not contradict "no raw colours in components": the rule
 * is about a component hardcoding its own appearance. A colour the reader
 * chose for their own tag is the product's *data* - the same kind of thing as
 * the tag's name - and data does not come from a token vocabulary.
 *
 * The swatch is a real `<input type="radio">` per colour, in a `radiogroup`.
 * That is what makes the arrows walk the palette, what makes the choice
 * announce itself, and what makes the whole group one tab stop.
 */

/** The four semantic colours, which mean the same thing in every product. */
const SEMANTIC = ['good', 'warn', 'bad', 'info'] as const

/** Whether a string is a colour this field would accept as free input. Six
 * digits or three, with the hash - the two forms a reader actually types. */
export function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
}

export interface ColorFieldProps {
  /** The chosen colour: a token name, or a hex string. */
  value: string
  onValueChange: (value: string) => void
  /** Whether the reader may type a colour of their own. */
  allowCustom?: boolean
  /** Names the palette for a screen reader. */
  'aria-label'?: string
  'aria-labelledby'?: string
  /** How a swatch is named. Takes the colour's name, so the product can say
   * "Lime" in its own language rather than shipping ours. */
  swatchLabel?: (name: string) => string
  /** The label on the free-entry box, when `allowCustom` is on. */
  customLabel?: ReactNode
  disabled?: boolean
  className?: string
}

export function ColorField({
  value,
  onValueChange,
  allowCustom,
  swatchLabel,
  customLabel,
  disabled,
  className,
  ...aria
}: ColorFieldProps) {
  const name = useId()
  const customId = useId()

  /* What is in the free box while it is being typed.
   *
   * It is not `value`: half of `#3fa9` is not a colour, and pushing every
   * keystroke up would either reject the reader mid-word or paint the product
   * a colour they were passing through. The box commits when what is in it is
   * a colour. */
  const [draft, setDraft] = useState(isHexColor(value) ? value : '')

  const swatches = [
    ...lineProducts.map((product) => ({ token: product.name, css: product.accent })),
    ...SEMANTIC.map((token) => ({ token, css: `var(--${token})` })),
  ]

  return (
    <div className={cn('flex flex-col gap-2', disabled && 'pointer-events-none opacity-50', className)}>
      <div role="radiogroup" {...aria} className="flex flex-wrap gap-1.5">
        {swatches.map((swatch) => {
          const chosen = value === swatch.token
          return (
            <label
              key={swatch.token}
              className={cn(
                'relative grid size-7 cursor-pointer place-items-center rounded-md border transition-colors',
                chosen ? 'border-accent' : 'border-line hover:border-dim',
                // The ring has to be on the label: the input itself is hidden,
                // so `focus-visible` on it would never be seen.
                'focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent',
              )}
            >
              <input
                type="radio"
                name={name}
                value={swatch.token}
                checked={chosen}
                disabled={disabled}
                onChange={() => onValueChange(swatch.token)}
                className="sr-only"
              />
              <span
                aria-hidden
                className="size-5 rounded"
                /* The one place a colour is set from a value rather than a
                 * class, because the value *is* the colour - a palette that
                 * could not show its own colours would be a list of words. */
                style={{ background: swatch.css }}
              />
              <span className="sr-only">{swatchLabel?.(swatch.token) ?? swatch.token}</span>
            </label>
          )
        })}
      </div>

      {allowCustom && (
        <div className="flex items-center gap-2">
          <label htmlFor={customId} className="text-xs text-dim">
            {customLabel}
          </label>
          <input
            id={customId}
            value={draft}
            disabled={disabled}
            /* No placeholder of its own.
             *
             * The obvious one is a specimen hex, and the lint rule that
             * forbids raw colours flags it - correctly, by the letter. Rather
             * than widen a gate that catches real violations for the sake of
             * one string, the format is shown by the monospace box and named
             * by `customLabel`, which is the product's word anyway. */
            spellCheck={false}
            onChange={(event) => {
              const next = event.target.value
              setDraft(next)
              // Committed only once it is a colour. Anything else is a word in
              // progress, and the product should not be repainted by one.
              if (isHexColor(next)) onValueChange(next)
            }}
            className={cn(fieldClasses, 'h-8 w-28 font-mono text-xs')}
          />
          <span
            aria-hidden
            className="size-5 shrink-0 rounded border border-line"
            style={{ background: isHexColor(draft) ? draft : 'transparent' }}
          />
        </div>
      )}
    </div>
  )
}
