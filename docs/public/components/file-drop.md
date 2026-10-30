# FileDrop

Source: https://lacodda.github.io/dowel/components/file-drop

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#file-drop

Taking files, filtering them, and closed.

## Notes

**It takes files. It does not upload them.** Where they go, with which
credentials, retried how, resumed or not — that is your transport, and a
primitive that owned it would be wrong for every product whose upload does not
look like the one it guessed. This is the same boundary
[Field](/dowel/components/field/) draws around validation: the component knows
the shape of the interaction, you know what the interaction means.

```tsx
<FileDrop
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  multiple
  onFiles={(files) => upload(files)}
  onReject={(rejections) => toast(explain(rejections))}
  aria-label={t('attachments')}
>
  {t('drop-or-choose')}
</FileDrop>
```

**There is a real `<input type="file">` underneath**, hidden with `sr-only`
rather than `display: none`. That is not fussiness: hidden the other way it is
unfocusable, the label stops reaching it, and the field becomes mouse-only. The
native input is also what the operating system's picker attaches to and what a
screen reader announces as a file field.

**Rejected files are reported, not swallowed.** A file dropped and silently
ignored looks like a broken page. `onReject` hands back each file with a
reason — `type`, `size` or `count` — and you turn that into a sentence, in your
own language.

**Two browser defaults are handled**, and both are invisible until they are
not. `dragover` is prevented, without which the browser navigates to the
dropped file and the form the reader was filling in is simply gone. And the
input's value is cleared after each change, without which choosing the same
file twice in a row fires nothing the second time.

**The lit state counts enters and leaves rather than toggling.** `dragleave`
fires when the pointer crosses onto a *child* of the zone, so a zone that
toggled on it flickers as the pointer moves over its own text — the commonest
defect in hand-written drop zones.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `onFiles` (required) | `(files: File[]) => void` |  | Called with the files that passed the filters. |
| `onReject` | `(rejections: FileRejection[]) => void` |  | Called with the ones that did not, so the product can say why. |
| `accept` | `string` |  | What to take, in the form `<input accept>` uses: `image/*`, `.pdf,.docx`. |
| `maxSize` | `number` |  | Largest file, in bytes. |
| `maxFiles` | `number` |  | How many at once. Without it, any number. |
| `multiple` | `boolean` |  | Whether several may be chosen in the picker. |
| `disabled` | `boolean` |  | Dims the zone, ignores drops and disables the input underneath. |
| `children` | `ReactNode` |  | What the zone says. The product's words, in the product's language. |
| `className` | `string` |  |  |
| `id` | `string` |  | The `id` of the hidden file input, which the zone's label points at. A generated one if omitted. |
| `aria-label` | `string` |  | Names the field for a screen reader, when there is no visible label. |
| `aria-labelledby` | `string` |  | The `id` of the element that names the field, when it is not the zone's own text. |
| `aria-describedby` | `string` |  | The `id` of the element that describes the field - the accepted types, the size limit. |
