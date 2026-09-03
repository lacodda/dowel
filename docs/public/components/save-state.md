# SaveState

Source: https://lacodda.github.io/dowel/components/save-state

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#save-state

Beside a field, the three states, and running.

## Notes

**A form without a Save button still has to say what it did.** Otherwise the
reader is left guessing whether their edit survived, and the usual answer to
that guess is pressing Ctrl+S at a page that has no such thing.

```tsx
const status = useSaveStatus(mutation.isPending, mutation.isError)

<SaveState
  status={status}
  savingLabel={t('save.saving')}
  savedLabel={t('save.saved')}
/>
```

**The tick decays.** One that never leaves stops meaning "just now" and becomes
furniture — part of the layout the reader stops seeing, which is the opposite
of what an indicator is for. `linger` controls how long it stays.

**Only a real save earns one.** The hook watches the falling edge of the
mutation, so mounting beside one that is already idle shows nothing. Without
that, arriving at a page would flash a tick for a save that happened before the
reader got there.

**A failure is not a save.** Pass `isError` and the tick is skipped: the
failure is already being announced by a toast or an error on the field, and
saying "saved" underneath that is worse than saying nothing at all.

**It holds its width when idle.** The line sits next to a field; if it grew and
shrank with its own text, the layout would twitch on every save. It goes
transparent rather than away.

**One live region, announced politely.** The ring is drawn from
[Spinner](/dowel/components/spinner/)'s variants rather than by using Spinner,
which carries its own `role="status"` — nesting live regions gives a screen
reader two announcements for one event. And `polite` rather than `assertive`,
because interrupting someone mid-sentence to say a field saved is how people
learn to turn a screen reader's verbosity down.

**The words are yours.** A primitive with a string of its own cannot be
translated.
