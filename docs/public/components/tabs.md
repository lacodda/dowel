# Tabs

Source: https://lacodda.github.io/dowel/components/tabs

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#tabs

Line tabs over their panels, vertical tabs, and a window bar of open documents - one unsaved, each closable.

## Notes

Two shapes, because the line needs two things that look nothing alike.

```tsx
<Tabs defaultValue="general">
  <TabsList aria-label={t('settings')}>
    <TabsTab value="general">{t('general')}</TabsTab>
    <TabsTab value="storage">{t('storage')}</TabsTab>
  </TabsList>
  <TabsPanel value="general"><General /></TabsPanel>
  <TabsPanel value="storage"><Storage /></TabsPanel>
</Tabs>
```

**`line`** is the row of words over a panel, the active one underlined in the
accent. The rule slides between tabs because Base UI measures the active tab
and hands its box over as CSS variables.

**`bar`** is the strip of open documents that lives inside a frameless
window's [title bar](/dowel/components/window-frame/). A separate tab row
under a system title bar spends about sixty pixels of a laptop screen twice;
scheda made that trade first. A bar tab is as tall as the bar, the active one
takes the page's ground so it reads as joined to the document below, and a
two-pixel accent rule on its top edge marks it where an underline would sit
against the window's edge. The strip scrolls sideways instead of squeezing
names.

```tsx
<TitleBar labels={t('window', { returnObjects: true })} mark={<ProductMark />}>
  <Tabs value={active} onValueChange={select}>
    <TabsList variant="bar" aria-label={t('openDocuments')}>
      {documents.map((doc) => (
        <TabsTab
          key={doc.id}
          value={doc.id}
          modified={doc.dirty}
          modifiedLabel={t('unsaved')}
          onClose={() => close(doc.id)}
          closeLabel={t('close', { name: doc.name })}
        >
          {doc.name}
        </TabsTab>
      ))}
    </TabsList>
  </Tabs>
</TitleBar>
```

**The close is not inside the tab.** The obvious markup puts a close button
inside the `tab`, which is an interactive element nested in another: a screen
reader flattens the two into one control and a keyboard cannot reach the
second. axe reports it as `nested-interactive`, and the test for this
component fails on exactly that. So the cross is a sibling drawn over the tab,
for the pointer only, out of the tab order and out of the reading. The
keyboard closes the focused tab with **Delete**, which the tab announces
through `aria-keyshortcuts`. A middle click closes too.

**The cross is always drawn**, faintly, rather than revealed on hover. A
button that appears under the pointer is one the pointer was not aiming for.
Its hit area meets the line's target floor through `target-min` while the
glyph stays small.

**Unsaved changes are words, not only a dot.** `modified` draws a dot in the
accent; `modifiedLabel` is what a reader hears, as part of the tab's name
("plan.md unsaved changes"). The types will not accept one without the other,
and the same goes for `onClose` and `closeLabel`: the component has no English
of its own to fall back on.

## Props

### `Tabs`

Every prop of Base UI's `Tabs.Root`, passed on.

### `TabsList`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `variant` | `line \| bar` | `'line'` |  |
| `aria-label` | `string` |  | A name for the list, when nothing on the screen already says what the tabs choose between. Documents in a window bar need one. |

And every prop of Base UI's `Tabs.List`, passed on.

### `TabsTab`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `modified` (with `closeLabel`, `modifiedLabel`, `onClose`) | `false \| true` |  | The document has changes that are not saved. |
| `modifiedLabel` (with `closeLabel`, `modified`, `onClose`) | `string` |  | What a reader hears for the dot, e.g. "unsaved changes". |
| `onClose` (with `closeLabel`, `modified`, `modifiedLabel`) | `() => void` |  | Closes the tab: from the cross, a middle click, or Delete. |
| `closeLabel` (with `modified`, `modifiedLabel`, `onClose`) | `string` |  | The cross's tooltip, e.g. "Close notes.md". |
| `children` (required) | `ReactNode` |  |  |

And every prop of Base UI's `Tabs.Tab` except `children`, passed on.

### `TabsPanel`

Every prop of Base UI's `Tabs.Panel`, passed on.
