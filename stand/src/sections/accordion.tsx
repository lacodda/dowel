import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '../../../registry/ui/accordion'
import { Row } from '../row'

/*
 * The stand section for Accordion.
 *
 * The same three sections twice - once `single` (the default), once
 * `multiple` - so the one prop that changes the group's behaviour is the
 * only difference on screen.
 */
function ShippingFaq(props: { multiple?: boolean; defaultValue?: string[] }) {
  return (
    <Accordion className="w-96" {...props}>
      <AccordionItem value="shipping">
        <AccordionHeader>
          <AccordionTrigger>Shipping</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>Orders ship within two business days from our warehouse.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionHeader>
          <AccordionTrigger>Returns</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>Unopened items can be returned within thirty days for a full refund.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="warranty">
        <AccordionHeader>
          <AccordionTrigger>Warranty</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>Every item carries a one-year manufacturer warranty.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

export function AccordionSection() {
  return (
    <>
      <Row label="single - opening a section closes the one that was open">
        <ShippingFaq defaultValue={['shipping']} />
      </Row>

      <Row label="multiple - any number of sections stay open together">
        <ShippingFaq multiple defaultValue={['shipping', 'warranty']} />
      </Row>
    </>
  )
}
