import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * What a primitive is allowed to cost, and what it is allowed to say.
 *
 * Both are budgets, and both exist for the same reason: a component library
 * decays by accretion, one reasonable addition at a time. Nobody ever decides
 * to make the Dialog drag in three packages or to hard-code a word - it
 * happens in a hurry, once, and then it is precedent.
 *
 * The numbers here are ceilings with room in them, not targets. A component
 * that grows past one is not necessarily wrong; it is required to be a
 * decision, made by editing this file with a reason.
 */

const root = resolve(import.meta.dirname, '..')
const componentDir = resolve(root, 'registry/ui')

const components = readdirSync(componentDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => ({
    name: file.replace(/\.tsx$/, ''),
    source: readFileSync(resolve(componentDir, file), 'utf8'),
  }))

/** The source with its comments removed.
 *
 * Comments are the point of this codebase - a primitive explains why it is
 * shaped the way it is - so measuring the file would tax exactly what should
 * be encouraged. What is measured is the code. */
function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

describe('what a primitive weighs', () => {
  /* Today's largest is Copyable at about 2.4 kB of code: a clipboard call, a
   * timer, two icons and a live region. That is the shape of an involved
   * primitive, and 4 kB leaves room for one to grow without a second look
   * while still catching a component that has quietly become a screen. */
  const CEILING = 4096

  /* Components allowed past it, each with the reason and its own number.
   *
   * A raised ceiling is still a ceiling: the number is what the component
   * measures today plus a little room, so it catches further growth rather
   * than opening the gate. Adding an entry is the deliberate act the message
   * below asks for, and the reason has to say why splitting it would be
   * worse than the size. */
  const RAISED: Record<string, { ceiling: number; because: string }> = {
    'column-resize-handle': {
      ceiling: 5120,
      because:
        'the handle and the hook that keeps widths travel together: a handle without the arithmetic of hand-set against measured widths is a span that draws a line',
    },
    'reorderable-list': {
      ceiling: 5632,
      because:
        'pointer drag, the keyboard path and the drop line are one gesture split three ways; two of them would be a list that reorders by mouse only',
    },
    tier: {
      ceiling: 8192,
      because:
        'the badge, the ruler and the axis are three readings of one score and share the `Tier` it is read against; split apart, the band arithmetic would be written twice and the two copies would disagree about where a boundary falls - which is the defect the ruler was written to correct in the first place',
    },
    /* The three that grew when a live run found what they were not doing.
     *
     * Each gained one thing a reader had asked for and none of them can be
     * split around it: Select shows a tick beside what is already chosen and
     * truncates a long multiple value, Combobox lays its chips out as a field
     * rather than a column, and the palette carries the anchor that makes it
     * visible at all. Two to four per cent over, and the alternative would be
     * a component that does not answer the complaint. */
    select: {
      ceiling: 4608,
      because:
        'The tick that shows which option is already chosen, and the truncation that ' +
        'keeps a multiple value on one line. Both belong to the item and the value; ' +
        'neither is a component of its own.',
    },
    combobox: {
      ceiling: 4608,
      because:
        'The chips container is the field when it is used - a row that wraps, with the ' +
        'input on the same line as the last chip. Splitting it would leave a container ' +
        'nobody can use without reassembling it.',
    },
    'command-palette': {
      ceiling: 4864,
      because:
        'The explicit viewport anchor, and the clothes its three parts were missing. ' +
        'A palette has no trigger to point at, so without the anchor the positioner ' +
        'never resolves and the popup renders fully transparent. The item, list and ' +
        'empty state were bare re-exports - the comment claimed "the same clothes as a ' +
        'Combobox row" and the component wore none, so the rows inherited the popup ' +
        'font and stood a third taller than every other list in the set.',
    },
    'tree-view': {
      ceiling: 4352,
      because:
        'The keyboard and the rows it moves through, which cannot be separated: the ' +
        'handler works on the flattened list the same function renders, and a tree ' +
        'whose arrows live elsewhere is a tree that can disagree with what is drawn. ' +
        'The split the gate asked for was made in the other direction - `tree-rows` ' +
        'holds the sums with no React in them, and took 650 bytes with it.',
    },
    table: {
      ceiling: 4608,
      because:
        'Nine parts of one table - the scroll container, the table, the head, the body, ' +
        'the row, the plain heading, the sorting heading, the cell and the empty state - ' +
        'and none of them can be used without the others: a cell outside a row renders ' +
        'nothing. The split the gate was asking for was already made, in the other ' +
        'direction: the arithmetic is `table-sort`, with no React in it, which is what a ' +
        'product sorting on the server imports instead of any of this.',
    },
    'code-block': {
      ceiling: 4480,
      because:
        'Four per cent over, for the two placements of one button. The copy button ' +
        'itself is already out - `copy-button` came from exactly this gate, and took ' +
        '1.9 kB - and the highlighter was never in. What is left is the frame, the ' +
        'gutter, the marked line, and the branch a live run demanded: a header only ' +
        'when there is a caption, because the first version gave a caption-less block ' +
        'a 34px strip holding one invisible button. Splitting that branch out would ' +
        'be a component whose entire content is where to put something else.',
    },
    'diff-view': {
      ceiling: 5120,
      because:
        'Two columns that have to stay in step, which is one problem drawn in two ' +
        'places: the pairing lives in `diff-lines` (no React, and a product that only ' +
        'wants the counts imports that alone), and what is left here is the single ' +
        'scroller holding both tracks, the per-side cell, and the marker glyph that ' +
        'lets the comparison read without colour. Splitting it would give a column ' +
        'component that must not be used on its own - two of them scroll apart, which ' +
        'is the defect this component was written to fix.',
    },
    'json-viewer': {
      ceiling: 4864,
      because:
        'The same shape as `tree-view`, and raised for the same reason: the keyboard ' +
        'works on the flattened list the render walks, so a viewer whose arrows live ' +
        'elsewhere is one that can disagree with what is drawn. The split the gate asks ' +
        'for was made in the other direction - `json-rows` holds the flattening, the ' +
        'paths and the bounded expand-all with no React in them. What is left is the ' +
        'rows, the ARIA tree, and the leaf drawn as the type it actually is.',
    },
    'window-frame': {
      ceiling: 5632,
      because:
        'Four exports that are one frame: the buttons, the title-bar gestures and the ' +
        'resize strips all read the same `useMaximized` and go through the same guard ' +
        'for a window that is not there. Split, a product installs three files that have ' +
        'to agree on when the window is maximised - and the strip along the top edge that ' +
        'must vanish then is in one of them while the button that says so is in another. ' +
        'The buttons were already folded into one map; what is left is the eight-entry ' +
        'geometry table, which is the only honest way to write eight positions.',
    },
    calendar: {
      ceiling: 8192,
      because:
        'A month grid is three things that cannot be used apart: the header that pages ' +
        'months, the seven-by-six grid, and the keyboard that moves a cursor through it. ' +
        'The arithmetic was already split out into `calendar-math`, which took it from ' +
        '10.4 kB to 7.4 kB; splitting further would produce a header nobody can render ' +
        'alone and a grid that cannot change month.',
    },
  }

  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s is under the ceiling',
    (name, source) => {
      const size = codeOnly(source).length
      const raised = RAISED[name]
      const ceiling = raised?.ceiling ?? CEILING
      expect(
        size,
        raised
          ? `\`${name}\` is ${size} bytes, over its raised ceiling of ${ceiling}. ` +
            `It was raised because: ${raised.because}`
          : `\`${name}\` is ${size} bytes of code, over the ${CEILING} ceiling. ` +
            'Either it is doing two things and should be two components, or the ceiling ' +
            'needs raising here with a reason.',
      ).toBeLessThanOrEqual(ceiling)
    },
  )
})

describe('what a primitive drags in', () => {
  /*
   * The real weight of a component is not its own bytes - the largest here is
   * smaller than this comment's file - but what it makes a product install.
   *
   * So the dependency list is declared rather than observed. A component that
   * starts importing something new fails here, and adding it to this map is
   * the decision. `dowel-ui` is not listed: every component imports `cn` from
   * it, and a product installing any of them already has the theme.
   */
  const ALLOWED: Record<string, string[]> = {
    alert: ['class-variance-authority'],
    // The strip is Base UI's Toolbar - `role="toolbar"` and the arrow keys
    // that make a bar one tab stop. Writing that by hand is how an action bar
    // ends up as five tab stops between the last field and Save.
    'action-bar': ['@base-ui/react', 'class-variance-authority'],
    badge: ['class-variance-authority'],
    // Its own clothes and nothing else. A banner is a strip with a slot at
    // each end - importing Alert's `cva` would tie a message about the whole
    // application to one about the field beside it, and those drift apart on
    // purpose.
    banner: ['class-variance-authority'],
    button: ['@base-ui/react', 'class-variance-authority'],
    chip: ['class-variance-authority'],
    // The palette is the line's own accents, which come from `dowel-ui` and
    // are therefore free; the free-entry box wears Input's field clothes so a
    // colour field and a text field are not two different controls.
    'color-field': ['input'],
    // A Select you can type in, and it says so in its imports: the field
    // clothes from Input, the popup and row clothes from Select. Only the
    // input, the chips and the empty state are its own.
    combobox: ['@base-ui/react', 'class-variance-authority', 'input', 'select'],
    // A Combobox with the input inside the popup, which is what makes the
    // popup a dialog. The rows are Combobox's - a palette is a list of
    // choices, and two lists of choices in one product should not differ -
    // and the hint at the right of the field is Kbd's, so what is bound and
    // what is shown are drawn by the same rule.
    'command-palette': ['@base-ui/react', 'class-variance-authority', 'combobox', 'kbd'],
    'confirm-dialog': ['@base-ui/react', 'class-variance-authority'],
    // Wears Menu's clothes rather than its own: the popup below the root is
    // literally Menu's, so two `cva` calls would only drift apart.
    'context-menu': ['@base-ui/react', 'menu'],
    copyable: [],
    // The whole component is the wiring Base UI does: the label's `for`, the
    // `aria-describedby` for hint and error, and the invalid state. Without
    // it this would be a `<div>` with a `<label>` beside it, which is the bug
    // it exists to prevent.
    field: ['@base-ui/react'],
    // The tick and the dash are drawn here; Base UI carries the role, the
    // keyboard and the indeterminate state a native input cannot express.
    checkbox: ['@base-ui/react'],
    dialog: ['@base-ui/react', 'class-variance-authority'],
    // The whole component is text a person typed being turned into minutes.
    // Input's field clothes, so a duration and a text box are the same
    // control with different content.
    'duration-field': ['input'],
    // The sums live next door with no React in them, which is what the size
    // gate asked for; this is the grid that draws them.
    calendar: ['calendar-math'],
    // Pure functions and `Intl`, no React and no date library - which is the
    // whole reason it exists as a file of its own.
    'calendar-math': [],
    // A field that opens a month: Input's clothes on the trigger, our own
    // Popover for the panel, and the calendar inside it.
    'date-picker': ['input', 'popover', 'calendar', 'calendar-math'],
    'date-range-picker': ['input', 'popover', 'calendar', 'calendar-math'],
    drawer: ['@base-ui/react', 'class-variance-authority'],
    input: [],
    kbd: [],
    menu: ['@base-ui/react', 'class-variance-authority'],
    panel: ['class-variance-authority'],
    // The group is the control - one tab stop, arrows within it - and that is
    // Base UI's roving focus rather than anything drawn here.
    'radio-group': ['@base-ui/react', 'class-variance-authority'],
    popover: ['@base-ui/react', 'class-variance-authority'],
    // The trigger is a field, so it wears Input's field clothes: a select and
    // a text input sit next to each other in every form there is.
    select: ['@base-ui/react', 'class-variance-authority', 'input'],
    'preview-card': ['@base-ui/react', 'class-variance-authority'],
    // Base UI parses what is typed and runs the keyboard; Input's clothes so
    // a number and a text field sit next to each other without looking like
    // two different controls.
    'number-field': ['@base-ui/react', 'input'],
    // The reveal is ours; the field it wraps wears Input's clothes.
    'password-field': ['input'],
    // Reads what a person types as a time. No calendar and no library - the
    // parsing is here and `Intl` says how it reads back.
    'time-field': ['input'],
    // The track and the thumbs are drawn here; Base UI carries the pointer
    // maths, the keyboard, and one hidden range input per value.
    slider: ['@base-ui/react'],
    // An Input that knows it is a search box: Input's field clothes, Kbd for
    // the shortcut it shows, and `useShortcut` for the same shortcut bound -
    // one array, so the hint cannot drift from the binding.
    'search-field': ['input', 'kbd', 'shortcut'],
    // No clothes at all: a hook and two predicates, so it drags in nothing.
    shortcut: [],
    spinner: ['class-variance-authority'],
    // Nothing of its own: a native file input, a drag counter, and the
    // filters. Everything hard about uploading is the product's transport,
    // which this deliberately does not own.
    'file-drop': [],
    // Draws the ring from Spinner's variants rather than using Spinner, which
    // carries its own live region - so the cost is the import, not a second
    // announcement for one save.
    'save-state': ['spinner'],
    // Chip for the tags and Input's field clothes for the box around them.
    // The behaviour - commit, dedupe, Backspace - is its own, because "create
    // a value that does not exist yet" is a decision about the product's data
    // rather than about the widget.
    'tag-input': ['class-variance-authority', 'chip', 'input'],
    // No clothes at all: a row of marks, its keyboard, and the state that is
    // the point - not judged yet.
    'rating-scale': [],
    // The role is the point: `switch` rather than `checkbox`, which is what
    // tells a reader the change takes effect now.
    switch: ['@base-ui/react'],
    // Shares Input's field clothes, so a field and a multi-line field cannot
    // come out looking like two different controls.
    textarea: ['input'],
    // Base UI drives the queue, the live region, the timers and the swipe.
    // What is here is the clothes and the tone vocabulary, so the manager a
    // product already has is the one it keeps.
    toast: ['@base-ui/react', 'class-variance-authority'],
    tooltip: ['@base-ui/react', 'class-variance-authority'],
    truncate: [],
    // The sums a column is ordered by, with no React in them - the same split
    // `calendar-math` is. Nothing at all: `Intl.Collator` is the platform's.
    'table-sort': [],
    // The clothes, and the arithmetic next door. No table library: TanStack
    // Table would be the first dependency a product has to install beyond
    // Base UI, and what it offers is a model of columns and pages that the
    // line's one real table did not need - the rule it did need, absence
    // sorting last, the model does not have.
    table: ['class-variance-authority', 'table-sort'],
    // Button, and nothing else: the row of pages and the two arrows.
    pagination: ['button'],
    // A Select, which is the control most likely to reintroduce a native
    // `<select>` - three numbers in a box looks like the case where it would
    // not matter.
    'page-size': ['select'],
    // `Intl` and a class. The formatting a product would otherwise reach for a
    // library to do is in the platform.
    'number-format': [],
    // The same: `Intl.RelativeTimeFormat` writes the phrase, which is the
    // whole reason there is no date library here.
    'relative-time': [],
    // The window arithmetic and the box that scrolls. No virtualisation
    // library: `react-window` and its kin solve variable heights, horizontal
    // windows and grids, and a design system's long lists are all a column of
    // rows of one height.
    'virtual-list': [],
    // Which rows a tree shows, with no React in them - the same split
    // `table-sort` is. A product windowing a large tree imports this alone.
    'tree-rows': [],
    // The clothes and the keyboard; the sums are next door.
    'tree-view': ['tree-rows'],
    // A `<dl>` and two layouts, and the layouts need different markup - which
    // is the whole reason the pair is a component rather than two divs.
    'key-value': ['class-variance-authority'],
    // A `<dl>` again, and the tones a figure reads in. The variants are worth
    // the dependency here for the reason the donor proves: its tone classes
    // were joined by hand, without a space, and neither one applied.
    'stat-tile': ['class-variance-authority'],
    // A path and a dot. The variants carry the two sizes, and each states its
    // geometry and its classes together - the donor kept them apart and every
    // call site had to repeat itself.
    sparkline: ['class-variance-authority'],
    // Percentages and a floor, with no React in them - the same split as
    // `table-sort` and `tree-rows`. A product labelling its own segments wants
    // the numbers without importing a component to get them.
    'track-segments': [],
    // The bar, its tones, and the sums next door.
    track: ['class-variance-authority', 'track-segments'],
    // Weeks, four kinds of cell and the five steps - no React, so a product
    // drawing this in a terminal takes the arithmetic alone.
    'activity-weeks': [],
    // The grid: the cell variants and the weeks beside it.
    'activity-heatmap': ['class-variance-authority', 'activity-weeks'],
    // The legend reads the grid's own cell variants, so the swatches cannot
    // drift from the squares they explain.
    'activity-legend': ['activity-heatmap', 'activity-weeks'],
    // Columns and the rule they are read against. The arithmetic is two
    // divisions, so there is nothing next door to split out.
    'bar-chart': ['class-variance-authority'],
    // Bounds, runs and round-number ticks - no React, so a product labelling
    // its own points takes the numbers alone.
    'line-scale': [],
    // The plot, its ticks and the line across it.
    'line-chart': ['class-variance-authority', 'line-scale'],
    // The corner affordance of a block, and nothing else: a clipboard call, a
    // timer and two inlined icons. It came out of CodeBlock when the size gate
    // asked whether that was two things - it was, and DiffView wanted the same
    // button in the same version, which is the second consumer the line's rule
    // asks for before anything is made shared.
    'copy-button': [],
    // The frame around code, with the copy button in its header. No
    // highlighter, deliberately and at length in the file: a registry
    // component is copied into a product, so what it imports becomes that
    // product's dependency for good - and Shiki is a megabyte of grammars
    // resolved asynchronously. Colour arrives as tokens the product produces.
    'code-block': ['class-variance-authority', 'copy-button'],
    // Plain LCS and the pairing of its result into rows, with no React in it -
    // so a product that only wants to know how much moved takes the numbers.
    'diff-lines': [],
    // The two columns and the one scroller that keeps them in step, plus the
    // copy button in each header.
    'diff-view': ['class-variance-authority', 'copy-button', 'diff-lines'],
    // Flattening a value into rows, the paths that name them, and the bounded
    // walk behind "expand all". No React, like its sibling `tree-rows`.
    'json-rows': [],
    // The tree and the keyboard that moves through it - which cannot be
    // separated, for the reason `tree-view` states: the handler works on the
    // flattened list the same function renders. The split the size gate would
    // ask for is already made, in the other direction, as `json-rows`.
    'json-viewer': ['json-rows'],
    // Boxes that pulse. Nothing at all: the useful part is the shapes, and a
    // shape is a few divs with the right widths.
    skeleton: [],
    // Its own clothes and its own marks, inlined so they cost no request and
    // can take the theme's colour.
    'empty-state': ['class-variance-authority'],
    // Base UI carries the role, the announcement and the clamping; what is
    // here is the clothes and the rule about which of the two states is drawn.
    progress: ['@base-ui/react', 'class-variance-authority'],
    // The ladder, drawn with the two screens it steps through: a placeholder
    // while pending, and an empty state when it failed. Writing either again
    // here would be a second version of the same screen.
    'query-state': ['empty-state', 'skeleton'],
    // The crash screen is an EmptyState in its error variant, with Button's
    // retry - the alternative was a hand-drawn button, which is exactly the
    // drift the set exists to prevent.
    'error-boundary': ['button', 'empty-state'],
    // Two layers of the same text, and nothing else: the mirror is divs and
    // `<mark>`s, the field is a native textarea, and the metrics are the
    // caller's. No editor library - what CodeMirror would add is a document
    // model this does not need, since the product already holds the text.
    'marked-text': [],
    // The rows are Base UI's `useRender`, the way Button takes a `render`: the
    // whole point is that a row is the product's own router link wearing the
    // column's clothes, and that is what `useRender` is for.
    'section-nav': ['@base-ui/react'],
    // The frame is Popover's and the buttons are Button's, so the panel
    // opens, positions and closes the way every other panel in the set does.
    'notification-bell': ['button', 'popover'],
    // The Tauri window API, and it is the first dependency here that is not a
    // UI library: the component is the line's desktop chrome, and the window
    // it drives is Tauri's. A product without Tauri has no use for it and
    // does not install it; one with Tauri already has this package.
    'window-frame': ['@tauri-apps/api'],
    // Its own markup and a `<style>` of eight words for the sweep. No
    // dependency, because it runs before most of the application has loaded.
    splash: [],
    // A span with pointer events and the hook that keeps widths. No library:
    // the arithmetic is one addition, and HTML5 drag-and-drop never reaches
    // the page in a desktop shell that takes file drops for itself.
    'column-resize-handle': [],
    // The same reasoning, and the grip is an inlined icon: a hook, a grip
    // and a line, for rows that belong to something else.
    'reorderable-list': [],
    // The panel is Popover's and Clear is Button's, so a funnel's panel
    // opens and positions the way every other panel in the set does.
    'filter-popover': ['button', 'popover'],
    // A tile, its letters and the rule that cuts them. Nothing else: the
    // initials are one function, and deriving a colour from the name - which
    // is what an avatar library brings - is the thing this deliberately does
    // not do.
    avatar: ['class-variance-authority'],
    // A circle and a word. The variants carry the status vocabulary, which is
    // exactly what `cva` is for and is the whole component.
    'status-dot': ['class-variance-authority'],
    // Three pieces of one subject with a shared `Tier`, and their variants.
    // No charting library: the bands are percentages of a bar.
    tier: ['class-variance-authority'],
    // Markers, a rail and a list. The variants are the status vocabulary
    // again; the rail is a one-pixel span.
    timeline: ['class-variance-authority'],
    // A `ResizeObserver` and two numbers. Nothing to install: the measurement
    // is `getBoundingClientRect`, and a library that virtualised or animated
    // it would be solving a different problem.
    'skeleton-of': [],
  }

  /** What the file imports: bare module specifiers minus React and the
   * package, plus any sibling component in this directory.
   *
   * A sibling counts as a dependency even though it costs no install. One
   * primitive importing another is what turns a set of components into a
   * graph, and a product copying a single file out of the registry has to be
   * told which other file comes with it. Reusing a neighbour's `cva` is
   * usually right - the alternative is two class lists that drift - but it is
   * a decision, so it is declared here like any other. */
  function importsOf(source: string): string[] {
    const found = new Set<string>()
    for (const match of source.matchAll(/from\s+'([^']+)'/g)) {
      const specifier = match[1]!
      if (specifier.startsWith('.')) {
        // `./menu` is the component named `menu`. Anything reaching further
        // out than a sibling is not a component and is not counted.
        const sibling = specifier.match(/^\.\/([\w-]+)$/)?.[1]
        if (sibling) found.add(sibling)
        continue
      }
      if (specifier === 'react' || specifier === 'react-dom') continue
      if (specifier === 'dowel-ui') continue
      // `@scope/name/deep/path` counts as `@scope/name`.
      const parts = specifier.split('/')
      found.add(specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!)
    }
    return [...found].sort()
  }

  it('has a declared budget for every component', () => {
    // A new component must be added here deliberately, or its dependencies
    // would go unchecked from the day it lands.
    expect(components.map((c) => c.name).sort()).toEqual(Object.keys(ALLOWED).sort())
  })

  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s imports only what it is allowed to',
    (name, source) => {
      const allowed = ALLOWED[name] ?? []
      const actual = importsOf(source)
      expect(
        actual,
        `\`${name}\` imports ${JSON.stringify(actual)}, and its budget is ${JSON.stringify(allowed)}. ` +
          'A new dependency is a cost every product pays - add it here if it is worth paying.',
      ).toEqual([...allowed].sort())
    },
  )
})

describe('a primitive has no words of its own', () => {
  /*
   * A string written into a component is a string the product cannot
   * translate. It ships in English to every reader who does not read English,
   * and no amount of i18n in the product reaches it.
   *
   * So visible text arrives through props, always - and a prop that names
   * something for a screen reader has no default, because a default is the
   * same English string wearing a different hat.
   *
   * The check reads the JSX. Class lists, `aria-*` attribute names, key names
   * and the like are not user-facing text; what is caught is a literal that
   * would be rendered or announced.
   */

  /** Props whose value is a word in the ARIA vocabulary rather than a word in
   * a language. `role="status"` is not English any more than `type="button"`
   * is - nothing reads it aloud, no product translates it, and it is the
   * component's job to pick a sane one. What is still caught for these props
   * is nothing, so the list stays short and each entry has to earn its place. */
  const NOT_A_WORD = new Set([
    'role',
    /* `numeric` is `Intl.RelativeTimeFormat`'s own vocabulary: `'auto'` asks
     * for "yesterday" where the language has a word for it, `'always'` for "1
     * day ago". Nothing announces the value, no product translates it, and the
     * phrase it produces is in the reader's language either way - the whole
     * point of formatting through `Intl`. Leaving the prop required would make
     * every caller pick a spelling of a decision the component should have an
     * opinion about. */
    'numeric',
  ])

  /** String defaults in a destructured props list: `label = 'Copy'`. */
  function stringDefaults(source: string): string[] {
    const body = source.match(/export function \w+\(\{([\s\S]*?)\}:/)?.[1] ?? ''
    return [...body.matchAll(/(\w+)\s*=\s*'([^']*)'/g)]
      .filter(([, prop, value]) => /[A-Za-z]{2}/.test(value!) && !NOT_A_WORD.has(prop!))
      .map(([, prop, value]) => `${prop} = '${value}'`)
  }

  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s puts no English in a prop default',
    (name, source) => {
      const found = stringDefaults(source)
      expect(
        found,
        `\`${name}\` defaults ${found.join(', ')}. A default word is the product's to give: ` +
          'make the prop required instead, so a product that forgets it fails to compile ' +
          'rather than shipping English.',
      ).toEqual([])
    },
  )

  /** Literals that are a data format's own keyword rather than a word in a
   * language. `null` drawn in a JSON viewer is what the document says, in the
   * spelling the JSON specification gives it: translating it would misquote
   * the data. The same argument as `role` above, and the list stays this short
   * for the same reason - "it is a technical term" is what every untranslated
   * string claims about itself. */
  const NOT_A_LANGUAGE = new Set(['null', 'true', 'false'])

  /** Text sitting directly in JSX: `<span>Copy</span>`. */
  function literalJsxText(source: string): string[] {
    // Two or more letters between tags, ignoring `{expressions}`.
    return [...source.matchAll(/>\s*([A-Za-z][A-Za-z ,.'!?-]{1,})\s*</g)]
      .map((match) => match[1]!.trim())
      .filter((text) => text.length > 1 && !NOT_A_LANGUAGE.has(text))
  }

  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s renders no literal text',
    (name, source) => {
      const found = literalJsxText(source)
      expect(
        found,
        `\`${name}\` renders the literal text ${JSON.stringify(found)}. ` +
          'Text belongs to the product: take it as a prop.',
      ).toEqual([])
    },
  )
})
