# Doctrine

Source: https://lacodda.github.io/dowel/concepts/doctrine

A rule in a bullet list gets skimmed. A rule with a name gets cited - in a
review, in a commit message, by an agent deciding whether to add a shadow. The
format is borrowed from Impeccable's design documents; the rules are the line's
own, and each was written after the failure it names had been seen in a
product.

Where a rule is enforced by a test or a lint, it says so. Where it is not yet,
it says that too - a rule that claims a gate it does not have is worse than no
rule.

## Rules for components

**The Overlay Scrollbar Rule.** A scrollbar lies over the content and never
takes room in the layout. A track that reserves its own column shifts every
line beside it the moment content grows past the fold - the layout jumps, and
it jumps only on the machines that show scrollbars, so it is missed on the one
that built it. The theme draws every scrollbar as an overlay with a thumb no
shorter than a finger, and six tests hold it there. Divergence is a defect, not
a variant.

**The Trigger Origin Rule.** Anything that opens from an element grows out of
that element. Popovers, menus, tooltips and preview cards take
`origin-[var(--transform-origin)]`, which Base UI points at the trigger. The
dialog is the one exception: it is anchored to nothing, so it grows from the
centre of the screen. A popover that scales from its own centre reads as
having arrived from nowhere - the eye loses which button it belongs to.

**The Frequency Gate Rule.** The more often a person sees a movement, the
shorter it is - and something seen a hundred times a day does not move at all.
A command palette opened by a shortcut gets no open animation; that is not a
matter of taste but a disqualification, because the person pressing the
shortcut is already looking at where the palette will be. The theme's three
durations (`120 / 160 / 240ms`) are for movement that survives this gate;
`prefers-reduced-motion` removes all of it.

**The Enumerated Ramp Rule.** Every literal font size in a product lands on a
step of the type scale, within half a pixel. The scale has the steps it has
because a product of the line was measured before it was written and found to
draw eighty-six distinct sizes, six of them between 13.7 and 15.4 pixels,
which no reader can tell apart. Adding a step is a decision recorded in the
scale's page, not a convenience taken in a component. The detector that checks
this is planned for v0.32; until then the rule is held by review.

**The Demo Data Rule.** Every string on a stand, in a screenshot or in a
document either names something real or reads honestly as an example. Invented
telemetry (`BUILD 8.2.0-rc3`), filler labels in tracked capitals, a glyph
standing in for an icon - each makes a demonstration into a plausible lie, and
the lie is what a reader remembers. The stand shows real components with
example data that says it is example data; the products' own docs show real
output of real commands.

## Rules for pages

A page - a landing, a docs front page, a product's site - is a different
object from a screen. A screen is operated; a page is read once, by someone
who has not decided yet. These rules are for that reader.

**The Characteristic Hero Rule.** A page opens with the most characteristic
thing in the product's world, not with its mark and not with an abstraction.
For a command-line tool that is a live install session; for a reader, a page of
text; for a time tracker, a real report. The mark lives in the header, where a
reader looks for it. This was found before it was written: turnout's docs page
had an empty right column where a hero image was expected, and an install
panel in the terminal's own dress filled it better than any illustration - the
same move Tauri's site makes.

**The One Orchestrated Moment Rule.** A page has one considered moment of
motion, or none. Sections that fade and slide in as the reader scrolls, hover
transitions on every card - these are the default of generated pages, named as
such by two sources that did not read each other. One entrance that means
something lands; twelve that mean nothing read as a template.

**The Counted Rhythm Rule.** Rhythm on a page is checked by counting, not by
looking. The same layout family (image beside text, three cards in a row, a
full-width quote) does not appear three times running; a page of eight
sections uses at least four families; small tracked labels above headings
number at most `ceil(sections / 3)`, the hero counting as one. A page that
fails the count is not finished, whatever it looks like - because what it
looks like is exactly what the author can no longer see.

**The Three Doors Rule.** The first version of a page is three pages. Each is
a direction that could ship on its own, named by the axis it takes - quiet,
editorial, dense - and shown at full size with real content, never as
thumbnails, because spacing cannot be judged at postage-stamp scale. The owner
chooses; the choice is what makes the page a decision rather than an average.
A single first draft is always the mean of everything the author has seen.

## What breaks the line

A page or screen has left the line if any of these appears. The list is short
so that it can be checked, and each item has been tried or nearly tried.

- **A second accent** beside the product's own. The line differs its products
  by one hue each; a page with two is a page from two products.
- **A mark in any colour but the product's**, or a hex tile drawn in the
  wrong colour. The mark is the registry's, not the page's.
- **A watermark of the mark behind content.** Tried in turnout across four
  commits - in the hero's gap, across the left half, over the whole page - and
  rejected each time. The line does not do it.
- **A radius outside the scale**, or a second radius system on one page.
  Rounded buttons in a square layout is broken, not eclectic.
- **A serif display face.** The line sets its marks in mono and its interfaces
  in sans; a serif headline is a costume from another wardrobe.
- **Pure `#000000` or `#ffffff`.** The theme's grounds lean towards the
  product's hue for a reason: a pure value flattens depth and belongs to no
  product.
- **Motion on every section.** See the orchestrated moment.
- **A hero that is the mark.** See the characteristic hero.

## Rules for audits

**The Empty Audit Rule.** "This is already right" is a valid result of an
audit. A short list of confirmed findings beats a long one padded to look
thorough, and a report shows what it considered and rejected, with the rule
that rejected it - otherwise nobody can tell a clean page from a lazy pass.
Findings raised by a delegated agent are re-read at their `file:line` by the
one who reports them; a finding nobody has confirmed is a rumour.

## What this page is not

It does not list the general tells of generated design - the cream ground with
a serif and a clay accent, the near-black with one acid green, the eyebrow
label on every heading, the `→` at the end of every button. Anthropic's
[`frontend-design`](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
skill does that, keeps it current, and is a better place for it than a copy
here that would drift. Read it first; then read this page for what the line
adds. Where the two disagree, this page wins, for the line.

## Origins

The named-rule format is from Paul Bakaus's
[Impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0). The frequency
gate and the origin rule condense Emil Kowalski's
[animation skills](https://github.com/emilkowalski/skills) (MIT). The counted
rhythm checks follow the mechanical pre-flight in
[taste-skill](https://github.com/leonxlnx/taste-skill) (MIT), and "what breaks
the line" follows the *Breaks if* pattern of
[frontend-design](https://github.com/Ilm-Alan/frontend-design) (MIT). The
rules themselves, and every failure they cite, are the line's own.
