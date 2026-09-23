import { Accordion as Base } from '@base-ui/react/accordion'
import { cn } from 'dowel-ui'
import { collapsibleTriggerClasses } from './collapsible'

/*
 * Accordion.
 *
 * A stack of collapsible sections that share one rule about how many can be
 * open at once - an FAQ, the groups in a long settings page, the filters in
 * a sidebar. Each section is `Collapsible`'s shape (a header, a trigger, a
 * panel) repeated inside a group that also decides `single` or `multiple`,
 * which is the one thing a lone `Collapsible` has no opinion about because it
 * has nothing to be exclusive with.
 *
 * Base UI ships this as a genuinely separate primitive rather than several
 * `Collapsible`s wrapped in a loop - the group owns the open value and
 * enforces `single` or `multiple` across every item, which a set of
 * independent collapsibles cannot coordinate - so this is its own file. The
 * two still share one thing worth sharing rather than restating:
 * `collapsibleTriggerClasses`, imported from `./collapsible` rather than
 * copied, because a header row and a lone trigger are the same control in two
 * places and two class lists drift.
 *
 * `AccordionTrigger` sits inside `AccordionHeader`, an `<h3>` - the pattern
 * the ARIA accordion spec asks for so a reader moving by heading lands on
 * every section title, open or shut. Skipping the heading and putting the
 * button straight in the item is the commonest hand-rolled accordion bug,
 * and it is invisible until someone navigates by headings and finds none.
 *
 * Each trigger is an ordinary tab stop, moved between with Tab rather than
 * arrow keys - the installed Base UI has dropped the roving-focus pattern
 * for accordion headers, following the ARIA APG's own 2024 guidance update
 * that removed it, so this is current spec behaviour rather than a gap.
 * `TreeView`, by contrast, still owns one cursor for its whole tree, because
 * that update did not touch trees.
 *
 * `multiple` on the root is what decides whether opening one section shuts
 * the others - `false` (the default) for an FAQ where one answer at a time
 * keeps the page short, `true` for a settings page where every group is
 * independent.
 */

export const accordionTriggerClasses = collapsibleTriggerClasses

/** Groups the items and decides how many can be open. `single` (the
 * default, `multiple={false}`) closes the others when one opens; `multiple`
 * lets any number stay open together. Controlled with `value` and
 * `onValueChange`, or left to manage itself with `defaultValue`. */
export const Accordion = Base.Root

/** One section: a header with its trigger, and the panel it opens. */
export const AccordionItem = Base.Item

/** The `<h3>` a reader moving by heading lands on, open or shut. The trigger
 * lives inside it, never beside it - a section title that exists only as a
 * button's accessible name is not a heading a reader can navigate to. */
export function AccordionHeader({ className, ...props }: Base.Header.Props) {
  return <Base.Header className={cn('text-inherit', className)} {...props} />
}

/** The button that opens and shuts its section's panel. The chevron rotates
 * with `data-panel-open`, the same attribute a reader's `aria-expanded`
 * follows, so the two can never disagree. */
export function AccordionTrigger({ className, children, ...props }: Base.Trigger.Props) {
  return (
    <Base.Trigger className={cn(accordionTriggerClasses, className)} {...props}>
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

/** The section's content. Animates by its own measured height through
 * `--accordion-panel-height`, exactly as `CollapsiblePanel` does - the same
 * reasoning applies unchanged: a fixed max-height guess is either too small
 * for long content or a visible pause for short content, and the measured
 * variable is neither. */
export function AccordionPanel({ className, ...props }: Base.Panel.Props) {
  return (
    <Base.Panel
      className={cn(
        'h-(--accordion-panel-height) overflow-hidden text-sm text-dim',
        'transition-[height] duration-base ease-out',
        'data-[starting-style]:h-0 data-[ending-style]:h-0',
        className,
      )}
      {...props}
    />
  )
}
