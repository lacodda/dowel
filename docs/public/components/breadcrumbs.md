# Breadcrumbs

Source: https://lacodda.github.io/dowel/components/breadcrumbs

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#breadcrumbs

A short trail and a long one - the long one keeps the way out and the place you stand, and folds what is between.

## Notes

On a list screen the screen's own name is enough; on something opened from it,
it is not. "Works" says nothing about which work, and the way back to the list
is otherwise the browser's back button alone — which a desktop window does not
visibly have.

```tsx
<Breadcrumbs
  label={t('nav.trail')}
  items={[
    { id: 'catalogue', label: t('nav.catalogue') },
    { id: work.id, label: work.title },
  ]}
  render={(crumb) => <Link to={crumb.id === 'catalogue' ? '/catalogue' : `/works/${crumb.id}`} />}
/>
```

**The last crumb is not a link.** That is not styling: it carries
`aria-current="page"`, so a reader hears which of the four is where they stand
rather than a list of four places to go. Everything before it is your own link
element, given through `render` for the reason the rest of the set gives it —
the registry has no business installing a router.

**The trail folds from the middle.** When it is longer than `max`, the first
crumb and the last are kept and what is between becomes an ellipsis: the first
is the way out and the last is where you stand. Wrapping onto a second line
instead would change the height of a title bar. `max` has a floor of three,
below which the fold would drop the thing it exists to keep.

The ellipsis is not a menu. A product whose trail is regularly too long has a
navigation problem that a disclosure on a crumb would only hide; the default
`max` of four is already one more than any screen in the line reaches.

**The separator is not read aloud.** It is punctuation between items that are
already announced as an ordered list — read out, the trail becomes "Works,
greater than, Harbour lights".

**The last crumb is the one that gives.** It may be a sentence-long title, so
it truncates; the crumbs before it are screen names and keep their width, so
the way home does not disappear first.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | What the trail is called for a reader - "Breadcrumb" by convention, but a product with two of them on one screen should say which. |
| `items` (required) | `readonly Crumb[]` |  | The trail, root first. The last item is where the reader stands. |
| `render` | `(item: Crumb) => RenderProp<Record<string, unknown>>` |  | The element a crumb before the last is drawn as. Without it a crumb is a button and `onSelect` says which was pressed. |
| `onSelect` | `(id: string) => void` |  | Called with the id of a crumb before the last when it is pressed, whatever element it is drawn as. |
| `max` | `number` | `4` | How many crumbs are drawn before the middle is folded away. The first and the last are always kept, so this is a floor of three. |

And every prop of `HTMLAttributes<HTMLElement>` except `children`, `onSelect`, passed on.
