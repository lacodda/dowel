import { Collapsible as Base } from '@base-ui/react/collapsible'
import { cn } from 'dowel-ui'

/*
 * Collapsible.
 *
 * One region of a screen that a reader shows or hides by choice - release
 * notes under a version number, a filter panel, the raw payload under a log
 * line. It differs from Accordion in the way a single light switch differs
 * from a panel of them: there is one trigger and one panel, no group holding
 * several and no rule about how many can be open, because there is only ever
 * one to be open or not.
 *
 * The trigger is a real `<button>` wired to the panel by `aria-controls` and
 * reports `aria-expanded`, which is what lets a reader who cannot see the
 * panel appear still know it did. `Base.Root`'s own `disabled` state reaches
 * both without the caller repeating it on each one.
 *
 * The panel's open and close are driven by height, not by `display` or a
 * fixed max-height guess. Base UI measures the content and publishes it as
 * `--collapsible-panel-height`; the panel transitions `height` between `0`
 * and that variable, so content of any length animates open and shut by its
 * own real size rather than a number picked to be "big enough". The theme's
 * own `prefers-reduced-motion` rule cuts every `transition-duration` to
 * near-zero globally, so nothing extra is wired up here for it - the panel
 * still opens and closes, just without the motion.
 *
 * `keepMounted` is left to the caller by not being reachable at all: this
 * primitive always keeps the panel in the DOM (Base UI's default) rather than
 * unmounting closed content, because a collapsible whose content vanishes on
 * close cannot be found by the browser's own page search, and a product that
 * genuinely wants closed content gone can drop `CollapsiblePanel` from the
 * tree itself.
 */

export const collapsibleTriggerClasses = cn(
  // `group` is what the chevron below hangs its rotation off: the state
  // (`data-panel-open`) lands on this element, not on the svg inside it.
  'group flex w-full cursor-pointer items-center justify-between gap-2 rounded-md py-2 text-left text-sm font-medium text-text',
  'outline-none transition-colors duration-quick',
  'hover:text-accent',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

/** Groups the trigger and the panel. Controlled with `open` and
 * `onOpenChange`, or left to manage itself with `defaultOpen`. */
export const Collapsible = Base.Root

/** The button that opens and shuts the panel. The chevron rotates with
 * `data-panel-open`, the same attribute a reader's `aria-expanded` follows,
 * so the two can never say different things. */
export function CollapsibleTrigger({ className, children, ...props }: Base.Trigger.Props) {
  return (
    <Base.Trigger className={cn(collapsibleTriggerClasses, className)} {...props}>
      {children}
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="size-3.5 shrink-0 text-dim transition-transform duration-quick group-data-[panel-open]:rotate-180"
      >
        <path
          d="M4 6l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Base.Trigger>
  )
}

/** The region that opens and shuts. Animates by its own measured height
 * through `--collapsible-panel-height`, so content of any length - one line
 * or a page of it - opens by its real size rather than a guessed maximum. */
export function CollapsiblePanel({ className, ...props }: Base.Panel.Props) {
  return (
    <Base.Panel
      className={cn(
        'h-(--collapsible-panel-height) overflow-hidden text-sm text-dim',
        'transition-[height] duration-base ease-out',
        'data-[starting-style]:h-0 data-[ending-style]:h-0',
        className,
      )}
      {...props}
    />
  )
}
