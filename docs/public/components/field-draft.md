# FieldDraft

Source: https://lacodda.github.io/dowel/components/field-draft

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#field-draft

An input and a textarea over a stored value, with the stored value beside them and a write from outside.

## Notes

**A field that writes somewhere holds two things at once** — what is stored and
what is in the box — and every product that wrote one by hand broke a different
rule between them. kilna broke all of them, one screen at a time:

- **Leaving writes only a change.** The Overview wrote on every blur, so tabbing
  through twelve fields was twelve operations in the history and twelve toasts.
- **While nobody is typing, the box follows the stored value.** The fields were
  uncontrolled, so a value a plugin wrote kept showing the old one — and the
  next blur wrote the old one back over it.
- **While someone is typing, their words win until they leave.** A refetch in
  the middle of a sentence does not take it away from them.
- **Escape puts back what is stored and writes nothing** — and stops there, so a
  screen-level Escape (closing a panel, a dialog) does not also fire.
- **Enter on something unreadable keeps the words and says so**, with
  `aria-invalid`. Leaving with them puts the stored value back.

`useFieldDraft` is those rules wired to an input: spread what it returns onto an
[Input](/dowel/components/input/) or a [Textarea](/dowel/components/textarea/).
[InlineField](/dowel/components/inline-field/) is built on it; this is for a
field of your own.

```tsx
const title = useFieldDraft(work.title, (text) => save({ title: text }))
<Input aria-label={t('title')} {...title} />

const notes = useFieldDraft(work.notes, (text) => save({ notes: text }), { multiline: true })
<Textarea aria-label={t('notes')} {...notes} />
```

**The value is text on both sides.** The hook compares what is typed with what
is stored as strings, so a value that is not text is spelled first —
`format(value)` in, `parse(text)` in `onCommit`. `readable` says which texts can
be written at all; unreadable text is never handed to `onCommit`.

**`onCommit` can refuse** by returning `false` — a server that said no — and the
box goes back to what is stored.

**Enter leaves the field**, which writes it — except with `multiline`, where
Enter is a new line, and never while an input method is composing, where Enter
picks the candidate.

**`stepDraft` is the whole of it, pure.** The rules are a function from a state
and an event to the next state and the text to write, tested without a DOM;
the hook only wires it. Use it directly for a field the hook does not fit.

## API

```ts
useFieldDraft(
  value: string,
  onCommit: (text: string) => boolean | void,
  options?: { multiline?: boolean; readable?: (text: string) => boolean },
): { value, 'aria-invalid', onFocus, onChange, onBlur, onKeyDown }

stepDraft(state: DraftState, event: DraftEvent): { state: DraftState; commit: string | null }
startDraft(stored: string): DraftState
```

| Event | |
| --- | --- |
| `stored` | The stored value moved underneath — a refetch, a plugin, an undo |
| `focus` / `type` | Someone is in the field, typing |
| `refuse` | Enter on unreadable text: keep it, mark it |
| `escape` | Put back what is stored |
| `leave` | Write the text if it changed |
