# Divider

Source: https://lacodda.github.io/dowel/components/divider

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#divider

A plain rule, a captioned break, a vertical rule in a row of controls, and a section heading with its own actions.

## Notes

The set already had four separators — in the menu, the select, the context
menu and the action bar — and each was written inside the thing it divided, so
a screen that wanted a rule between two sections had nothing and reached for a
bare `<hr>` or a `div` with a background.

```tsx
<SectionHeader title={t('versions')} description={t('versions.hint')} actions={<Button>{t('add')}</Button>} />
<VersionList />

<Divider label={t('archived')} spacing="lg" />
<ArchivedList />
```

**A rule is a claim, and `decorative` withdraws it.** A boundary between
sections carries `role="separator"`, which is what tells a reader the content
after it is a different thing. A rule that is only drawing — a hairline inside
a card, a tick between two numbers — should not be announced at all, and a
reader hearing "separator" six times in one row is being read the styling.

It is not Base UI's `Separator`, which was the obvious dependency and does not
do the one thing this is for: it renders a `div` with `aria-orientation` and
no role, so nothing is announced as a separator at all. That was measured by
rendering it, not read off the documentation.

**A vertical rule stretches, it does not fill.** `h-full` in a flex row of
buttons resolves to zero — a rule that is in the markup and invisible on the
screen — so this one is `self-stretch`.

**Spacing follows the axis.** `md` is `my-4` on a horizontal rule and `mx-4`
on a vertical one; the same step on the wrong axis is the bug that pair
prevents. The default is `none`, because the common case is a rule inside
something already padded.

**A caption in the line.** `label` makes the rule a captioned break: the rule
runs to the word, the word sits in it, and the rule continues. It is a heading
for a run of content that does not deserve one — "Today", "Archived", "or".
Horizontal only; there is no reading direction that puts a word inside a
vertical rule.

**`SectionHeader` is an `h2`.**
[`PageHeader`](/dowel/components/page-header/) holds the screen's `h1` and a
section is one level inside it, so a reader moving by heading walks the
screen's actual structure. It is the between-size heading the products kept
writing by hand: above `SectionLabel`'s uppercase caption and below the page's
title.

## Props

### `Divider`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `orientation` | `horizontal \| vertical` | `horizontal` | |
| `spacing` | `none \| sm \| md \| lg` | `none` | Follows the axis |
| `label` | `ReactNode` | | A caption in the line; horizontal only |
| `decorative` | `boolean` | `false` | Drawing rather than structure |
| `className` | `string` | | Merged so the caller wins a conflict |

### `SectionHeader`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `title` | `ReactNode` | | Required, an `h2` |
| `description` | `ReactNode` | | The line under it |
| `actions` | `ReactNode` | | Buttons belonging to this section |
| `className` | `string` | | Merged so the caller wins a conflict |
