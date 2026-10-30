# Collapsible

Source: https://lacodda.github.io/dowel/components/collapsible

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#collapsible

Closed and open, with content of a different length in each.

## Notes

One trigger, one panel, no group deciding how many can be open - because there
is only ever one. That is the whole difference from
[Accordion](/dowel/components/accordion/): a single light switch versus a
panel of them.

```tsx
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible'

<Collapsible defaultOpen>
  <CollapsibleTrigger>{t('releaseNotes')}</CollapsibleTrigger>
  <CollapsiblePanel>{t('releaseNotes.v1_4')}</CollapsiblePanel>
</Collapsible>
```

**The trigger is a real `<button>`**, wired to the panel by `aria-controls`
and reporting `aria-expanded`. That pair is what lets a reader who cannot see
the panel appear still know that it did - the chevron rotating is drawing for
everyone else.

**The panel animates by its own measured height**, not by `display` or a
fixed max-height guess. Base UI measures the content and publishes
`--collapsible-panel-height`; the panel transitions `height` between `0` and
that variable, so a one-line panel and a page-long one both open by their real
size rather than a number picked to be "big enough". Under
`prefers-reduced-motion` the theme's own global rule cuts every
`transition-duration` to near-zero, so nothing extra is wired up here for
it - the panel still opens and closes, just without the motion.

**Closed content stays in the DOM.** That is Base UI's default and this
primitive does not change it: a collapsible whose content vanishes on close
cannot be found by the browser's own page search. A product that genuinely
wants it gone can leave `CollapsiblePanel` out of the tree itself.

`collapsibleTriggerClasses` is exported too - the trigger's own class list,
reused by [Accordion](/dowel/components/accordion/) rather than copied.

## Props

### `Collapsible`

Groups the trigger and the panel. Controlled with `open` and `onOpenChange`, or left to manage itself with `defaultOpen`.

Base UI's `Collapsible.Root`, unchanged under dowel's name.

### `CollapsibleTrigger`

The button that opens and shuts the panel. The chevron rotates with `data-panel-open`, the same attribute a reader's `aria-expanded` follows, so the two can never say different things.

Every prop of Base UI's `Collapsible.Trigger`, passed on.

### `CollapsiblePanel`

The region that opens and shuts. Animates by its own measured height through `--collapsible-panel-height`, so content of any length - one line or a page of it - opens by its real size rather than a guessed maximum.

Every prop of Base UI's `Collapsible.Panel`, passed on.
