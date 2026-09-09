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

## Parts

| | |
| --- | --- |
| `Skeleton` | One block. Size it with `className` |
| `SkeletonText` | `lines` (default 3). Ragged widths, short last line |
| `SkeletonList` | `rows` (default 5), `secondary` (default true) |
| `SkeletonGrid` | `cells`, `columns`, `cellClassName` |
