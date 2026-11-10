import { Row } from '../row'
import { CodeBlock } from '../../../registry/ui/code-block'

/*
 * Demo data for the text-and-code block.
 *
 * Synthetic throughout, like everything on the stand: a path here that came
 * off this machine would ship to the docs site.
 */
const sampleConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The stand is its own app, not a page of the docs site.
export default defineConfig({
  base: '/dowel/stand/',
  plugins: [react()],
  build: {
    outDir: '../docs/public/stand',
    emptyOutDir: true,
  },
})
`

/* What a highlighter hands back, written out by hand: one array per line, each
 * a list of `{ text, kind }`. Twelve lines is enough to show all eight kinds
 * without pretending this file ships a parser. */
const highlighted = [
  [
    { text: 'export', kind: 'keyword' as const },
    { text: ' ' },
    { text: 'function', kind: 'keyword' as const },
    { text: ' ' },
    { text: 'boundsOf', kind: 'name' as const },
    { text: '(', kind: 'punctuation' as const },
    { text: 'points', kind: 'name' as const },
    { text: ': ', kind: 'punctuation' as const },
    { text: 'Point', kind: 'type' as const },
    { text: '[])', kind: 'punctuation' as const },
    { text: ' {', kind: 'punctuation' as const },
  ],
  [
    { text: '  ' },
    { text: '// A level is not a sum: the floor is not zero.', kind: 'comment' as const },
  ],
  [
    { text: '  ' },
    { text: 'const', kind: 'keyword' as const },
    { text: ' ' },
    { text: 'seen', kind: 'name' as const },
    { text: ' = ', kind: 'punctuation' as const },
    { text: 'points', kind: 'name' as const },
    { text: '.', kind: 'punctuation' as const },
    { text: 'filter', kind: 'name' as const },
    { text: '(', kind: 'punctuation' as const },
    { text: 'taken', kind: 'name' as const },
    { text: ')', kind: 'punctuation' as const },
  ],
  [
    { text: '  ' },
    { text: 'if', kind: 'keyword' as const },
    { text: ' (', kind: 'punctuation' as const },
    { text: 'seen', kind: 'name' as const },
    { text: '.', kind: 'punctuation' as const },
    { text: 'length', kind: 'name' as const },
    { text: ' === ', kind: 'punctuation' as const },
    { text: '0', kind: 'number' as const },
    { text: ') ', kind: 'punctuation' as const },
    { text: 'return', kind: 'keyword' as const },
    { text: ' ' },
    { text: 'null', kind: 'keyword' as const },
  ],
  [],
  [
    { text: '  ' },
    { text: '@measured', kind: 'meta' as const },
  ],
  [
    { text: '  ' },
    { text: 'return', kind: 'keyword' as const },
    { text: ' { ', kind: 'punctuation' as const },
    { text: 'label', kind: 'name' as const },
    { text: ': ', kind: 'punctuation' as const },
    { text: "'balance'", kind: 'string' as const },
    { text: ', ', kind: 'punctuation' as const },
    { text: 'min', kind: 'name' as const },
    { text: ': ', kind: 'punctuation' as const },
    { text: '4900', kind: 'number' as const },
    { text: ' }', kind: 'punctuation' as const },
  ],
  [{ text: '}', kind: 'punctuation' as const }],
]

export function CodeBlockSection() {
  return (
    <>
      <Row label="a command - no colour at all, which is the default and is usually right">
        <CodeBlock
          className="w-136"
          code="npx shadcn@latest add https://lacodda.github.io/dowel/r/code-block.json"
          wrap
          copyLabel="Copy the command"
          copiedLabel="Copied"
        />
      </Row>

      <Row label="a file: a caption, numbers from where it was lifted, and two lines marked">
        <CodeBlock
          className="w-136"
          code={sampleConfig}
          caption="vite.config.ts"
          numbered
          firstLine={1}
          highlight={[4, 5]}
          copyLabel="Copy the file"
          copiedLabel="Copied"
        />
      </Row>

      <Row label="coloured by a highlighter - the eight kinds, drawn in the syntax tokens">
        <CodeBlock
          className="w-136"
          code={'export function boundsOf(points: Point[]) {\n  // ...\n}'}
          tokens={highlighted}
          caption="line-scale.ts"
          numbered
          copyLabel="Copy the source"
          copiedLabel="Copied"
        />
      </Row>

      <Row label="sm, and a long value told to wrap rather than scroll for ever">
        <CodeBlock
          className="w-136"
          size="sm"
          wrap
          caption="the token, which is not really code"
          code="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vIiwibmFtZSI6IkEgU3RhbmQiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        />
      </Row>
    </>
  )
}
