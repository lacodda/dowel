# table-sort

Source: https://lacodda.github.io/dowel/components/table-sort

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#table-sort

The same six rows sorted by score, ascending and descending.

## Notes

**The rule this exists for.**

> Absence sorts last, whichever way the column points.

A row with no value in this column is not the smallest — it is unknown, and the
two are different facts. Rank absence with the rest and flip the sign, and a
descending sort floats every empty row to the top: the reader asks for the
highest score and is handed the rows that have none.

This is measured rather than assumed. It is what the first version of the
line's own catalogue did, and the fix is the shape here, where presence is
settled *before* the direction is applied. It is the same fact
[RatingScale](/dowel/components/rating-scale/) is built on: not judged yet is a
state, not a zero.

```ts
import { sortRows, toggleSort, type Sort } from './table-sort'

const [sort, setSort] = useState<Sort>({ column: 'title', direction: 'asc' })
const locale = useLocale()
const ordered = sortRows(rows, sort, (row, column) => row[column], {
  locale,
  tiebreak: (row) => row.id,
})
```

**No React in it**, which is what makes it a file of its own — the same split
[calendar-math](/dowel/components/calendar-math/) is. A product that sorts on
the server, in a worker, or before the data reaches a component imports this
and never [Table](/dowel/components/table/).

**No table library.** The obvious choice is TanStack Table, and it would be the
first dependency a product has to install beyond Base UI. What it offers is a
model of columns, pages and sorting state; what the line's one real table
needed was the rule above, which the model does not have.

**`NaN` counts as absent too**, and that is not tidiness. Subtraction with it
returns `NaN`, which `sort` reads as "these two are equal" — so a row whose
number is not a number takes whatever place the input happened to give it, and
the order changes when the same data is fetched again.

**The tiebreaker does not reverse with the column.** That is what makes it a
tiebreaker rather than a second sort: rows that tie must not swap places when
the arrow flips, or the one thing that is supposed to be stable is the thing
that moves on every click.

**`aria-sort` goes on the sorted column only.** `ariaSort` returns `undefined`
for the others, which removes the attribute — `aria-sort="none"` everywhere is
valid and gets announced by some screen readers on every cell, which turns a
table into a recital.

## API

| | Type | |
| --- | --- | --- |
| `sortRows` | `(rows, sort, accessor, options?) => Row[]` | A new array; the input is not touched |
| `toggleSort` | `(sort, column) => Sort` | A different column starts ascending, rather than inheriting |
| `ariaSort` | `(sort, column) => 'ascending' \| 'descending' \| undefined` | For the `<th>` |
| `isAbsent` | `(value) => boolean` | `null`, `undefined` and `NaN` — not `0`, `''` or `false` |

### `sortRows` options

| Option | Type | |
| --- | --- | --- |
| `tiebreak` | `(row) => SortValue` | What decides rows that compare equal. Pass the row's id |
| `locale` | `string` | Passed to `Intl.Collator`, so `ä` sorts where the reader expects |
