# QueryState

Source: https://lacodda.github.io/dowel/components/query-state

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#query-state

Pending, failed, empty and ready - press through them.

## Notes

**Every list writes this ladder**, and writes it slightly differently each
time. What differs is never deliberate: one screen forgets the empty case,
another shows a spinner where the shape was known, a third prints the raw error
object. This is that ladder, once.

**It takes values, not a query.** `useQuery` hands back `isPending` and
`error`, and those are ordinary values — so this asks for them rather than for
the query result, and works the same with TanStack Query, with SWR, with a
reducer, or with two `useState` calls:

```tsx
const works = useQuery({ queryKey, queryFn })

<QueryState
  pending={works.isPending}
  error={works.error}
  empty={works.data?.length === 0}
  errorLabels={{ title: 'Could not load' }}
  emptyState={<EmptyState title="No works yet" />}
>
  <Works rows={works.data} />
</QueryState>
```

Taking the result object would put a library in the registry — and therefore in
every product that installs this primitive — to save one line at the call site.

**The order of the cases is the component**, and it is the part that goes wrong
by hand:

1. **pending**, because a refetch that already has data should not blank the
   screen it is refreshing — the caller decides that by passing `pending` only
   when there is nothing to show;
2. **error**, because an error with stale data is still an error, and "nothing
   found" for a request that failed is a lie;
3. **empty**, which is the only one that cannot be known until something has
   arrived.

**`aria-busy` is on the region**, said once — which is why the
[Skeletons](/dowel/components/skeleton/) inside are `aria-hidden`.

**`empty` is computed by the caller**, because only the caller knows whether
empty means `[]`, `null`, or a count of zero.

**What it does not do:** fetch, retry or cache. Those belong to whatever owns
the data, and a component that guessed at them would be wrong for the product
that owns them differently. A crash while rendering is
[ErrorBoundary](/dowel/components/error-boundary/), not this.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `pending` | `boolean` | `false` | Nothing has arrived yet |
| `error` | `{ message } \| string \| null` | `null` | Anything with a message |
| `empty` | `boolean` | `false` | Something arrived, and it was nothing |
| `skeleton` | `ReactNode` | `<SkeletonList />` | What stands in while pending |
| `emptyState` | `ReactNode` | | Shown when nothing came back |
| `errorState` | `(message) => ReactNode` | | Draw the failure yourself |
| `errorLabels` | `{ title, body? }` | | Words for the default failure screen |
