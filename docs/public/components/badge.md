# Badge

Source: https://lacodda.github.io/dowel/components/badge

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#badge

Every variant, including the four status colours.

## Notes

**A badge is not a button.** It is state attached to something — a count, a
status, a label. If it can be clicked, it is a [Chip](/dowel/components/chip/).

**Colour is emphasis, never the message.** A badge that means "failed" says so
in words as well. Colour alone is invisible to a reader who does not separate
red from green, and to anyone printing the screen.

```tsx
<Badge variant="bad">Failed</Badge>
```

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `variant` | `outline \| soft \| accent \| good \| warn \| bad \| info` | `outline` | |
