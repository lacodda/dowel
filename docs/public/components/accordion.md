# Accordion

Source: https://lacodda.github.io/dowel/components/accordion

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#accordion

Single-open by default, then the same list with multiple sections open at once.

## Notes

Each section is [Collapsible](/dowel/components/collapsible/)'s shape - a
header, a trigger, a panel - repeated inside a group that also decides
`single` or `multiple`, which is the one thing a lone `Collapsible` has no
opinion about because it has nothing to be exclusive with.

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@/components/ui/accordion'

<Accordion defaultValue={['shipping']}>
  <AccordionItem value="shipping">
    <AccordionHeader>
      <AccordionTrigger>{t('shipping')}</AccordionTrigger>
    </AccordionHeader>
    <AccordionPanel>{t('shipping.body')}</AccordionPanel>
  </AccordionItem>
  <AccordionItem value="returns">
    <AccordionHeader>
      <AccordionTrigger>{t('returns')}</AccordionTrigger>
    </AccordionHeader>
    <AccordionPanel>{t('returns.body')}</AccordionPanel>
  </AccordionItem>
</Accordion>
```

**The trigger sits inside `AccordionHeader`, a heading - never beside it.**
That is the ARIA accordion pattern, and it is the commonest hand-rolled
accordion bug: a section title that exists only as a button's accessible name
is not a heading a reader can navigate to, and the gap is invisible until
someone actually moves by heading and finds none. A test in this primitive
checks the trigger is inside the heading for exactly that reason.

**`multiple` decides whether opening one section shuts the others.** `false`
(the default, `single`) suits an FAQ, where one answer at a time keeps the
page short; `true` suits a settings page, where every group is independent
of the rest.

**Each trigger is an ordinary tab stop, not one cursor moved by arrow
keys.** Older accordion implementations give the group roving focus - Up and
Down between headers, Home and End to the ends - but the ARIA APG dropped
that pattern in a 2024 guidance update, and the installed Base UI has already
followed it: its trigger carries no keydown handling beyond the native
button's own Enter and Space. [TreeView](/dowel/components/tree-view/), by
contrast, still owns one cursor for its whole tree, because that update did
not touch trees. A reader moves between headers with Tab.

**The trigger's class list is shared, not copied.** `Collapsible` exports
`collapsibleTriggerClasses`, and this primitive reuses it as
`accordionTriggerClasses` rather than restating it, because a header row and
a lone trigger are the same control in two places.

**`disabled` goes where it is put.** On `Accordion` it reaches every item; on `AccordionItem` it closes off that section only. An item with no `value` gets a generated one, so give it one when it has to be open by default.

## Props

### `Accordion`

Groups the items and decides how many can be open. `single` (the default, `multiple={false}`) closes the others when one opens; `multiple` lets any number stay open together. Controlled with `value` and `onValueChange`, or left to manage itself with `defaultValue`.

Base UI's `Accordion.Root`, unchanged under dowel's name.

### `AccordionItem`

One section: a header with its trigger, and the panel it opens.

Base UI's `Accordion.Item`, unchanged under dowel's name.

### `AccordionHeader`

The heading a reader moving by heading lands on, open or shut. The trigger lives inside it, never beside it - a section title that exists only as a button's accessible name is not a heading a reader can navigate to.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3` | Where the sections stand in the page's outline: `3` by default, under a screen's title and a section's. A page that opens straight onto the accordion says `2`. |

And every prop of Base UI's `Accordion.Header`, passed on.

### `AccordionTrigger`

The button that opens and shuts its section's panel. The chevron rotates with `data-panel-open`, the same attribute a reader's `aria-expanded` follows, so the two can never disagree.

Every prop of Base UI's `Accordion.Trigger`, passed on.

### `AccordionPanel`

The section's content. Animates by its own measured height through `--accordion-panel-height`, exactly as `CollapsiblePanel` does - the same reasoning applies unchanged: a fixed max-height guess is either too small for long content or a visible pause for short content, and the measured variable is neither.

Every prop of Base UI's `Accordion.Panel`, passed on.
