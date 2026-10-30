# ListDetailScreen

Source: https://lacodda.github.io/dowel/blocks/list-detail-screen

FENCE0 

The block lands in `components/blocks/list-detail-screen.tsx`, and the
components it is made of - [Frame](/dowel/components/frame/),
[ListRow](/dowel/components/list-row/),
[SearchField](/dowel/components/search-field/),
[EmptyState](/dowel/components/empty-state/),
[PageHeader](/dowel/components/page-header/) and
[Button](/dowel/components/button/) - in `components/ui` beside the rest.

See it live on the stand: https://lacodda.github.io/dowel/stand/#list-detail-screen

Works and the open one, at a desktop's width and a phone's, and the screen with nothing on it.

## Notes

**A block is a starting point, not a copy to keep.** A primitive in
`components/ui` is kept as it came, and a product's `check-registry` holds it
to the catalogue. A block in `components/blocks` is the product's from the
moment it lands: rename it to the screen it is (`WorksScreen`), change what
the rows show, add a column. It is written to be used as it stands all the
same - the data and every word come in through props - so a product can keep
it unedited for as long as its screen is the usual one.

```tsx
<ListDetailScreen<Work>
  title="Works"
  actions={<Button variant="primary" size="sm">New work</Button>}
  items={works}
  itemKey={(work) => work.id}
  row={(work) => ({ title: work.title, description: work.owner, end: <RelativeTime value={work.updated} /> })}
  selected={id ?? null}
  onSelect={(next) => navigate(next === null ? '/works' : `/works/${next}`)}
  matches={(work, query) => work.title.toLowerCase().includes(query.toLowerCase())}
  detailTitle={(work) => work.title}
  detail={(work) => <WorkDetail work={work} />}
  words={words}
/>
```

**What is open is the product's.** `selected` and `onSelect` are props
because in a real product the open thing is an address - `/works/w3` - and
the router is the one that knows it. Pass `rowRender` to draw each row as the
router's link, so a row can be opened in a new tab; the click is then the
link's, and `onSelect` is told by the keyboard and the way back.

**Three kinds of nothing, each said once.** No items at all is one empty
state for the whole screen, with `emptyAction` as the way out - not an empty
list beside an empty pane, which says it twice. A search that matches nothing
says so in the list and offers to clear it. Nothing open is a dashed
placeholder where the open thing will stand, which is what a dashed border
means everywhere else in the set.

**The keyboard walks the list.** Up and Down move to the next row and open
it, Home and End go to the ends, and Tab leaves the list in one step - the
list beside a reading pane, as a mail client has it.

**On a phone the two take turns, and the focus follows.** Below 672px of its
own width the list is the screen until something is opened, then the open
thing is, with the way back in its head. A browser drops the focus of an
element that has just been hidden, so the block hands it on: to the open
thing's title, and on the way back to the row that was open. It moves only
when the reader caused the turn - a selection that arrives from the address
bar leaves the focus where the reader put it.

**No words of its own.** Every word is in `words`, so a product in two
languages passes its translations and nothing English is left behind.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `title` (required) | `ReactNode` |  | The screen's title. |
| `description` | `ReactNode` |  | One sentence under it. |
| `actions` | `ReactNode` |  | What acts on the screen as a whole: New, Import. |
| `items` (required) | `readonly T[]` |  | What the list holds, in the order it shows. |
| `itemKey` (required) | `(item: T) => string` |  | A stable key per item: its id. |
| `row` (required) | `(item: T) => ListDetailRow` |  | How an item reads as a row. |
| `selected` (required) | `string \| null` |  | The key of what is open, or null. |
| `onSelect` (required) | `(key: string \| null) => void` |  | Told what to open - or null, to go back to the list. |
| `matches` | `(item: T, query: string) => boolean` |  | Whether an item answers to what was typed. Leave it out and there is no search: a list of seven does not need one. |
| `detailTitle` (required) | `(item: T) => string` |  | The open item's title: the heading of its pane and the name of the region that scrolls. Words, because a region is named in words. |
| `detailActions` | `(item: T) => ReactNode` |  | What acts on the open item, beside its title. |
| `detail` (required) | `(item: T) => ReactNode` |  | The open item itself. |
| `emptyAction` | `ReactNode` |  | The one thing worth doing on an empty screen: "New work". |
| `rowRender` | `(item: T) => RenderProp<Record<string, unknown>> \| undefined` |  | A row drawn as something other than a button - the product's link, so a row can be opened in a new tab: `(work) => <Link to={…} />`. A click is then the link's: the router opens it and `selected` follows the address. `onSelect` is still told by the keyboard and the way back. |
| `words` (required) | `ListDetailScreenWords` |  | Every word the screen shows: the list's name, the search box, the way back, and what each empty state says. Words are passed in so the product can translate them. |
| `className` | `string` |  |  |
