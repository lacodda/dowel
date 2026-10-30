# NotificationBell

Source: https://lacodda.github.io/dowel/components/notification-bell

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#notification-bell

The bell at zero, at three and past nine; press one to open the panel, mark everything read, or hand over to the whole list.

## Notes

A bell that is always lit is a bell nobody reads. So the count is your
decision — ordinary edits are recorded and never counted; only what needs a
look lights it — and this draws it: nothing at zero, the number past that,
`9+` past nine. Pressing it does not leave the screen. The last few entries
open under it, and the whole history is one more click.

```tsx
<NotificationBell
  count={unread}
  label={t('journal.open')}
  title={t('journal.recent')}
  markAllLabel={t('journal.markRead')}
  onMarkAll={() => markRead.mutate()}
  busy={markRead.isPending}
  seeAllLabel={t('journal.seeAll')}
  onSeeAll={() => navigate('/journal')}
  emptyLabel={t('journal.nothingRecent')}
>
  <ul>{recent.map((entry) => <RecentLine key={entry.id} entry={entry} />)}</ul>
</NotificationBell>
```

**The rows are yours.** A journal entry, a failed upload and a comment are
three different lines, and one component cannot draw them; `children` is the
list. What is shared is the frame — the trigger with its badge, the heading
with the button that clears the count, the empty line, and the footer that
leads to everything.

**Mark-all is offered only while there is something to mark.** A button that
does nothing is worse than no button. It appears when `count > 0` and a label
is given, and `busy` holds it while the product is clearing.

**See-all closes first, then hands over.** The panel is gone before the
route changes, so nothing is left open over the page it led to.

**Named by what it shows.** The bell is called by its `label` and then by the
count on its badge — "Notifications 3" — because someone telling voice control
what they see says the number (WCAG 2.5.3). The tooltip is the same words, so a
screen reader does not read them twice.

**Controlled or not.** Leave `open` out and the bell manages itself; pass it
with `onOpenChange` to drive it — to close it when a row is chosen, say.

Built on [Popover](/components/popover/) and [Button](/components/button/),
so the panel opens, positions and closes the way every other panel does.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `count` (required) | `number` |  | How many things ask to be looked at. Nothing is drawn at zero. |
| `label` (required) | `string` |  | What the bell is called, for a screen reader and the tooltip. |
| `title` (required) | `string` |  | The heading of the panel. |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3` | Where the panel's heading stands in the outline: `3` by default. |
| `open` | `boolean` |  | Open, controlled. Left out, the bell manages itself. |
| `onOpenChange` | `(open: boolean) => void` |  | Told when the panel opens or closes, whether the bell is controlled or manages itself. |
| `markAllLabel` | `string` |  | The button that clears the count, shown only while there is one. |
| `onMarkAll` | `() => void` |  | Called when the mark-all button is pressed. The button is drawn only with `markAllLabel` and while `count` is above zero. |
| `seeAllLabel` | `string` |  | The footer button, which closes the panel and hands over. |
| `onSeeAll` | `() => void` |  | Called after the panel closes, when the footer button is pressed. The footer is drawn only with `seeAllLabel`. |
| `emptyLabel` (required) | `string` |  | What the list says when there are no rows. |
| `children` | `ReactNode` |  | The rows. |
| `busy` | `boolean` | `false` | While the product is clearing the count: the button waits. |
| `className` | `string` |  |  |
