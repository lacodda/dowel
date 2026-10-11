# SettingsScreen

Source: https://lacodda.github.io/dowel/blocks/settings-screen

FENCE0 

The block lands in `components/blocks/settings-screen.tsx`, and what it is made
of - [Frame](/dowel/components/frame/),
[SectionNav](/dowel/components/section-nav/) and
[PageHeader](/dowel/components/page-header/) - in `components/ui`.

See it live on the stand: https://lacodda.github.io/dowel/stand/#settings-screen

Four sections; the profile keeps a draft, with its bar at the foot; at a phone's width the column comes first.

## Notes

**A section per address.** kilna's settings sat on one page until a version
counted what was on it - a profile editor, a status check, export, backup,
they came for. Each section is its own address now, so it can be linked to
and the back button walks between them. Pass `sectionRender` to draw a
section as the router's link:

```tsx
<SettingsScreen
  title="Settings"
  sections={sections}
  active={section ?? null}
  onSelect={(id) => navigate(id === null ? '/settings' : `/settings/${id}`)}
  sectionRender={(section) => <NavLink to={`/settings/${section.id}`} />}
  words={{ sections: 'Settings', back: 'All settings' }}
/>
```

**The column says what is in each section.** "Theme, language, start
screen" under General, so a section is chosen by its contents rather than
guessed from a word. The column is the rail's width - it holds destinations,
like the app's own rail beside it - and it does not move while a long section
scrolls.

**Null is the column on a phone and the first section on a desktop.** Where
there is room for both, something is always open, and the first section
stands in for none. Where there is not, `active={null}` is the column alone,
which is what `/settings` should be on a phone - one address, right at both
widths, with no width read in script.

**A section can stand a bar at its foot.** `foot` is outside the part that
scrolls, so a Save for a section that keeps a draft is in sight however far
down the edit was - and only while there is something to save, if the
product passes it only then.

**`SettingsGroup` is the shape inside a section.** A heading, a line under
it, and the fields one under another at the width of a field: side by side,
a segment and a select read as one control of two halves, and a field the
width of the pane asks the eye to cross a monitor between a label and what
it names.

```tsx
<SettingsGroup title="Appearance">
  <FieldGroup label="Theme">
    <SegmentedControl aria-label="Theme" value={theme} onValueChange={setTheme}>…</SegmentedControl>
  </FieldGroup>
  <Switch checked={reopen} onCheckedChange={setReopen}>Open where I left off</Switch>
</SettingsGroup>
```

## Props

| Prop | Type | | |
| --- | --- | --- | --- |
| `title` | `ReactNode` | | The screen's title |
| `description` | `ReactNode` | | One sentence under it |
| `sections` | `readonly SettingsSection[]` | | `{ id, label, description?, icon?, content, foot? }` |
| `active` | `string \| null` | | The open section, or `null` |
| `onSelect` | `(id \| null) => void` | | Told which section to open, or `null` to go back |
| `sectionRender` | `(item) => RenderProp` | | A section as the product's link |
| `words` | `{ sections, back }` | | The column's name, and the way back |

### SettingsGroup

| Prop | Type | | |
| --- | --- | --- | --- |
| `title` | `ReactNode` | | The group's heading |
| `description` | `ReactNode` | | A line under it |
| `children` | `ReactNode` | | Its fields, one under another |
