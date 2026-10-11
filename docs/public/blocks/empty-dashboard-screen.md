# EmptyDashboardScreen

Source: https://lacodda.github.io/dowel/blocks/empty-dashboard-screen

FENCE0 

The block lands in `components/blocks/empty-dashboard-screen.tsx`, and what it
is made of - [Frame](/dowel/components/frame/),
[Progress](/dowel/components/progress/),
[StatTile](/dowel/components/stat-tile/) and
[PageHeader](/dowel/components/page-header/) - in `components/ui`.

See it live on the stand: https://lacodda.github.io/dowel/stand/#empty-dashboard-screen

Four first steps, one done; press the next to move on.

## Notes

**A zero is a claim.** A dashboard with nothing in it is the first screen a
product shows anyone, and drawn as a dashboard with every number at zero it
reads as broken rather than new: a row of tiles saying 0, 0, 0 and a chart
with no line. Nothing has happened because nothing has had the chance to. So
the screen leads with what to do, and the figures to come follow with a dash
where a number will be - the shape of the dashboard, not a report of nothing.

**One next thing.** The steps are a list in order, and only the first one not
yet done carries its action - not four buttons competing for the first press.
It is marked `aria-current="step"`, and every step says whether it is done in
words as well as with a mark, for a reader who cannot see a tick or a strike.

```tsx
<EmptyDashboardScreen
  title="Welcome, Ines"
  steps={[
    { id: 'account', title: 'Make your account', done: true },
    { id: 'work', title: 'Start your first work', done: works.length > 0,
      action: <Button size="sm" variant="primary" onClick={newWork}>New work</Button> },
  ]}
  figures={[{ label: 'Works' }, { label: 'Released' }]}
  words={{ steps: 'Getting started', progress: (done, total) => `${done} of ${total} done`,
           done: 'done', notYet: 'not yet', figures: 'What will show here' }}
/>
```

**The count is words, the bar is a bar.** "1 of 4 done" beside a bare
[Progress](/dowel/components/progress/): its own label row would add a
percentage, and 25% of four steps says less than the count does.

**The steps scroll, the figures stay.** The steps' pane is as tall as its
steps and shrinks when the window is shorter, scrolling inside itself, so the
figures under it stay in sight.

**When every step is done, show the dashboard.** The block has nothing current
then and no action to offer; it is the product's cue to draw the real one.

## Props

| Prop | Type | | |
| --- | --- | --- | --- |
| `title` | `ReactNode` | | "Welcome, Ines" |
| `description` | `ReactNode` | | A line under it |
| `actions` | `ReactNode` | | What acts on the screen |
| `steps` | `readonly FirstStep[]` | | `{ id, title, description?, done, action? }` |
| `figures` | `readonly FutureFigure[]` | | `{ label }` - the figures the full dashboard will have |
| `words` | `EmptyDashboardScreenWords` | | `{ steps, progress, done, notYet, figures }` |
