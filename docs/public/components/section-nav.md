# SectionNav

Source: https://lacodda.github.io/dowel/components/section-nav

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#section-nav

A settings column with icons and a current section, beside the heading it opens - press a row to move.

## Notes

A settings screen is the usual case: five or six sections, each its own
address so it can be linked to and the back button walks between them, listed
down the left with the current one tinted. Every product draws the same
column, and every product draws the active row a little differently — which
is exactly the drift a shared list exists to stop.

```tsx
<div className="grid gap-8 md:grid-cols-[11rem_minmax(0,1fr)]">
  <SectionNav
    label={t('settings.title')}
    items={SECTIONS.map((id) => ({ id, label: t(`settings.section.${id}`), icon: <Icon id={id} /> }))}
    activeId={section}
    render={(item) => <Link to={`/settings/${item.id}`} />}
    className="md:sticky md:top-0"
  />
  <div>
    <SectionHeading title={t(`settings.section.${section}`)} description={t(`settings.hint.${section}`)} />
    <Body section={section} />
  </div>
</div>
```

**The rows are your links.** `render` takes the item and answers with the
element to draw it as — a router's link, an `<a>`, whatever you navigate with
— and the component puts the row's clothes, its icon and its `aria-current`
on it, the way [Button](/components/button/) takes a `render`. Without
`render` a row is a button and `onSelect` says which was pressed, for a screen
whose sections are state rather than routes.

**The current section is announced, not only tinted.** The active row carries
`aria-current="page"`, which is how a screen reader learns which of six
identical links is where you are.

**The caption names the landmark.** `label` is drawn above the list and the
`<nav>` is labelled by it, so the same word serves the eye and the reader.

**The heading is the other half.** `SectionHeading` is the title and the
one-line hint above a section's body, so the column and the page it opens are
set in the same type.

## Props

### `SectionNav`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` | `string` | | Required — the caption and the landmark's name |
| `items` | `{ id, label, icon? }[]` | | Required |
| `activeId` | `string` | | The current page |
| `render` | `(item) => ReactElement` | | The element each row is drawn as |
| `onSelect` | `(id) => void` | | Pressed, whatever the row is drawn as |
| `className` | `string` | | Merged so the caller wins a conflict |

### `SectionHeading`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `title` | `ReactNode` | | Required, an `h2` |
| `description` | `ReactNode` | | The line under it |
| `className` | `string` | | |
