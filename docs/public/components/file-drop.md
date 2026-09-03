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
