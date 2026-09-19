# StatusDot

Source: https://lacodda.github.io/dowel/components/status-dot

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#status-dot

The five conditions as dots, with and without their words, as badges, and with a shape standing in for the dot.

## Notes

Every product drew its own coloured circle, and every one of them drew it the
same way — a `<span>` with a background — which means the condition existed
for exactly the readers who could see it.

**The rule this pair is built on:**

> Colour is emphasis. The word is the message.

That is not a preference. About one man in twelve does not separate red from
green, `--good` and `--bad` are the two hues most screens rest on, and a
printed or projected screen loses the distinction for everybody. So `label` is
required, and a label that is not printed is still in the accessibility tree.

```tsx
<StatusDot status={run.ok ? 'good' : 'bad'} label={t(`run.state.${run.state}`)} />
```

**The word is announced once.** The dot and its text are one `role="img"` with
one `aria-label`, and the printed copy is `aria-hidden` — otherwise a reader
hears the state twice, once from the image and once from the text beside it.

**`StatusBadge` is the same fact with room to write it.** It is separate
rather than a variant because the choice between them is about the space on
the screen, not about the state — and a product that has the room should be
nudged towards the words. The badge is *not* named as an image: the word is on
the screen, and labelling it would replace the text a reader can already hear.

**A shape is the second channel.** `icon` replaces the dot with a tick, a cross
or an exclamation, which differ by shape rather than by hue. A badge given an
icon drops its dot — two marks for one condition is noise.

**`neutral` is not a fifth colour.** It is the absence of a judgement, for the
states that are neither good nor bad: queued, archived, unknown. Drawing those
in one of the four would be a claim the product did not make.

**No words of its own.** "Online" is the product's vocabulary in the product's
language. See [Badge](/dowel/components/badge/) for a label of any other kind,
and [Timeline](/dowel/components/timeline/), which takes the same vocabulary.

## Props

### `StatusDot`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` | `string` | | Required — what a reader gets in place of the colour |
| `status` | `good \| warn \| bad \| info \| neutral` | `neutral` | |
| `size` | `sm \| md \| lg` | `md` | |
| `showLabel` | `boolean` | `false` | Print the word beside the dot |
| `icon` | `ReactNode` | | A shape in the dot's place |
| `className` | `string` | | Merged so the caller wins a conflict |

### `StatusBadge`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `status` | `good \| warn \| bad \| info \| neutral` | `neutral` | |
| `icon` | `ReactNode` | | A shape before the word; drops the dot |
| `dot` | `boolean` | `true` | |
| `children` | `ReactNode` | | The word, in the product's language |
