# SkeletonOf

Source: https://lacodda.github.io/dowel/components/skeleton-of

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#skeleton-of

Load the list, ask again, and the placeholder is the shape that was there - grow it to six rows and the placeholder follows.

## Notes

[Skeleton](/dowel/components/skeleton/) solved half the problem: it gave a
product a list, a card and a grid to reach for instead of a spinner. The half
left over is the one that actually causes the jump, and it is a human one —
somebody has to look at the real thing, judge how many rows it has and how
tall they are, and type that in. The judgement is made once, the screen
changes a month later, and the placeholder goes on promising the old shape.

**The rule is the same one `Skeleton` is built on:**

> A skeleton of the wrong shape is worse than no skeleton.

What is new here is where the shape comes from. The content was on screen a
moment ago; it measured itself, and nothing else knows its shape better.

```tsx
<SkeletonOf pending={works.isPending} rowSelector="[data-row]" fallback={<SkeletonList rows={6} />}>
  <WorkList works={works.data ?? []} />
</SkeletonOf>
```

**Why measuring and not reading the source.** The obvious version of "derive
the skeleton from the markup" is to parse the component's JSX and emit boxes
from it. It cannot work, and the reason is worth stating: the shape on screen
is not in the source. It is the source plus the data (five rows or fifty),
plus the viewport (one column or three), plus the theme's own spacing. A
generator reading `list.tsx` sees one `<li>` in a `map` and knows nothing
about any of that. Measuring the rendered thing sees all of it at once, and it
costs a `ResizeObserver` rather than a build step.

**The measurement follows the content.** Taken in a layout effect and on every
resize, not once on mount: a list that gains rows, a window that narrows, a
font that loads late all change the shape.

**The first load has nothing to remember.** `fallback` is what stands in until
there is a measurement to use; after that it is never seen again on that
screen. With neither a measurement nor a fallback the component draws nothing
— a shape made up on the spot is the defect, and silence is the honest answer.
A product that stores `measureShape`'s answer between sessions can hand it
back as `shape` and be honest on a first load too.

**It does not remember a zero.** A block of no height has not been laid out —
a hidden tab, a parent still collapsing — and remembering that would draw
nothing and claim it was the shape.

**It does not measure its own placeholder.** Only the branch rendering the
content carries the ref, so the memory cannot decay one load at a time into a
single thin bar.

**Rows are found by selector**, because the repeating part is rarely a direct
child: a table's rows are inside a `<tbody>`, a list's inside a `<ul>` that may
itself be inside a scroller. Without `rowSelector` the placeholder is one box
the height of the whole block, which is the right answer for a card.

**It is `aria-hidden`, like every skeleton.** The loading fact belongs to the
region and is said once, by whatever owns it —
[QueryState](/dowel/components/query-state/) does it with `aria-busy`.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `pending` | `boolean` | | Required — shows the remembered shape |
| `children` | `ReactNode` | | Required — the real thing, measured |
| `rowSelector` | `string` | | `'tr'`, `'li'`, `'[data-row]'` |
| `fallback` | `ReactNode` | | Until there is something to remember |
| `shape` | `MeasuredShape` | | A measurement from an earlier session |
| `gapClassName` | `string` | `gap-1` | The gap between drawn rows |
| `className` | `string` | | Merged so the caller wins a conflict |

### `measureShape`

| | |
| --- | --- |
| `measureShape(node, rowSelector?)` | `{ height, rows }` — the block, and each row inside it |
