# Textarea

Source: https://lacodda.github.io/dowel/components/textarea

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#textarea

Fixed and growing, with and without a ceiling.

## Notes

**`autoResize` is the reason this is not just a taller Input.** A fixed box
makes someone scroll inside a scroll; a box that grows without limit pushes the
button they are reaching for off the screen. `maxRows` is where it stops
growing and starts scrolling after all.

```tsx
<Textarea autoResize maxRows={10} />
```

**Height is reset before measuring.** Worth knowing if you write your own: a
box already tall enough reports its own height as `scrollHeight`, so without
the reset it grows and never shrinks back.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `autoResize` | `boolean` | `false` | Grow to fit instead of scrolling |
| `maxRows` | `number` | | Stop growing here and scroll |

Everything else goes to the `<textarea>`.
