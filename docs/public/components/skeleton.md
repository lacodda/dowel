# Skeleton

Source: https://lacodda.github.io/dowel/components/skeleton

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#skeleton

A paragraph, a list, two grids, and single blocks.

## Notes

**The rule it is built on:**

> A skeleton of the wrong shape is worse than no skeleton.

It promises something the content does not keep, and the promise is paid for in
a jump: the page settles, the scrollbar appears, and whatever the reader was
about to click has moved. Measured rather than assumed — the line's own
calendar drew four short lines where a six-row month grid was about to land,
and the skeleton was itself the jump it existed to prevent.

So the useful part is not `<Skeleton />` — that is four lines anyone can write
— but the shapes. They are what a call site reaches for, and what keeps the
placeholder honest.

```tsx
{isPending ? <SkeletonList rows={6} /> : <Works rows={works} />}
```

**A spinner is the right answer when the shape is not known.** A skeleton
claims to know; if it does not, say less rather than more. See
[Spinner](/dowel/components/spinner/), and
[Progress](/dowel/components/progress/) for the unknown-fraction case.

**The widths vary, and that is deliberate.** A stack of equal bars reads as a
loading indicator; ragged ones read as text. They rotate through a fixed set
rather than being random, because a placeholder that changes between renders
flickers — and a placeholder is on screen exactly when things are re-rendering.

**Everything here is `aria-hidden`.** The loading fact belongs to the region
and is said once, by whatever owns it —
[QueryState](/dowel/components/query-state/) does it with `aria-busy`.
Announcing a dozen empty boxes as content would be noise on top of a fact the
reader already has.

**A count of zero draws one.** `rows={works.length}` before anything arrives is
zero, and an empty box where a placeholder belongs is the jump the component
exists to prevent.

## Props

### `Skeleton`

One block. Size it with `className` - a skeleton is a shape, and the shape belongs to whatever it stands in for.

Every prop of `HTMLAttributes<HTMLDivElement>`, passed on.

### `SkeletonText`

A paragraph's worth of lines.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `lines` | `number` | `3` | How many lines of text stand here. |

And every prop of `HTMLAttributes<HTMLDivElement>`, passed on.

### `SkeletonList`

Rows of a list, which is the shape most screens are waiting for.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `rows` | `number` | `5` | How many rows of the list stand here. |
| `secondary` | `boolean` | `true` | Draw a second, shorter line under each row - for a list whose rows carry a title and something beneath it. |

And every prop of `HTMLAttributes<HTMLDivElement>`, passed on.

### `SkeletonGrid`

A grid of cells: a gallery, a board, a month.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `cells` | `number` | `12` | How many cells. |
| `columns` | `number` | `4` | How many per row. |
| `cellClassName` | `string` | `'aspect-square'` | The aspect of one cell, as a Tailwind class - a gallery of covers is not shaped like a grid of tiles. |

And every prop of `HTMLAttributes<HTMLDivElement>`, passed on.
