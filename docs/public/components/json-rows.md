# json-rows

Source: https://lacodda.github.io/dowel/components/json-rows

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#json-rows

The rows a document flattens into, printed rather than drawn - with the keys that dot notation would break.

## Notes

Split out of [JsonViewer](/components/json-viewer/) exactly as
[tree-rows](/components/tree-rows/) is split out of
[TreeView](/components/tree-view/): a product windowing a large document needs
to know how many rows it has before rendering any of them, and that is this
file.

```ts
import { branchPaths, kindOf, visibleRows } from '@/components/ui/json-rows'

const open = branchPaths(payload, { depth: 3 })
const rows = visibleRows(payload, open)
rows.length            // what a VirtualList needs
```

Flattening is also what makes the keyboard simple. Down is the next row of this
list and Up the previous, whatever the nesting; a recursive walk at every
keystroke asks the same question and answers it differently at each depth.

**`visibleRows` returns only what is visible.** A closed branch contributes its
own row and nothing below it, which is what keeps a viewer of a large document
cheap — a thousand-entry array nobody opened costs one row.

**`kindOf` tells `null` from an object.** `typeof null === 'object'` is the
oldest trap in the language, and here it would draw a null as an empty
expandable branch. `null` is its own kind, because in JSON it is a value
somebody wrote.

**A row's identity is its path, not its index.** An index changes when a branch
above it opens, so anything remembered by index — which rows are open, which is
selected — would jump to a different value the moment something above it moved.

**Paths are bracketed where dot notation would break**, and both cases are
common in real data:

```ts
visibleRows({ 'user name': 1, 'a.b': 2 }, new Set(['$'])).map((r) => r.path)
// ['$', '$["user name"]', '$["a.b"]']
```

A key with a space gives a path nothing can resolve. A key *containing* a dot
is worse: `$.a.b` resolves to `b` inside `a`, silently, which is the wrong
value rather than no value.

**`branchPaths` is bounded twice — by depth and by size — and the second bound
is the one that does the work.** A depth bound alone reads as sufficient and is
not: the cost of opening is measured in *rows*, while depth counts *levels*,
and those track each other only while branches are small. A payload holding
`assets: [1204 entries]` at its top level rendered 1216 rows on arrival under a
depth-2 bound, because the array sits *at* depth 2 — the exact freeze the bound
exists to prevent, produced by the bound itself.

So a branch opens when it is shallow enough *and* holds fewer than `size`
entries (20 by default, about a screen). One left shut is not descended through
either: what is inside something the reader cannot see does not need deciding
about.

**`summarise` says how many, not what.** A preview of the first entries reads
as though those are all of them, which is the one thing a closed branch must
not imply.

## API

| | |
| --- | --- |
| `visibleRows(value, open, { root })` | `JsonRow[]` — in the order the eye and the keyboard travel |
| `branchPaths(value, { root, depth, size })` | `Set<string>` — branches within `depth` (2) holding at most `size` (20) |
| `kindOf(value)` | `'object' \| 'array' \| 'string' \| 'number' \| 'boolean' \| 'null'` |
| `isBranch(kind)` | Whether it opens |
| `summarise(row)` | `'{ 4 }'` or `'[ 1204 ]'` |

 FENCE3
