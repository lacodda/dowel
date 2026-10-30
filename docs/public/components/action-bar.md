# ActionBar

Source: https://lacodda.github.io/dowel/components/action-bar

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#action-bar

At the foot of a form, and as groups of editor actions.

## Notes

**It is a toolbar, and that is the whole point.** Built on Base UI's Toolbar,
so the bar is one tab stop and the arrow keys move between its buttons. Without
that, a reader tabbing out of the last field lands in a queue of five buttons
instead of on Save — which is exactly where an action bar sits.

```tsx
<ActionBar position="bottom" aria-label={t('form-actions')}>
  <ActionBarButton render={<Button variant="primary">{t('save')}</Button>} />
  <ActionBarButton render={<Button variant="ghost">{t('cancel')}</Button>} />
  <ActionBarSpacer />
  <ActionBarButton render={<Button variant="danger">{t('delete')}</Button>} />
</ActionBar>
```

**The buttons stay yours.** `ActionBarButton` takes your element through
`render` and composes with it, so a `Button` keeps its variants and gains the
toolbar's keyboard handling. This draws the strip; it does not decide what is
in it.

**`position` is why it exists.** A long form whose Save button is a thousand
pixels below the field being edited has a Save button the reader has to go
looking for. `bottom` and `top` stick; `static` is a strip in the flow of the
page.

**The seam faces the content.** Stuck at the bottom the rule is on top of the
bar, at the top the other way about — a bar that drew both would read as a box.
A static bar draws neither, because there is nothing to separate it from.

**Name it when a page has more than one.** "Formatting" and "Bulk actions" are
different toolbars, and a screen reader announcing "toolbar" twice tells the
reader nothing about which one they are in.

**Stacking comes from the theme.** A stuck bar uses `--z-sticky` rather than a
number invented here, so it agrees with every overlay in the set instead of
fighting one.

## Props

### `ActionBar`

The bar.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `position` | `bottom \| top \| static` | `'static'` |  |
| `justify` | `start \| end \| between` | `'start'` |  |

And every prop of Base UI's `Toolbar.Root`, passed on.

### `ActionBarButton`

A button in the bar. Give it the set's own `Button` through `render`, so the toolbar's arrow keys reach it and the button keeps its variants.

Base UI's `Toolbar.Button`, unchanged under dowel's name.

### `ActionBarSeparator`

A rule between groups of actions. Decorative, and announced as a separator rather than as a control.

Every prop of Base UI's `Toolbar.Separator`, passed on.

### `ActionBarGroup`

A group of related actions inside the bar - the three alignment buttons, a pair of toggles. Groups the arrows walk as one.

Every prop of Base UI's `Toolbar.Group`, passed on.

### `ActionBarSpacer`

Pushes what follows to the far end. A plain spacer, so a bar can put Cancel beside Save and everything else to the left without a wrapper.
