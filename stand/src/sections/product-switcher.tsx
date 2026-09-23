import { ProductSwitcher } from '../../../registry/ui/product-switcher'
import { Row } from '../row'

export function ProductSwitcherSection() {
  return (
    <Row label="on a web product's header - places are links, the desktop tracker is an action">
      <div className="flex h-12 w-full items-center gap-3 rounded-lg border border-line bg-bg px-3">
        <ProductSwitcher
          current="kasl-server"
          currentName="kasl-server"
          label="Switch product"
          products={[
            { product: 'kasl', name: 'kasl', description: 'The tracker on your machine', onSelect: () => undefined },
            { product: 'rigger', name: 'rigger', description: 'Projects and what is next', href: '#product-switcher' },
            { product: 'austeris', name: 'austeris', description: 'Household accounts', href: '#product-switcher' },
            { product: 'rhapsod', name: 'rhapsod', description: 'A reader for your library', href: '#product-switcher' },
          ]}
        />
        <span className="text-sm text-dim">Team dashboard</span>
      </div>
    </Row>
  )
}
