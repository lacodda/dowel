import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { registrySources } from './classes'

/*
 * A primitive's heading stands where the page puts it.
 *
 * Where a heading sits in the outline is the page's to say: a screen that
 * goes from its title straight to an accordion needs the accordion's headings
 * at `h2`, and a fixed `h3` skips a level for every reader moving by heading.
 * The set wrote nine fixed levels before this gate - the accordion's `h3`
 * (Base UI's default), the sheet of shortcuts' `h3`, the page header's `h1`
 * and six more. So a primitive draws its heading at a `level` it is given,
 * defaulting to where it usually stands, and never as a literal tag.
 *
 * Blocks are screens: they own their outline, from its `h1` down, and are
 * left alone.
 *
 * Base UI draws headings too. `Accordion.Header` is an `h3` unless given an
 * element to draw, so every `*.Header` must be given one. A dialog's, an
 * alert's and a popover's `Title` are an `h2` on purpose: a window opened over
 * the page starts an outline of its own, under its title.
 */

const sources = registrySources().filter((source) => source.file.startsWith('ui/'))

/** Every JSX element in a file, by its tag as written, with its attributes. */
function elements(file: string, text: string): { tag: string; line: number; attributes: string[] }[] {
  const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const found: { tag: string; line: number; attributes: string[] }[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      found.push({
        tag: node.tagName.getText(tree),
        line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
        attributes: node.attributes.properties.filter(ts.isJsxAttribute).map((attribute) => attribute.name.getText(tree)),
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return found
}

const all = sources.flatMap((source) => elements(source.file, source.text).map((element) => ({ file: source.file, ...element })))

describe('a heading in a primitive', () => {
  it('is never a fixed level', () => {
    const fixed = all.filter(({ tag }) => /^h[1-6]$/.test(tag)).map(({ file, line, tag }) => `${file}:${line} <${tag}>`)
    expect(fixed).toEqual([])
  })

  it('is drawn at the level given, when Base UI would pick one', () => {
    const unlevelled = all
      .filter(({ tag, attributes }) => /\.Header$/.test(tag) && !attributes.includes('render'))
      .map(({ file, line, tag }) => `${file}:${line} <${tag}>`)
    expect(unlevelled).toEqual([])
  })

  it('is found where the set draws one', () => {
    // A reader gone blind passes both rules above; these it must see.
    const levelled = sources.filter((source) => source.text.includes('`h${level}`')).map((source) => source.file)
    expect(levelled).toEqual(
      expect.arrayContaining([
        'ui/about-plate.tsx',
        'ui/accordion.tsx',
        'ui/divider.tsx',
        'ui/notification-bell.tsx',
        'ui/page-header.tsx',
        'ui/section-nav.tsx',
        'ui/shortcuts-dialog.tsx',
        'ui/wizard.tsx',
      ]),
    )
    expect(all.some(({ tag }) => tag === 'Base.Header')).toBe(true)
    // And the rule sees a literal tag where one is written.
    expect(elements('probe.tsx', 'const a = <h3 className="x">y</h3>').map(({ tag }) => tag)).toEqual(['h3'])
  })
})
