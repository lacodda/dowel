# Changelog

All notable changes to this project are documented in this file.

## [0.9.0] - 2026-09-01

### Breaking Changes

- **The recommended config now carries two rules**
`dowel.configs.recommended` now enables
`dowel/no-native-select` alongside `dowel/no-raw-color`. A product that
uses the recommended config and has a native `<select>`, `<option>` or
`<optgroup>` anywhere in its TSX will start failing its lint.

The fix is the Select or Combobox component from the registry. Where a
native element is genuinely wanted - a print sheet, a form posting
without JavaScript - turn the rule off for those files:

  { files: ['src/print/**'], rules: { 'dowel/no-native-select': 'off' } }

### Features
- Forbid the native `<select>`
- Menu, ContextMenu, Select and Combobox
- The recommended config now carries two rules

## [0.8.0] - 2026-08-31

### Breaking Changes

- **Compose with `render`, and drop Radix**
`asChild` is replaced by `render`, which takes the
element instead of a boolean.

  - <Button asChild><a href="/x">Go</a></Button>
  + <Button render={<a href="/x" />}>Go</Button>

`@radix-ui/react-slot` is no longer a dependency of anything here.

### Bug Fixes
- Let the scrim be turned off, and show the overlays closed

### Features
- Compose with `render`, and drop Radix
- Dialog, ConfirmDialog, Drawer, Popover, PreviewCard, Tooltip

### Testing
- Pin what this environment can say about the scroll lock
- Photograph the overlays too
- Wait for focus inside the popup, not merely off the body

## [0.7.0] - 2026-08-31

### Breaking Changes

- **Require the words Chip and Copyable announce**
`Copyable` requires `label` and `copiedLabel`, and `Chip`
requires `removeLabel` alongside `onRemove` - the two now travel together
in the type, so a chip that can be removed but not named does not compile.
A primitive with a string of its own cannot be translated: it ships in
English to every reader who does not read English, and the product's i18n
never reaches it.

  - <Copyable value={sha}>{short}</Copyable>
  + <Copyable value={sha} label={t('copy')} copiedLabel={t('copied')}>{short}</Copyable>

  - <Chip onRemove={() => drop(tag)}>{tag}</Chip>
  + <Chip onRemove={() => drop(tag)} removeLabel={t('remove')}>{tag}</Chip>

Neither component was installed in any product of the line yet, so nothing
downstream had to change.

### Bug Fixes
- A missing baseline fails instead of writing itself

### Documentation
- Record why the lint rule ships with the package

### Features
- Budget what a primitive costs and forbid words of its own
- Photograph the stand, and typecheck the gates themselves

### Refactoring
- Require the words Chip and Copyable announce

### Testing
- Run axe and the keyboard over every primitive
- Record the stand baselines

## [0.6.1] - 2026-08-31

### Bug Fixes
- Give every status fill a legible partner

## [0.6.0] - 2026-08-31

### Bug Fixes
- Name a sibling component by its URL
- Let black and white through when they carry an opacity
- Build the plugin before linting with it

### Features
- Ship the rule that keeps colour out of components

## [0.5.0] - 2026-08-30

### Bug Fixes
- Install the workspace before building the docs
- Set the accent where the theme can see it

### Documentation
- Point the two sites at each other

### Features
- Give the components a site of their own
- Add the nine base primitives

## [0.4.0] - 2026-08-30

### Features
- Add the component pipeline and Button

## [0.3.1] - 2026-08-29

### Bug Fixes
- Give the entry point's imports a file extension
- Compare generated files by content, not by line ending
- Make the generated registry the same on every platform

## [0.3.0] - 2026-08-29

### Features
- Give every product of the line its colour in one line
- Serve the theme and the accents to `shadcn add`

## [0.2.0] - 2026-08-29

### Bug Fixes
- Let the README gate ignore the prepack artifact

### Documentation
- Show the scales on the stand

### Features
- Add the radius, type, motion, elevation and layer scales
- Publish the scales as DTCG JSON

### Testing
- Compile the theme with Tailwind instead of only reading it

## [0.1.0] - 2026-08-29

### Bug Fixes
- Make the accent legible for every colour in the line
- Publish as `dowel-ui`

### CI
- Skip publishing a version already in the registry

### Documentation
- Add the changelog for v0.1.0
- Record why the accent is derived and contrast is a test

### Features
- Add the brand assets
- Add the token vocabulary in dark and light themes
- Add the storefront gate and prepare v0.1.0

