import { lineProducts } from 'dowel-ui'
import type { MarkName } from 'dowel-ui/marks'
import { LineMark, ProductMark } from '../../../registry/ui/product-mark'
import { Row } from '../row'

const products = lineProducts.map((product) => product.name as MarkName)

export function ProductMarkSection() {
  return (
    <>
      <Row label="L - 64px and up, with the metaphor">
        {products.map((name) => (
          <ProductMark key={name} product={name} size={64} label={name} />
        ))}
      </Row>
      <Row label="M - 28 to 63px, the code alone">
        {products.map((name) => (
          <ProductMark key={name} product={name} size={32} label={name} />
        ))}
      </Row>
      <Row label="S - 27px and under, the filled tile">
        {products.map((name) => (
          <ProductMark key={name} product={name} size={20} label={name} />
        ))}
      </Row>
      <Row label="the line itself, at each level">
        <LineMark size={64} label="lacodda" />
        <LineMark size={32} label="lacodda" />
        <LineMark size={20} label="lacodda" />
      </Row>
    </>
  )
}
