# PageHeader

Source: https://lacodda.github.io/dowel/components/page-header

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#page-header

A screen's heading with actions and a trail under it, and the four measures a container can hold its content to.

## Notes

Every screen in the line opens with a title, a line and some buttons, and
every one of them set the title in a different size — because `text-lg
font-semibold` is the kind of thing nobody looks up.

```tsx
<Screen>
  <PageHeader
    title={t('catalogue.title')}
    description={t('catalogue.hint')}
    actions={<Button onClick={create}>{t('new')}</Button>}
  >
    <Breadcrumbs label={t('nav.trail')} items={trail} render={(c) => <Link to={c.id} />} />
  </PageHeader>
  <Container>
    <Body />
  </Container>
</Screen>
```

**The title is an `h1`.** It is the one heading a screen is entitled to: the
shell's bar names the application and the rail names the destinations, so this
is the top of the content's outline and where a reader jumping by heading
lands. A section inside the screen is an `h2` —
[SectionHeader](/dowel/components/divider/) is that one.

**Actions drop to their own line rather than squeezing the title.** The row
wraps and aligns to the top, so a long title keeps its words and a button
waits a row. A title is what the screen is.

**`Container` is a measure, not a box.** Text past about ninety characters a
line loses the reader on the way back to the left margin, and a form whose
fields run the width of a 32-inch monitor asks the eye to travel between a
label and its input. `prose` is for reading and forms, `default` for the usual
screen, `wide` for tables and boards that are scanned down a column rather
than across a line, and `full` for a screen that *is* the window — a canvas, a
map, a timeline that earns every pixel.

**It sets width only, deliberately.** The padding belongs to
[`Screen`](/dowel/components/app-shell/), which knows whether it is scrolling
and therefore whether a scrollbar is about to take ten pixels off the right. A
container that also padded would double it.

## Props

### `PageHeader`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `title` | `ReactNode` | | Required, the screen's `h1` |
| `description` | `ReactNode` | | One sentence under it |
| `actions` | `ReactNode` | | Buttons acting on the whole screen |
| `children` | `ReactNode` | | A trail, a status, a tab strip |
| `className` | `string` | | Merged so the caller wins a conflict |

### `Container`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `width` | `prose \| default \| wide \| full` | `default` | |
| `className` | `string` | | Merged so the caller wins a conflict |
