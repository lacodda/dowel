# BigCalendar

Source: https://lacodda.github.io/dowel/components/big-calendar

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#big-calendar

A month of releases in a box of its own height: a busy day folds, a release is picked up and put down on another day.

## Notes

**It is read for "is that week empty".** A list answers "what is on the
14th"; a month view is for the shape of the weeks. So the month holds its box:
the weeks share the height, a day never grows past its share, and what a day
has no room for folds into a count. The count opens the day in place - the same
height, its lines scrolling inside it - so a busy Friday does not push the next
week off the screen. One day is open at a time.

**Give it a height.** `flex-1` in a screen, or a height of its own. The grid
measures one day's room and divides it into lines.

```tsx
<BigCalendar
  className="flex-1"
  month={month}                         // any day of the month: '2026-09-01'
  onMonthChange={setMonth}
  renderDay={(date) =>
    releasesOn(date).map((release) => (
      <BigCalendarItem key={release.id} color={release.colour} onClick={() => open(release)}>
        {release.title}
      </BigCalendarItem>
    ))
  }
  moreLabel={(count) => t('calendar.more', { count })}
  fewerLabel={t('calendar.fewer')}
/>
```

**A line is one line.** `renderDay` returns what a day holds, one node per line,
and the fold is arithmetic: a line is twenty-four pixels, and lines stand edge to edge.
[BigCalendarItem](/dowel/components/big-calendar-item/) is that line. A line of
your own has to keep the height, and read `BigCalendarDayContext` for its
`tabIndex` (below).

**The month's name and its arrows are yours.** They belong to the screen's
head, in one row with its filters and actions. The grid asks for a new month
only when the keyboard walks off its edge, through `onMonthChange`; without it
the cursor stops at the edge.

**The grid is named by its month.** Without an `aria-label` it is called by the
month it shows, "September 2026", in the calendar's `locale`; an `aria-label`
replaces that.

**Only the weeks the month touches** are drawn - four to six. The days of the
neighbouring months in them are real days on a quieter ground: `renderDay` is
asked for them too, and something can be dropped on the 31st of August from the
September page.

**The keyboard is the Calendar's.** The grid is one tab stop and the arrows move
a cursor through the days. Tab from a day goes into it and then out of the
month - the lines of the other days are out of the tab order, so a month of
forty releases is not forty tab stops.

| Key | |
| --- | --- |
| `←` `→` `↑` `↓` | move a day or a week; off the grid, ask for the next month |
| `PageUp` `PageDown` | move a month |
| `Home` `End` | the ends of the week |
| `Enter` `Space` | press the day (`onDaySelect`) |
| `Tab` | into the day: its plus, its lines, its count |
| `Escape` | fold the open day, from anywhere inside it |

**A day is named by what it draws, in order** — "14 Clip Single 3 more", with
the hint while something is carried over it — and described by its whole date,
"Monday, 14 September 2026". The words on its face are what someone telling
voice control what they see says (WCAG 2.5.3); the date says which 14th it is.
The plus is not in the name, or every day would say it.

**The week starts where the locale says.** `en-GB` on Monday, `en-US` on Sunday.
A product that wants Monday whatever the region says so in the tag -
`en-US-u-fw-mon` - and a DatePicker beside the month then agrees with it.

## Dragging

Dragging is the product's, and the grid helps without choosing a library. Every
day carries `data-day`, and `dayOf` reads it back from any element inside a day,
so the handlers go on the calendar rather than on forty-two cells:

```tsx
<BigCalendar
  onDragOver={(event) => { event.preventDefault(); setOver(dayOf(event.target)) }}
  onDrop={(event) => move(carried, dayOf(event.target))}
  dropTarget={over}
  dropHint={over && t('calendar.lands', { count: countOn(over) })}
  …
/>
```

A pointer drag that carries a copy of the line under the pointer asks
`dayOf(document.elementFromPoint(x, y))` - give the copy `pointer-events: none`
so it does not answer instead of the day beneath it. `dropTarget` lights the day
something would land on; `dropHint` says, at its foot, what landing there means.

A click on a day's ground calls `onDaySelect`; a click on a line, the plus or the
count inside it does not - no line has to stop the event so that opening a
release does not also book the day under it.

## Helpers

| | |
| --- | --- |
| `dayOf(target)` | the day an element is in, or `null` |
| `linesThatFit(height)` | how many lines fit in a day's room |
| `foldDay(count, lines)` | `{ shown, more }` - the count takes a line of its own |
| `LINE_HEIGHT` | 24: the height of a line and the pitch of the day, the floor of a pointer target |

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `onAddDay` (with `addDayLabel`) | `(date: string) => void` |  | Add something on this day: a plus in the corner of the day under the pointer, and the first stop of Tab from the day the cursor is on. |
| `addDayLabel` (with `onAddDay`) | `string` |  | Names the plus. Required with it: an icon with no name announces nothing. |
| `month` (required) | `string` |  | Any day of the month to show. |
| `onMonthChange` | `(month: string) => void` |  | Asked for when the keyboard walks off the grid; any day of the new month. Without it the cursor stops at the edge. |
| `renderDay` (required) | `(date: string) => readonly ReactNode[]` |  | What a day holds, one node per line, each with a `key`. |
| `moreLabel` (required) | `(count: number) => string` |  | The words of the count a full day folds into, given how many are folded: "3 more". |
| `fewerLabel` (required) | `string` |  | The words that fold an open day again. |
| `onDaySelect` | `(date: string) => void` |  | Pressing a day - a click on its ground, or Enter on the cursor. |
| `dropTarget` | `string \| null` | `null` | The day something being carried would land on. |
| `dropHint` | `ReactNode` |  | What landing on `dropTarget` would mean, said at the foot of it. |
| `locale` | `string` |  | Names the months and the weekdays, and picks the first day of the week: `en-GB` starts on Monday, `en-US` on Sunday, `en-u-fw-mon` on Monday whatever the region. The application's language by default. |

And every prop of `HTMLAttributes<HTMLDivElement>` except `children`, `onSelect`, passed on.
