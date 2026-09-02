# Choosing an overlay

Source: https://lacodda.github.io/dowel/guides/overlays

Six things in this set float above the page, and they look similar enough that
picking the wrong one is easy. The difference is never how they are drawn — it
is what they promise the reader.

## Which one

| | Interrupts? | Holds actions? | Opens on |
| --- | --- | --- | --- |
| **Dialog** | yes | yes | a deliberate click |
| **ConfirmDialog** | yes, harder | yes, one of them destructive | a deliberate click |
| **Drawer** | yes | yes | a deliberate click |
| **Popover** | no | yes | a deliberate click |
| **PreviewCard** | no | no | hover, after a pause |
| **Tooltip** | no | never | hover or focus |

**Dialog** stops the work. Everything behind it goes inert — not merely dimmed,
but out of reach of the keyboard and of a screen reader — so use it when the
answer is genuinely needed before anything else can happen.

**ConfirmDialog** is a Dialog for a choice that cannot be taken back. It
announces itself as `alertdialog`, and **clicking away does not dismiss it** —
an answer given by a stray click is exactly what it exists to prevent. `Escape`
still closes it, deliberately: a popup with no keyboard exit is a trap, and
pressing Escape is a decision rather than an accident. Reach for it when the
action deletes, overwrites or sends.

**Drawer** is a Dialog that arrives from an edge. Same interruption, more room;
it suits a panel of settings or a form that would look cramped in a box.

**Popover** floats next to what opened it and leaves the page alone. It can
hold controls — a filter, a small form, a menu of options. If the reader can
carry on without answering it, this is the one.

**PreviewCard** is what a link looks like before you follow it. It appears on
hover after a pause, and it is not for anything the reader has to click:
appearing on hover means it can vanish on the way to the thing inside it.

**Tooltip** names a control that is otherwise only an icon. It carries no
interactive content at all — never a link, never a button — because there is no
way to reach one with a keyboard. If you want to put a button inside a tooltip,
you want a Popover.

:::caution[The trigger needs its own label]
Base UI puts neither `role="tooltip"` on the popup nor `aria-describedby` on the
trigger: a tooltip here is **for sighted users**, and a screen reader never
reads it. The same is true of PreviewCard.

So the control must carry the meaning itself:

```tsx
<TooltipTrigger render={<Button variant="icon" aria-label={t('delete')} />}>
  <TrashIcon />
</TooltipTrigger>
<TooltipPopup>{t('delete')}</TooltipPopup>
```

Without that `aria-label`, the button is announced as "button" and the tooltip
is the only thing that would have said what it does — to everyone except the
people who cannot see it.
:::

:::caution
A tooltip is also not a place for information the reader needs. It is invisible
on a touch screen and gone the moment the pointer moves. Anything essential
belongs on the page.
:::

## What they all get right

The behaviour is Base UI's, which means it is the same behaviour in each of
them and it is the part that is hard to write:

- focus moves into the overlay when it opens and returns to whatever opened it
  when it closes;
- `Escape` closes what should be closeable;
- a modal locks the scroll and marks the page behind it inert;
- the popup is named by its own title through `aria-labelledby`, without anyone
  wiring up an id.

What is dowel's is the clothes — and the enter and the leave, which are class
lists rather than a state machine, because Base UI puts `data-open`,
`data-closed` and `data-starting-style` on the element for you.

## Stacking

Overlays sit on named layers rather than on numbers picked in the moment:

```css
--z-popup: 10;      /* a popup in the flow */
--z-sticky: 20;
--z-menu: 30;
--z-floating: 40;   /* Popover, PreviewCard */
--z-overlay: 50;    /* the scrim */
--z-modal: 60;      /* Dialog, ConfirmDialog, Drawer */
--z-palette: 70;
--z-toast: 80;      /* has to clear everything */
```

A component reads these directly — `[z-index:var(--z-modal)]` — because
Tailwind has no z-index namespace and `z-50` would be a literal fifty with
nothing to say about what it covers.
