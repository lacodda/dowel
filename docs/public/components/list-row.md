# ListRow

Source: https://lacodda.github.io/dowel/components/list-row

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#list-row

Releases as facts in a panel, versions as choices with one open, and a long title cut to its line.

## Notes

**Every screen has a list, and every product drew its own row.** kilna alone had
six list-and-detail layouts with five row recipes, and the open row was tinted
four ways. A row is three slots and a rule about truncation — small enough to
get wrong every time, which is why it is here.

**A row is a fact or a choice, and they are two components.**

- `ListRow` is a fact — "Clip, 02.09" in a list of releases. It is not pressable
  and has no hover; rows in a run are divided by a hairline the last one does not
  draw, so a list inside a panel ends at the panel's edge.
- `RowButton` is a choice — a version in the list beside the editor, an item in
  a queue. It is a real `<button>` (or your link, through `render`), it answers
  the pointer, and the open one is tinted on `accent-soft` and named as current.

```tsx
<ul>
  {releases.map((release) => (
    <ListRow key={release.id} render={<li />} start={<StatusDot status={release.status} />} end={<time>{release.date}</time>}>
      {release.title}
    </ListRow>
  ))}
</ul>

{versions.map((version) => (
  <RowButton
    key={version.id}
    selected={version.id === open}
    description={version.author}
    end={<RelativeTime value={version.updatedAt} />}
    onClick={() => setOpen(version.id)}
  >
    {version.title}
  </RowButton>
))}
```

**Three slots, the same in both.** `start` identifies the row at a glance — an
icon, a status dot, a cover. The row's words, with an optional `description`
under them. `end` is what is measured about it — a date, a count, a chip, set in
tabular figures so a column of them lines up.

**The words truncate; the slots keep their size.** A list whose rows grow to two
lines in one language and not the other stops being a list you can scan.

**The open row is announced, not only tinted.** `RowButton` sets
`aria-current="true"`, which is what a list beside an editor is: where you are,
not a value you are submitting. A product that puts rows in a `listbox` passes
`aria-selected` and `aria-current={undefined}`, and what it passes wins.

**A ListRow's height follows density.** It stands on `py-row`, the same rhythm a
[Table](/dowel/components/table/) row does, so `data-density="compact"` tightens
a list and a table together.

## Props

### `ListRow`

A row that states a fact. Rows in a run are divided by a hairline that the last one does not draw, so a list inside a panel ends at the panel's edge rather than on a line of its own.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `start` | `ReactNode` |  | What identifies the row at a glance: an icon, a status dot, a cover. |
| `description` | `ReactNode` |  | A second line under the words, quieter and truncated the same way. |
| `end` | `ReactNode` |  | What is measured about the row: a date, a count, a chip. |
| `children` (required) | `ReactNode` |  | The row's words. |
| `render` | `RenderProp<Record<string, unknown>>` |  | Something other than a `div` - an `<li>` in a `<ul>`, most often: `render={<li />}`. |

And every prop of `HTMLAttributes<HTMLElement>` except `children`, passed on.

### `RowButton`

A row that is a choice.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `start` | `ReactNode` |  | What identifies the row at a glance: an icon, a status dot, a cover. |
| `description` | `ReactNode` |  | A second line under the words, quieter and truncated the same way. |
| `end` | `ReactNode` |  | What is measured about the row: a date, a count, a chip. |
| `children` (required) | `ReactNode` |  | The row's words. |
| `selected` | `boolean` | `false` | The open one - tinted, and named as current. |
| `render` | `RenderProp<Record<string, unknown>>` |  | The element to draw the row as - a router's link, most often: `render={<NavLink to={…} />}`. Without it the row is a `<button>`. |
| `disabled` | `boolean` |  | Disables the row. Applied only when the row is the default `<button>`: a rendered element such as a link has no `disabled` of its own. |

And every prop of `HTMLAttributes<HTMLElement>` except `children`, passed on.
