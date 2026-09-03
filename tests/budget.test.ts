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
      ceiling: 4608,
      because:
        'The explicit viewport anchor. A palette has no trigger to point at, and without ' +
        'it the positioner never resolves and the popup renders fully transparent - ' +
        'present, sized, and invisible.',
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
    badge: ['class-variance-authority'],
    // Its own clothes and nothing else. A banner is a strip with a slot at
    // each end - importing Alert's `cva` would tie a message about the whole
    // application to one about the field beside it, and those drift apart on
    // purpose.
    banner: ['class-variance-authority'],
    button: ['@base-ui/react', 'class-variance-authority'],
    chip: ['class-variance-authority'],
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
  const NOT_A_WORD = new Set(['role'])

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

  /** Text sitting directly in JSX: `<span>Copy</span>`. */
  function literalJsxText(source: string): string[] {
    // Two or more letters between tags, ignoring `{expressions}`.
    return [...source.matchAll(/>\s*([A-Za-z][A-Za-z ,.'!?-]{1,})\s*</g)]
      .map((match) => match[1]!.trim())
      .filter((text) => text.length > 1)
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
