/*
 * The props of the item a page is about, from `registry/props.json` - read
 * from the TypeScript by `tools/build-props.mjs`, never written by hand.
 *
 * Read here once so the page and its table of contents agree about whether
 * there is a table to show.
 */
import props from '../../../registry/props.json'

export interface Source {
  kind: 'base-ui' | 'react' | 'dowel' | 'other'
  /** Base UI: the part, `Select.Popup`. */
  part?: string
  module?: string
  /** dowel: the item it comes from, and its type or component name. */
  item?: string
  name?: string
  /** React and the rest: the type as the source writes it. */
  type?: string
  /** The props an `Omit<…>` takes away from it. */
  omits?: string[]
}

export interface Prop {
  name: string
  type: string
  required?: boolean
  /** Required only together with these: given one, give the rest. */
  requiredWith?: string[]
  default?: string
  description?: string
}

export interface Component {
  name: string
  description?: string
  /** Another component under this one's name, unchanged. */
  is?: Source
  props?: Prop[]
  inherits?: Source[]
}

const items = props as Record<string, { dir: 'ui' | 'blocks'; components: Component[] }>

/** The components an item exports, in the order its file declares them. */
export function componentsOf(name: string): Component[] {
  return items[name]?.components ?? []
}

/** Where a source is documented. */
export function sourceHref(source: Source, base: string): string | null {
  if (source.kind === 'base-ui' && source.module) {
    const page = source.module.split('/').at(-1)
    return page && page !== 'react' ? `https://base-ui.com/react/components/${page}` : 'https://base-ui.com/react/overview/quick-start'
  }
  if (source.kind === 'dowel' && source.item) {
    const dir = items[source.item]?.dir === 'blocks' ? 'blocks' : 'components'
    return `${base}/${dir}/${source.item}/`
  }
  return null
}
