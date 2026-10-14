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
also computed from the tokens for every accent of the line, the floor of a
pointer target is a token at WCAG's 24px, and every animation comes to rest for
a reader who asked for less motion. The [gates](/dowel/guides/gates/) say what
each one catches.

**What no automated check sees.** Whether a name makes sense when it is read
aloud, whether the order a reader tabs in is the order the screen means,
whether an error says what to do about it. axe marks some of these for a
person - they are listed with each item - and the rest are what reading a
screen with a screen reader is for.

Run by axe 4.14.0 against `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`: 123 items of the stand, in two themes each; 47 rules applied, 13 WCAG criteria checked, 84 items with nothing owed.

## Not yet passed

### `color-contrast` - 36 items

Text in `faint`, and text on the soft status fills, at the small type steps - 10 to 12px - measures below the 4.5:1 AA asks, in one theme or both. The tokens are held to AA at body size, not at every step they are set in; the work that holds them per step moves these, as it already moved the caption, the notes of a list row and the empty face of the date pickers. Some of it is the stand’s own notes beside the examples.

activity-heatmap, activity-legend, activity-weeks, alert, badge, banner, bar-chart, big-calendar, calendar, chip, code-block, context-menu, diff-lines, diff-view, empty-state, field-draft, json-rows, json-viewer, key-value, line-chart, line-scale, number-format, query-state, relative-time, save-state, skeleton-of, splash, status-dot, stepper, tag-input, tier, timeline, track, track-segments, tree-rows, wizard

### `label-content-name-mismatch` - 4 items

A control named by `aria-label` whose name does not hold the words drawn on it - Copy around the value it copies, the bell around its count, a day of the month view named by its date and its releases. Someone telling voice control what they see says words the name does not have (WCAG 2.5.3). The date pickers had the same defect and are fixed.

big-calendar, copyable, notification-bell, window-frame

### `target-size` - 1 item

A release drawn in a crowded day of the month view comes out smaller than the 24px a pointer is asked to hit (WCAG 2.5.8): the fold that keeps a day in its share of the height decides its size.

big-calendar

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
| activity-heatmap | 15 | `color-contrast` | `color-contrast` |
| activity-legend | 3 |  | `color-contrast` |
| activity-weeks | 3 |  | `color-contrast` |
| alert | 9 |  | `color-contrast` |
| app-shell | 17 |  |  |
| avatar | 16 |  |  |
| badge | 3 |  | `color-contrast` |
| banner | 9 |  | `color-contrast` |
| bar-chart | 15 | `color-contrast` | `color-contrast` |
| big-calendar-item | 8 |  |  |
| big-calendar | 20 | `color-contrast` `target-size` | `color-contrast` `label-content-name-mismatch` `target-size` |
| breadcrumbs | 15 |  |  |
| button | 16 |  |  |
| calendar-math | 4 |  |  |
| calendar | 20 | `color-contrast` | `color-contrast` |
| checkbox | 18 | `aria-toggle-field-name` |  |
| chip | 16 | `color-contrast` | `color-contrast` |
| code-block | 16 | `color-contrast` | `color-contrast` |
| collapsible | 15 |  |  |
| color-field | 19 |  |  |
| column-resize-handle | 19 |  |  |
| combobox | 21 |  |  |
| command-palette | 7 |  |  |
| commands | 21 |  |  |
| confirm-dialog | 12 |  |  |
| context-menu | 3 |  | `color-contrast` |
| copy-button | 16 |  |  |
| copyable | 16 |  | `label-content-name-mismatch` |
| date-picker | 15 |  |  |
| date-range-picker | 15 |  |  |
| dialog | 12 |  |  |
| diff-lines | 3 |  | `color-contrast` |
| diff-view | 16 | `color-contrast` | `color-contrast` |
| divider | 16 |  |  |
| drawer | 12 |  |  |
| duration-field | 13 |  |  |
| empty-dashboard-screen | 26 |  |  |
| empty-state | 6 |  | `color-contrast` |
| error-boundary | 6 |  |  |
| field-draft | 13 |  | `color-contrast` |
| field | 24 |  |  |
| file-drop | 13 |  |  |
| filter-popover | 18 |  |  |
| frame | 23 |  |  |
| image | 14 |  |  |
| inline-field | 13 |  |  |
| input | 12 |  |  |
| json-rows | 3 | `color-contrast` | `color-contrast` |
| json-viewer | 18 | `color-contrast` | `color-contrast` |
| kbd | 5 | `color-contrast` |  |
| key-value | 5 |  | `color-contrast` |
| layer | 12 |  |  |
| line-chart | 16 |  | `color-contrast` |
| line-scale | 3 |  | `color-contrast` |
| list-detail-screen | 26 |  |  |
| list-row | 19 |  |  |
| login-screen | 23 | `color-contrast` |  |
| marked-text | 13 | `color-contrast` |  |
| menu | 13 |  |  |
| nav-rail | 12 |  |  |
| notification-bell | 13 |  | `label-content-name-mismatch` |
| number-field | 19 |  |  |
| number-format | 3 |  | `color-contrast` |
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
| query-state | 11 |  | `color-contrast` |
| radio-group | 18 | `aria-toggle-field-name` `duplicate-id-aria` |  |
| rating-scale | 17 |  |  |
| relative-time | 3 |  | `color-contrast` |
| reorderable-list | 6 |  |  |
| save-state | 14 |  | `color-contrast` |
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
| skeleton-of | 5 |  | `color-contrast` |
| skeleton | 5 |  |  |
| slider | 17 |  |  |
| sparkline | 15 |  |  |
| spinner | 16 |  |  |
| splash | 13 | `color-contrast` | `color-contrast` |
| splitter | 19 |  |  |
| stat-tile | 7 |  |  |
| status-dot | 15 |  | `color-contrast` |
| stepper | 17 | `color-contrast` | `color-contrast` |
| switch | 18 |  |  |
| table-sort | 4 |  |  |
| table | 23 | `color-contrast` |  |
| tabs | 20 |  |  |
| tag-input | 14 |  | `color-contrast` |
| textarea | 7 |  |  |
| tier | 18 | `color-contrast` | `color-contrast` |
| time-field | 13 |  |  |
| timeline | 17 |  | `color-contrast` |
| toast | 6 |  |  |
| tooltip | 12 |  |  |
| track-segments | 3 |  | `color-contrast` |
| track | 14 |  | `color-contrast` |
| tree-rows | 4 |  | `color-contrast` |
| tree-view | 20 | `color-contrast` `duplicate-id-aria` |  |
| truncate | 5 |  |  |
| virtual-list | 18 | `aria-required-children` `color-contrast` |  |
| window-frame | 23 | `color-contrast` | `label-content-name-mismatch` |
| wizard | 18 |  | `color-contrast` |
