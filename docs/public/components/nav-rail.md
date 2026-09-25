# NavRail

Source: https://lacodda.github.io/dowel/components/nav-rail

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#nav-rail

The same destinations in all three shapes - press one to move it. The greyed entry is a screen that exists on the roadmap and not in the build.

## Notes

One list, three shapes, because they are the same list — and when they were
three components in two products they drew the current entry three different
ways.

```tsx
<NavRail
  label={t('nav.screens')}
  items={SCREENS.map((id) => ({ id, label: t(`nav.${id}`), icon: <Icon id={id} /> }))}
  activeId={screen}
  render={(item) => <NavLink to={`/${item.id}`} />}
/>
```

**The entries are your links.** `render` takes an item and answers with the
element to draw it as — a router's `NavLink`, a plain `<a>`, whatever you
navigate with — and the rail puts the clothes, the icon and the `aria-current`
on it, the way [Button](/dowel/components/button/) and
[SectionNav](/dowel/components/section-nav/) take a `render`. That keeps the
router out of the registry: a set that imported one would install it in a
product that had chosen another. Without `render` an entry is a button and
`onSelect` says which was pressed.

**The three shapes.** `column` is the desktop rail, running the full height of
the window so its foot sits at the bottom because the nav reaches it. `row` is
a strip of tabs beside a product's name in a header. `bar` is the phone's,
along the bottom where the thumb already is — it carries the safe-area inset
for the home indicator, without which the last row of entries sits under it
with no way to scroll out.

A product usually has two of these on one page: a `row` at `sm` and up and a
`bar` below it. That is why `label` is required and is not drawn — it names
the landmark, so a reader meeting both is told which is which.

**The current destination is announced, not only tinted.** The active entry
carries `aria-current="page"`. Colour says it to nobody who cannot see it.

**A destination that is not built yet is not a link.** `soon` draws the entry
greyed and renders it as a `span`, ignoring `render` — even a disabled button
is still in the tab order on some browsers, and tabbing onto a screen that
does not exist is a dead end. Put the version in `end` to say when it arrives.

**Labels stay on one line.** A rail is a fixed-width column, and a label that
wraps makes one row taller than the rest — which in a two-language product
happens to one entry and not the others.

**Collapsed, the column keeps only its icons.** A work open on screen wants the
width, and the destinations are still needed — so `collapsed` draws the column
as squares around the icons, at `--spacing-rail-compact` (56px), and each
entry's name moves into a [Tooltip](/dowel/components/tooltip/) beside it. The
tooltip's trigger is the entry itself, so it opens on keyboard focus as well as
on hover, and the name stays in the entry off the screen: a reader hears
"Catalogue, current page" whether the rail is wide or narrow.

```tsx
<AppShell sideWidth={collapsed ? 'var(--spacing-rail-compact)' : 'var(--spacing-rail)'} side={
  <NavRail label="Screens" items={screens} activeId={screen} collapsed={collapsed} />
}>
```

The product passes the same `collapsed` to every NavRail and NavGroup it builds
its rail from — one boolean in the one place the rail is assembled. A collapsed
NavGroup is a short hairline, with its word kept for a reader, and an entry with
no icon shows its initial rather than an empty square. The row and bar
shapes have no narrow form: they are made of their names.

**The narrow shapes clear the pointer target floor.** A `row` tab and a `bar`
cell carry `target-min`, so they are at least 24 CSS pixels however small the
text is. A `column` entry is already taller than that.

## Props

### `NavRail`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` | `string` | | Required — names the landmark, not drawn |
| `items` | `{ id, label, icon?, end?, soon? }[]` | | Required |
| `layout` | `column \| row \| bar` | `column` | |
| `activeId` | `string` | | The open screen |
| `render` | `(item) => ReactElement` | | The element each entry is drawn as |
| `onSelect` | `(id) => void` | | Pressed, whatever the entry is drawn as |
| `collapsed` | `boolean` | `false` | Icons only, names in tooltips; `column` only |
| `className` | `string` | | Merged so the caller wins a conflict |

### `NavGroup`, `NavSpacer`

| | |
| --- | --- |
| `NavGroup` | The caption over a run of entries: Library, Team, Admin. `collapsed` draws a hairline instead |
| `NavSpacer` | Pushes what follows to the far end — settings, theme, profile |
