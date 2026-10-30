# EmptyState

Source: https://lacodda.github.io/dowel/components/empty-state

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#empty-state

Nothing yet, nothing matching, and nothing loaded.

## Notes

**Three kinds of nothing**, and a product that draws the same panel for all
three tells the reader the wrong thing twice:

| | What happened | The way out |
| --- | --- | --- |
| `empty` | Nothing here yet, and that is normal | Create the first one |
| `filtered` | Plenty here, none of it matching | Widen the filter |
| `error` | It could not be fetched | Try again |

They differ in what the reader should do next — which is what an empty screen
is for — so they are a variant rather than three components.

```tsx
<EmptyState
  title="No works yet"
  body="Everything you start will show up here."
  action={<Button variant="primary">New work</Button>}
/>
```

**`action` is the point.** An empty screen with no way out is a dead end. It is
optional in the type because a small panel can borrow the way out from its
surroundings — but a full-page empty state without one is a bug the reader
cannot report.

**The error variant is not dashed.** A dashed border reads as a placeholder for
something that belongs there, and a failure is not that; it takes a solid,
tinted panel and says the title in the failure colour.

**The mark is a watermark, not a logo.** It is the line's hexagon in the
current text colour rather than a product's accent — a full-strength mark in an
empty panel shouts. It is inlined so it costs no request and can take the
theme's colour, and it is `aria-hidden`, because it says nothing a reader
needs. Pass `mark` to put a product's own illustration there instead.

**`plain` is the same three kinds with no frame.** The framed panel is for a
screen or a region that is empty. Inside something that already has a frame —
a widget, a card, a panel's list — a dashed box and a watermark are a frame
inside a frame, and products drew those empties as bare text instead, without
the way out. Plain keeps the words and the action and drops the rest: no
border, no mark, set in the flow on the left, where the content would have
started.

```tsx
<Panel>
  <SectionLabel>Score</SectionLabel>
  <EmptyState plain title="Not scored yet." action={<Button size="sm">Score it</Button>} />
</Panel>
```

**Where it is used automatically:**
[QueryState](/dowel/components/query-state/) draws it for a failure, and
[ErrorBoundary](/dowel/components/error-boundary/) for a crash.

**The marks are exported.** `EmptyMark`, `FilteredMark` and `ErrorMark` are there for a product composing its own panel.

## Props

### `EmptyMark`

The line's hexagon, at whatever size the caller asks for.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `className` | `string` |  |  |

### `FilteredMark`

The same hexagon, cut by a slash. For a filter that matched nothing: the shape is there, the contents are not.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `className` | `string` |  |  |

### `ErrorMark`

A hexagon with a corner broken out of it. For something that failed.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `className` | `string` |  |  |

### `EmptyState`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `variant` | `empty \| filtered \| error` | `'empty'` |  |
| `plain` | `boolean` | `false` |  |
| `title` (required) | `ReactNode` |  | What is not here, in the product's words. |
| `body` | `ReactNode` |  | Why, or what to do about it. |
| `action` | `ReactNode` |  | The one thing worth doing here. An empty screen with no way out is a dead end. |
| `mark` | `ReactNode` |  | Something other than the default mark - a product's own illustration. A plain empty state draws no mark, its own or the default. |

And every prop of `HTMLAttributes<HTMLDivElement>` except `title`, passed on.
