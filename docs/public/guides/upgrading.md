# Upgrading dowel

Source: https://lacodda.github.io/dowel/guides/upgrading

A product on dowel holds it in two ways, and they move differently. The
**package** - the theme, the lint rules, the `dowel` command - is a dependency,
and upgrading it moves it. The **components** were copied in by the registry
and are the product's own files: nothing upstream reaches into them, so an
upgrade leaves them as they are until you decide otherwise.

## The package

```console
$ npm install dowel-ui@latest
```

The theme, the lint rules and the command update in place. Lint is where a
change to the rules shows first; `npx dowel doctor` says whether the
installation is still wired the way the theme expects.

When the upgrade brings a new Base UI, `npx dowel codemod` rewrites what it
renamed in your own code and in copies you changed - see
[what Base UI renamed](/dowel/guides/migration/#what-base-ui-renamed).

## The components you copied

```console
$ npx dowel diff
```

[`diff`](/dowel/guides/migration/#what-you-changed-since) compares every copy in
the project with the catalogue of the version just installed, and splits them
in two:

- **Copies you never changed** are behind, not edited. Add them again and they
  are current:

  ```console
  $ npx shadcn add https://lacodda.github.io/dowel/r/date-picker.json --overwrite
  ```

- **Copies you changed** are yours to merge. Each component's page ends with
  its history - every release that touched the file, and how - so the merge
  starts from what changed upstream rather than from a diff of two strangers.

Then `npx dowel check`, the type checker and the linter: a break below is
almost always a type error or a lint error first.

## What breaks, and the way through

dowel is before 1.0, and a minor release can break a product. Every break is
listed here, newest first, with what to do about it. Read from the version you
are on up to the one you are moving to - the list is the changelog's own, read
out of it, so it is never a release behind.

At 1.0 this is the migration guide from 0.x: everything above the version you
start from. After 1.0, a break is a major release, and a token renamed is one of
them - with the old name and the new in the same place.

### 0.38.0 - 2026-10-19

**Name a day by what it draws, and make a line a target by its size**

LINE_GAP is removed and LINE_HEIGHT is 24 (was 20); linesThatFit divides by LINE_HEIGHT. A line drawn by the product is 24px tall with nothing between lines. BigCalendarItem's className and style land on the line; its colour, outline and ring are on the chip inside.

**Take a chosen date back**

SchemaFieldsWords gains clearDate (the button that takes back a date in an optional field), required like every other word.

### 0.35.0 - 2026-10-07

**One list of commands for keys, palette and sheet**

`useShortcut` is removed - declare `useCommand({ id, label, keys: 'Mod+K', run })` instead. `Kbd keys`, `CommandPaletteInput hint` take a string (`keys="Mod+K"`, `hint="Escape"`), and SearchField's `shortcut` is a command: `shortcut={{ id: 'search', label, keys: 'Mod+K' }}`.

### 0.33.0 - 2026-09-25

**No-raw-button and no-arbitrary-scale**

dowel.configs.recommended turns both rules on as errors. A product upgrading runs eslint --fix for the exact steps, then takes a step or writes a reasoned disable for what is left, and moves screen buttons onto Button, RowButton, Chip or SegmentedControl.

### 0.32.0 - 2026-09-24

**Stand on the control rows and size the icon at every size**

Button sm is 32px tall at default density (28 under data-density="compact"); pin a height at the call site to keep 28. An explicit size-* on an icon inside icon-sm/icon-md now wins.

**A layer for popups inside overlays, a body that scrolls alone**

DialogPopup, DrawerPopup and ConfirmDialogPopup no longer pad or scroll their content. Put the title and description in DialogHeader, the content in DialogBody and the buttons in DialogActions (Drawer*/ConfirmDialog* for the other two).

### 0.31.0 - 2026-09-23

**Dates and numbers in the application's language**

formatNumber, formatTime, sortRows and the calendar helpers take the locale as a required argument, and formatRelative takes it second: formatRelative(value, locale, now?, options?). The locale props are `string` rather than a list. Pass useLocale().

### 0.28.0 - 2026-09-19

**Density as a property of a region**

`Table` no longer takes a `density` prop. Row height now follows the region's density, so `<Table density="dense">` becomes a `data-density="compact"` on any ancestor - a wrapper, the panel, the page. The prop's two values map onto the shared vocabulary: `base` is the default density and `dense` is `compact`.

**A judgement has to bring a mark, and the type says so**

`StatTile` with `tone="warn"` or `tone="bad"` now requires an `icon`. Pass the mark the product already uses for a problem - a triangle, a cross - and it is drawn before the figure. Tiles with `default` or `accent` are unchanged.

### 0.9.0 - 2026-09-01

**The recommended config now carries two rules**

`dowel.configs.recommended` now enables `dowel/no-native-select` alongside `dowel/no-raw-color`. A product that uses the recommended config and has a native `<select>`, `<option>` or `<optgroup>` anywhere in its TSX will start failing its lint.

The fix is the Select or Combobox component from the registry. Where a native element is genuinely wanted - a print sheet, a form posting without JavaScript - turn the rule off for those files:

```diff
{ files: ['src/print/**'], rules: { 'dowel/no-native-select': 'off' } }
```

### 0.8.0 - 2026-08-31

**Compose with `render`, and drop Radix**

`asChild` is replaced by `render`, which takes the element instead of a boolean.

```diff
- <Button asChild><a href="/x">Go</a></Button>
+ <Button render={<a href="/x" />}>Go</Button>
```

`@radix-ui/react-slot` is no longer a dependency of anything here.

### 0.7.0 - 2026-08-31

**Require the words Chip and Copyable announce**

`Copyable` requires `label` and `copiedLabel`, and `Chip` requires `removeLabel` alongside `onRemove` - the two now travel together in the type, so a chip that can be removed but not named does not compile. A primitive with a string of its own cannot be translated: it ships in English to every reader who does not read English, and the product's i18n never reaches it.

```diff
- <Copyable value={sha}>{short}</Copyable>
+ <Copyable value={sha} label={t('copy')} copiedLabel={t('copied')}>{short}</Copyable>
```

```diff
- <Chip onRemove={() => drop(tag)}>{tag}</Chip>
+ <Chip onRemove={() => drop(tag)} removeLabel={t('remove')}>{tag}</Chip>
```

Neither component was installed in any product of the line yet, so nothing downstream had to change.
