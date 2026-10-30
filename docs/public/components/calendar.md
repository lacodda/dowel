# Calendar

Source: https://lacodda.github.io/dowel/components/calendar

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#calendar

A month, one with bounds, and one showing a range.

## Notes

**The value is `YYYY-MM-DD`, never a `Date`.** A birthday has no timezone and a
release date has no hour. Put one in a `Date` and it becomes a moment — and
moments cross midnight when they are serialised, which is how a date reaches a
server a day early. The string is what a database column holds and what JSON
carries.

```tsx
<Calendar
  value={date}                    // '2026-09-02'
  onValueChange={setDate}
  previousMonthLabel="Previous month"
  nextMonthLabel="Next month"
/>
```

**No date library, deliberately.** `react-day-picker` is good and would bring
`date-fns` and `@date-fns/tz` behind it — the first heavy dependency in a set
that is otherwise Base UI or nothing. `Intl` already knows the part a library
would be consulted for: which day the week starts on here, which days are the
weekend, what the months are called. The rest is arithmetic, and it lives in
`calendar-math` with no React in it, so a product doing its own date work can

**Arrows move, Enter chooses.** The grid is one tab stop and the arrows move a
cursor within it — forty-two tab stops is not a control. Only Enter or a click
fires `onValueChange`, so a product listening for it does not receive five
dates on the way to the sixth.

| Key | |
| --- | --- |
| `←` `→` `↑` `↓` | move a day or a week |
| `PageUp` `PageDown` | move a month |
| `Home` `End` | the ends of the week |
| `Enter` `Space` | choose the day under the cursor |

**Six rows, always.** A calendar that changes height between months is a popup
that moves under the pointer.

**Every day is named in full** — "2 September 2026", not "2". A number on its
own is not a date to anything reading the page aloud.

## The arithmetic

`calendar-math` is importable on its own, and every function takes and returns
the string:

| | |
| --- | --- |
| `today()` | the local day — not `toISOString().slice(0, 10)`, which returns tomorrow for anyone east of Greenwich in the evening |
| `addDays(date, n)` | crosses months, years and February |
| `addMonths(date, n)` | clamps: a step back from 31 March lands on 28 February |
| `daysInMonth(y, m)` | the leap rule in full, century exception included |
| `isIsoDate(value)` | shape *and* existence — `2026-02-31` is not a day |
| `weekday(date)` | 1 is Monday, 7 is Sunday, as `Intl` numbers them |
| `monthGrid(month, locale)` | six whole weeks, starting on the locale's first day |

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `string` |  | The selected day, or `undefined` for none. |
| `onValueChange` | `(value: string) => void` |  | Called with the day the reader chose. It fires on Enter and on a click, not on the arrows - those only move the cursor. |
| `month` | `string` |  | Which month is shown. Uncontrolled unless given. |
| `onMonthChange` | `(month: string) => void` |  | Called with the new month when the shown month changes: the paging buttons, or the cursor arrowing off the end of a month. |
| `min` | `string` |  | Bounds, inclusive. A day outside them cannot be chosen. |
| `max` | `string` |  | The latest day that can be chosen, inclusive. See `min`. |
| `rangeEnd` | `string` |  | For a range: the other end, so the days between can be shaded. |
| `locale` | `string` |  | Formats the names. The application's language by default - see `useLocale`. |
| `aria-label` | `string` |  | What the grid is called, for a screen reader. |
| `autoFocus` | `boolean` | `false` | Put the focus on the day under the cursor when it mounts - for a calendar that opens in a popup, where choosing a day is what the reader came for. Left to the popup, the focus went to the first thing in it: the month-paging button, two Tabs away from the days. |
| `previousMonthLabel` (required) | `string` |  | Names the buttons that page the months. Required: they are icons, and an icon with no name is a button that announces nothing. |
| `nextMonthLabel` (required) | `string` |  | Names the button that pages to the next month. Required, for the same reason as `previousMonthLabel`. |
| `className` | `string` |  |  |
