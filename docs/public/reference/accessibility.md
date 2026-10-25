# Accessibility

Source: https://lacodda.github.io/dowel/reference/accessibility

Every item on [the stand](/dowel/stand/) is put through
[axe-core](https://github.com/dequelabs/axe-core) in a real browser, in the dark
theme and in the light one, against WCAG 2.2 at A and AA and axe's own best
practices. The numbers below are that run. They are not typed here: the browser
writes one file per item, the page is drawn from those files, and a gate holds
the files to the stand - an item added without a report, an axe upgrade
without a new run, or a fixed violation still listed as owed fails before
anything is published. A page that claims a result the set no longer has is
the one thing this report must not be.

**What else holds the line.** This run sees the examples as the stand draws
them, closed. The unit tests put every primitive through axe as well, in every
variant and open - a menu with its list showing, a dialog with its focus
trapped - and drive the interactive ones by the keyboard. Colour contrast is
also measured pair by pair - every ink on every ground it is promised on, for
every accent of the line, in both themes and under more contrast (see
[Contrast](/dowel/concepts/contrast/)) - the floor of a pointer target is a
token at WCAG's 24px, and every animation comes to rest for a reader who asked
for less motion. The [gates](/dowel/guides/gates/) say what
each one catches.

**What no automated check sees.** Whether a name makes sense when it is read
aloud, whether the order a reader tabs in is the order the screen means,
whether an error says what to do about it. axe marks some of these for a
person - they are listed with each item - and the rest are what reading a
screen with a screen reader is for.

Run by axe 4.14.0 against `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`: 123 items of the stand, in two themes each; 47 rules applied, 13 WCAG criteria checked, 123 items with nothing owed.

## Not yet passed

Nothing: every item passes every rule that applied to it, in both themes.

## Rules about a page, off on the stand

- `landmark-unique` - Two examples of a breadcrumb trail on one page are two landmarks with one name; a product shows one.
- `landmark-no-duplicate-main` - An app shell and a sign-in screen are the page and bring its main; on the stand they sit inside the stand’s own.
- `landmark-main-is-top-level` - For the same reason: the block’s main is the product’s top level, and the stand’s frame is around it.
- `heading-order` - Where a heading sits in the outline is the page’s to say, and the stand’s headings are not a product’s.

## Every item

| Item | Passed | Left to a person | Owed |
| --- | --- | --- | --- |
| about-plate | 10 | `color-contrast` |  |
| accordion | 19 |  |  |
| action-bar | 17 |  |  |
| activity-heatmap | 16 |  |  |
| activity-legend | 4 |  |  |
| activity-weeks | 4 |  |  |
| alert | 10 |  |  |
| app-shell | 17 |  |  |
| avatar | 16 |  |  |
| badge | 4 |  |  |
| banner | 10 |  |  |
| bar-chart | 16 |  |  |
| big-calendar-item | 8 |  |  |
| big-calendar | 23 |  |  |
| breadcrumbs | 15 |  |  |
| button | 16 |  |  |
| calendar-math | 4 |  |  |
| calendar | 21 |  |  |
| checkbox | 18 | `aria-toggle-field-name` |  |
| chip | 17 | `color-contrast` |  |
| code-block | 17 | `color-contrast` |  |
| collapsible | 15 |  |  |
| color-field | 19 |  |  |
| column-resize-handle | 19 |  |  |
| combobox | 21 |  |  |
| command-palette | 7 |  |  |
| commands | 21 |  |  |
| confirm-dialog | 12 |  |  |
| context-menu | 6 |  |  |
| copy-button | 16 |  |  |
| copyable | 18 |  |  |
| date-picker | 15 |  |  |
| date-range-picker | 15 |  |  |
| dialog | 12 |  |  |
| diff-lines | 4 |  |  |
| diff-view | 17 | `color-contrast` |  |
| divider | 16 |  |  |
| drawer | 12 |  |  |
| duration-field | 13 |  |  |
| empty-dashboard-screen | 26 |  |  |
| empty-state | 7 |  |  |
| error-boundary | 6 |  |  |
| field-draft | 14 |  |  |
| field | 24 |  |  |
| file-drop | 13 |  |  |
| filter-popover | 18 |  |  |
| frame | 23 |  |  |
| image | 14 |  |  |
| inline-field | 13 |  |  |
| input | 12 |  |  |
| json-rows | 4 |  |  |
| json-viewer | 19 | `color-contrast` |  |
| kbd | 5 | `color-contrast` |  |
| key-value | 6 |  |  |
| layer | 12 |  |  |
| line-chart | 17 |  |  |
| line-scale | 4 |  |  |
| list-detail-screen | 26 |  |  |
| list-row | 19 |  |  |
| login-screen | 23 | `color-contrast` |  |
| marked-text | 13 | `color-contrast` |  |
| menu | 13 |  |  |
| nav-rail | 12 |  |  |
| notification-bell | 15 |  |  |
| number-field | 19 |  |  |
| number-format | 4 |  |  |
| page-header | 16 |  |  |
| page-size | 16 |  |  |
| pagination | 12 | `label-content-name-mismatch` |  |
| panel | 4 |  |  |
| password-field | 17 |  |  |
| popover | 12 |  |  |
| preview-card | 5 |  |  |
| product-mark | 15 | `color-contrast` |  |
| product-switcher | 13 | `color-contrast` |  |
| progress | 16 |  |  |
| prose | 14 |  |  |
| query-state | 12 |  |  |
| radio-group | 18 | `aria-toggle-field-name` `duplicate-id-aria` |  |
| rating-scale | 17 |  |  |
| relative-time | 4 |  |  |
| reorderable-list | 6 |  |  |
| save-state | 15 |  |  |
| schema-check | 4 |  |  |
| schema-fields | 24 |  |  |
| schema-shape | 8 |  |  |
| scroll-area | 19 |  |  |
| search-field | 15 |  |  |
| section-nav | 13 |  |  |
| segmented-control | 18 |  |  |
| select | 16 |  |  |
| settings-screen | 21 |  |  |
| shortcut | 13 | `color-contrast` |  |
| shortcuts-dialog | 6 |  |  |
| skeleton-of | 6 |  |  |
| skeleton | 5 |  |  |
| slider | 17 |  |  |
| sparkline | 15 |  |  |
| spinner | 16 |  |  |
| splash | 14 | `color-contrast` |  |
| splitter | 19 |  |  |
| stat-tile | 7 |  |  |
| status-dot | 16 |  |  |
| stepper | 18 | `color-contrast` |  |
| switch | 18 |  |  |
| table-sort | 4 |  |  |
| table | 23 | `color-contrast` |  |
| tabs | 20 |  |  |
| tag-input | 15 |  |  |
| textarea | 7 |  |  |
| tier | 19 |  |  |
| time-field | 13 |  |  |
| timeline | 18 |  |  |
| toast | 6 |  |  |
| tooltip | 12 |  |  |
| track-segments | 4 |  |  |
| track | 15 |  |  |
| tree-rows | 5 |  |  |
| tree-view | 20 | `color-contrast` `duplicate-id-aria` |  |
| truncate | 5 |  |  |
| virtual-list | 18 | `aria-required-children` `color-contrast` |  |
| window-frame | 25 | `color-contrast` |  |
| wizard | 19 |  |  |
