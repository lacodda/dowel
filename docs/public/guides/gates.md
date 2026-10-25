# What a component has to pass

Source: https://lacodda.github.io/dowel/guides/gates

A component library decays by accretion — one reasonable addition at a time,
each defensible on its own. These are the checks that hold the line, and every
one of them exists because of a specific way that decay happens.

They all run in `pnpm test`, except the screenshots, which need a browser.

## Accessibility

[axe-core](https://github.com/dequelabs/axe-core) runs over the rendered DOM of
every primitive, in every variant, and the interactive ones are driven by the
keyboard as well: Tab reaches them, Enter and Space fire them, `disabled` is
skipped.

This catches the failures that are invisible in a screenshot and in a
class-list assertion — an icon button with no name, a state announced only by
colour, a control the keyboard cannot reach. They fail for one reader, months
later, with nobody to tell.

Five axe rules are off, and each is off because jsdom cannot evaluate it rather
than because it was inconvenient:

- `color-contrast` — jsdom resolves no colour. Contrast is measured on the
  resolved palettes instead (below), and by axe in a browser over the stand.
- `region`, `page-has-heading-one`, `landmark-one-main`, `html-has-lang` — a
  primitive rendered on its own is legitimately not a page. Those are the
  product's to satisfy.

## Contrast, pair by pair

`contrastPromises` names every ink, every ground it may stand on and the WCAG
level it is held to. The palette gate resolves the theme in a browser for each
of the line's nineteen products, in both themes and under more contrast, and
measures every pair at every step of the type scale. A second gate reads the
set's source: wherever one class list names an ink and a fill, the two have to
be a promised pair - `faint` on a selected row fails there before any browser
runs.

The stand's axe run sees one accent, dowel's own; this is what sees the other
eighteen. It is how cobalt's link at 3.7:1 was found, after a clean axe report.

## Every class compiles

Tailwind takes a class it cannot make and makes nothing: no error, no warning,
an element without the property. The set paid for it three times before this
gate - a width off a `--size-*` token, two motion steps in eight primitives
for a dozen releases, and a sticky table heading whose layer never applied, so
the body's pinned cells slid over it.

So every class the set writes is put through the real compiler over the real
theme, and each has to come out as a rule of its own (`tests/classes.test.ts`).
The source is parsed rather than searched, and where a string stands says
whether it is a class list: every word of a `className`, of an argument of
`cn()` and of what `cva()` reads as classes; the words of any other string only
when one of them is a class - a constant of classes is, a selector is not. A
string that is compared or handed to another function is not a class list,
even inside `cn()`.

The few words that compile to nothing on purpose - `group` and `peer`, which
name an element for other classes to look at - are listed with that reason,
and a marker the set has stopped writing fails the list.

## Headings stand where the page puts them

Where a heading sits in the outline is the page's to say. A screen that goes
from its title straight to an accordion needs the accordion's sections at `h2`,
and a fixed `h3` skips a level for every reader moving by heading. So a
primitive that draws a heading takes a `level` (`HeadingLevel` from `dowel-ui`),
defaulting to where it usually stands, and the gate (`tests/headings.test.ts`)
refuses a literal `<h1>`-`<h6>` in a primitive. Base UI draws headings too: an
`Accordion.Header` must be given the element to draw, while a dialog's or a
popover's title stays an `h2` - a window over the page starts an outline of its
own. Blocks are screens and own their outline from its `h1` down.

## Motion

The theme carries one rule for `prefers-reduced-motion`: every transition and
animation cut to nothing. Every primitive leans on it, so the gate holds the
classes under it (`tests/motion.test.ts`):

- **Every class of motion compiles to something.** The set's classes are read
  out of its source and run through Tailwind with the theme. Eight primitives
  wrote `duration-quick` and `duration-base` for a dozen releases and both
  compiled to nothing - the transitions ran on Tailwind's own 150ms, and no
  test, screenshot or reader noticed.
- **Every duration is one of the three steps** - `quick`, `base`, `slow` -
  never a number. A bare `transition-colors` takes `quick`, because the theme
  makes it the default.
- **A loop says what it looks like standing still.** The theme's rule runs an
  animation once, for a hundredth of a millisecond, and leaves it wherever it
  ended; a spinner or a skeleton names its rest with `motion-reduce:animate-none`.
- **Nothing moves by script** - `element.animate()`, a smooth scroll - without
  asking `prefers-reduced-motion` first: the stylesheet cannot reach it.
- **And in a real browser**, every string of motion classes the set writes is
  put on an element and measured: at rest for a reader who asked for less
  motion, and timed by a step for one who did not. jsdom resolves no media
  query, so this is the only place the rule is seen working rather than seen
  written.

## Weight, and what a component drags in

Two budgets. The first is a ceiling on code size with comments excluded —
comments are the point of these files, and taxing them would discourage exactly
what should be encouraged.

The second matters more: **the dependency list is declared, not observed.** Only
Button pulls in anything from Radix today. A component that starts importing
something new fails the gate, and adding it to the list is the decision — a new
dependency is a cost every product of the line pays.

## No words of its own

A string written into a component is a string the product cannot translate. It
ships in English to every reader who does not read English, and no amount of
i18n in the product reaches it.

So visible text arrives through props, and a prop that names something for a
screen reader has **no default** — a default is the same English string wearing
a different hat:

```tsx
// The product's word, in the product's language.
<Chip onRemove={() => drop(tag)} removeLabel={t('remove')}>
  {tag}
</Chip>
```

On `Chip` the two props travel together in the type, so a chip that can be
removed but not named does not compile. This gate found real debt the first
time it ran: `'Remove'`, `'Copy'` and `'Copied'` were all defaults once.

## Shape

The stand is photographed section by section, in both themes, and compared
against committed baselines. This is the one thing the rest cannot check: that
a padding change did not make every button in the line two pixels taller, or
that a variant still looks different from its neighbour.

```console
$ pnpm visual           # compare against the baselines
$ pnpm visual:update    # accept what changed, on purpose
```

Snapshots run on Linux only, in the same container image CI uses. That is not a
missing configuration — the theme asks for the operating system's own typeface
on purpose, so a screenshot taken on Windows can never equal one taken on
Linux. Pinning one platform is what makes a baseline mean something.

The accent is left at dowel's own amber. Colour is checked numerically for
every accent of the line; what a picture catches is shape.

A few sections are photographed in the theme's other modes too: printed from a
dark screen, which has to come out as dark ink on white, and under more
contrast in both themes. Every frame primitive and block is printed as well,
and fails if any box in it still cuts off what it holds.

Those pictures go further than the gate. A release note shows the stand's
picture of everything the release added or changed the look of, linked at the
tag, so the note keeps showing that release after the next one changes it.

## The keyboard, for everything that opens

Every overlay and menu, and every component that opens one, is driven without
a pointer in a real browser against the stand: opened from its trigger, walked,
chosen from, closed — with the focus followed the whole way.

- a modal takes the focus in, keeps it there on every Tab and Shift+Tab, and
  gives it back to its trigger on Escape;
- a popover, a picker or a bell takes it in, gives it back on Escape, and
  closes when Tab walks out of it;
- a menu opens on Enter, Space or Down with its first item ready, goes round
  from the last item to the first and back, answers Home, End and the first
  letters of an item, reaches an item that cannot be chosen without choosing
  it, opens a submenu on Right and closes one level per Escape;
- a select opens on the chosen option; a combobox keeps the focus in its field
  while the arrows walk the list; a date picker opens on the chosen day, not
  on the button that pages the month;
- a tooltip and a preview card show for the focused trigger and go on Escape;
  a toast is reached with F6; a context menu opens from a focused row on
  Shift+F10 or the Menu key.

```console
$ pnpm visual           # the pictures, the measurements and the keyboard
```

It is a browser and not jsdom because jsdom lays nothing out: a menu's wrap
from the last item to the first never fires there, and Shift+F10 is never
turned into a `contextmenu`. Whether everything is covered is checked in the
ordinary test run — a new popup, or a new component that opens one, with no
keyboard block fails `pnpm test`.

## Tests that notice

A green test proves the code passes it, not that it checks anything. Once a
week, and on demand, [Stryker](https://stryker-mutator.io/) changes each
primitive one small way at a time — a condition flipped, a branch emptied, a
prop dropped on its way down — and runs the tests that cover the change. A
change that no test notices is code no test holds.

```console
$ pnpm mutate --mutate registry/ui/menu.tsx   # one primitive
$ node tools/mutation-floor.mjs               # every file at its floor?
```

Class lists are not mutated: an empty class list is a change no unit test
should catch, and what classes promise is held by the gates above and by the
pictures. Every file has a floor under its own score, kept with the source; a
run that leaves any file under its floor fails, and the floor only rises — one
number for the whole set would let one primitive's tests decay while
another's improved.

## The room a popup has

Every surface the set draws over the page — a Base UI `Popup` of any kind, and
a toast — is found in the source by its part, not listed by hand, and every
combination of its variants is written out as the classes it would carry. A
real browser then lays each one out around a block of content far larger than
any window, and the gate asks:

- does it fit its room on both axes — the room its positioner publishes
  (`--available-width`, `--available-height`) when it is placed against a
  trigger, and the window otherwise?
- does what does not fit scroll — in the surface itself, or in the one part it
  names as its body — and is that scroll contained, so it is not handed on to
  the page?

A ceiling on one axis is a defect waiting for the long case: the dialog was
capped across from its first release and not down, and hung off both ends of
the window the first time a product gave it a real form. The browser is there
because a class can compile and still hold nothing — a misspelt custom
property is a valid class and no ceiling at all.

## Nothing here is anybody's

The stand, the [demo](/dowel/demo/) and every picture of them are drawn on one
invented world - people on `example.com`, works nobody has made - kept in
`fixtures/world.ts`, so a list in one block and its detail in another are the
same works. That is the default, and a gate keeps it one: every tracked file
is read for the four shapes private data comes in, each with the reserved form
allowed instead.

| What | Allowed |
| --- | --- |
| An email address | A domain reserved for examples: `example.com`, `.test`, `.invalid` |
| An IPv4 address | The documentation ranges - `192.0.2.x`, `198.51.100.x`, `203.0.113.x` - or loopback |
| A path into a home directory | A placeholder for its owner: `you`, `<name>` |
| A host on a private network | None: `.pi`, `.lan`, `.local` are somebody's machines |

The pictures are taken in `en-US` and UTC, said in the configuration rather
than inherited from the machine that took them, at the world's own fixed
moment: a date in a picture is drawn in a language and a zone, and nobody's in
particular is the one that belongs in a release note.
