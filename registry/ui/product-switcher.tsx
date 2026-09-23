import { cn } from 'dowel-ui'
import type { MarkName } from 'dowel-ui/marks'
import { Menu, MenuItem, MenuPopup, MenuTrigger } from './menu'
import { ProductMark } from './product-mark'

/*
 * ProductSwitcher - the way from one product of the line to the next.
 *
 * The line's products are meant to be used together: kasl-server reads what
 * kasl records, rigger plans what furca commits, a note in scheda cites a
 * track in lyrid. A person moving between them was typing addresses from
 * memory. This is the one place that knows where the others are - the current
 * product's small tile and name on the trigger, and the others in a menu, each
 * with its own tile, so the colour a person already knows the product by is
 * what they look for.
 *
 * The component knows nothing about where a product lives: the list, its
 * order and every address come from the caller, because which products a
 * person has, and on which host, is the deployment's to say. An entry with
 * `href` is a link - it opens with a middle click in a new tab, which a person
 * moving between web products expects - and one with `onSelect` is an action,
 * for a desktop product that opens another by launching it.
 *
 * The current product is not in the menu. It is on the trigger; listing it
 * again offers a choice that changes nothing.
 */

export interface SwitcherProduct {
  product: MarkName
  /** The name, as the product writes it. */
  name: string
  /** A few words on what it is, under the name. */
  description?: string
  /** Where it lives. */
  href?: string
  /** What choosing it does, when it is not a place to go. */
  onSelect?: () => void
}

export interface ProductSwitcherProps {
  /** The product this is. */
  current: MarkName
  /** Its name, shown on the trigger. */
  currentName: string
  /** The others, in the order to offer them. */
  products: SwitcherProduct[]
  /** What the trigger does, for a reader: "Switch product". */
  label: string
  className?: string
}

export function ProductSwitcher({ current, currentName, products, label, className }: ProductSwitcherProps) {
  return (
    <Menu>
      <MenuTrigger
        className={cn(
          'inline-flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm font-semibold text-text',
          'transition-colors duration-quick hover:bg-soft data-[popup-open]:bg-soft',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          className,
        )}
      >
        <ProductMark product={current} size={18} />
        <span>{currentName}</span>
        {/* The name a reader hears is the visible one and then what the
            button does; a space of its own keeps the two words apart. */}
        {' '}
        <span className="sr-only">{label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden className="text-faint">
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </MenuTrigger>
      <MenuPopup align="start" className="min-w-60">
        {products
          .filter((entry) => entry.product !== current)
          .map((entry) => (
            <MenuItem
              key={entry.product}
              onClick={entry.onSelect}
              render={entry.href ? <a href={entry.href} /> : undefined}
              className="gap-2.5 py-1.5"
            >
              <ProductMark product={entry.product} size={20} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-text">{entry.name}</span>
                {entry.description && <span className="truncate text-xs text-dim">{entry.description}</span>}
              </span>
            </MenuItem>
          ))}
      </MenuPopup>
    </Menu>
  )
}
