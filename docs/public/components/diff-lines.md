# diff-lines

Source: https://lacodda.github.io/dowel/components/diff-lines

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#diff-lines

The changes and the rows they pair into, printed rather than drawn - including the insertion that pushes a filtered pair of columns out of step.

## Notes

Split out of [DiffView](/components/diff-view/) like
[tree-rows](/components/tree-rows/) and [line-scale](/components/line-scale/):
a product that wants to know *how much* moved between two drafts — to put a
number in a list, to decide whether to offer the comparison at all — should not
render a component to find out.

```ts
import { countChanges, diffLines, rows } from '@/components/ui/diff-lines'

const changes = diffLines(before, after)
countChanges(changes)   // { added: 2, removed: 1 }
rows(changes)           // one row per line pair, for two columns
```

**`rows` is the part that matters, and the part a hand-written diff leaves
out.** Drawing two columns by filtering the change list twice gives two columns
of different lengths the moment anything is inserted — from there the reader is
comparing line 4 against line 3, and nothing about it looks wrong. Pairing
makes the alignment structural: a row is one object with two sides, so the
columns cannot drift.

```ts
rows(diffLines('a\nb', 'x\na\nb'))
// [ { before: null, after: 'x', kind: 'added',   beforeLine: null, afterLine: 1 },
//   { before: 'a',  after: 'a', kind: 'same',    beforeLine: 1,    afterLine: 2 },
//   { before: 'b',  after: 'b', kind: 'same',    beforeLine: 2,    afterLine: 3 } ]
```

**`null` is a side with nothing there, and an empty string is not.** A blank
line somebody wrote is a line; conflating the two draws it as a deletion.

**A rewrite is paired into one row.** A removal with an insertion right behind
it is a line that was changed, and showing the old and the new opposite each
other is what the comparison is for. The row keeps `kind: 'removed'` with both
sides set, which is how DiffView knows to mark it `~`.

**Line numbers are of the texts, not of the rows.** The rows include the gaps
and the files do not, so a gutter that counted rows would send the reader one
line wrong after every insertion.

**Plain longest-common-subsequence, exact rather than heuristic.** The bodies
are a page or two, so the O(n·m) table costs nothing. Past `LIMIT` lines a side
(2,000 — four million cells) it gives up and returns the two texts whole,
because the honest answer is "too long to compare" rather than a frozen window.

**Lines, not words**, for the reason [DiffView](/components/diff-view/) states:
prose is revised by the line.

## API

| | |
| --- | --- |
| `diffLines(before, after)` | `Change[]` — `same`, `added` or `removed`, in order |
| `rows(changes)` | `DiffRow[]` — one per line pair, with both sides and both numbers |
| `countChanges(changes)` | `{ added, removed }` |
| `LIMIT` | `2000` — lines per side before it gives up |

 FENCE3
