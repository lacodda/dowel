# calendar-math

Source: https://lacodda.github.io/dowel/components/calendar-math

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#calendar-math

The functions answering the dates that break naive date code.

## Notes

**Not a component.** It has no markup and renders nothing — it is the sums the
[Calendar](/dowel/components/calendar/) runs on, split out because the size
gate asked the right question when the file was two and a half times over its
ceiling: it was holding two things. `Calendar` installs it as a sibling; a
product doing its own date work can install it alone.

**Everything is `YYYY-MM-DD` in and out, never a `Date`.** A birthday has no
timezone and a release date has no hour. Put one in a `Date` and it becomes a
moment — and moments cross midnight when they are serialised, which is how a
date reaches a server a day early.

`Date` is used inside, in two places only: to ask `Intl` for a name and to add
days. Both are wrapped, so no caller ever holds one.

**No date library, deliberately.** `date-fns` and friends would be the first
heavy dependency in a set that is otherwise Base UI or nothing, and `Intl`
already knows the part a library would be consulted for.

## The functions

| | |
| --- | --- |
| `today()` | the local day — **not** `toISOString().slice(0, 10)`, which returns tomorrow for anyone east of Greenwich in the evening |
| `addDays(date, n)` | crosses months, years and February; goes through noon, so a daylight-saving boundary cannot land it back on the day it started |
| `addMonths(date, n)` | clamps rather than overflows: a step back from 31 March lands on 28 February, not on 3 March |
| `daysInMonth(year, month)` | the leap rule in full — the century exception included, which is the half that gets left out |
| `isIsoDate(value)` | shape *and* existence: `2026-02-31` has the right shape and is not a day |
| `weekday(date)` | 1 is Monday, 7 is Sunday, as `Intl` numbers them — `Date` numbers Sunday 0, which neither sorts nor matches `getWeekInfo` |
| `monthGrid(month, locale)` | six whole weeks, starting on the locale's first day, as dates rather than numbers |
| `firstDayOfWeek(locale)` | 1 or 7, from `Intl`, falling back to Monday |
| `weekdayNames(locale, start)` | the initials, rotated into that locale's order |

```ts
import { addMonths, isIsoDate, today } from '@/components/ui/calendar-math'

today()                       // '2026-09-02', in the reader's own timezone
addMonths('2026-03-31', -1)   // '2026-02-28'
isIsoDate('2026-02-31')       // false
```

**Tested as properties, not as a table of dates.** A table proves the dates in
it; what has to hold here is that the sums agree everywhere, so the suite walks
twelve hundred consecutive days — two leap years and a century that is not one
— and checks that every day produced is a day accepted, that a step out and
back returns, and that the weekday advances by exactly one.
