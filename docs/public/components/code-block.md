# CodeBlock

Source: https://lacodda.github.io/dowel/components/code-block

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#code-block

A command with no colour at all, a file with line numbers and two lines marked, and the same source coloured by a highlighter.

## Notes

**It brings no highlighter, and that is the decision this component is built
around.** A registry component is *copied into your project* and becomes your
file — so whatever it imports becomes your dependency, resolved by your
bundler, for as long as you keep it. Shiki is over a megabyte of grammars
before a language is chosen and resolves asynchronously, which would give this
a loading state for text already in memory; Prism is synchronous and mutates
globals. Either one decides, on your behalf, which languages your product
ships.

So the split is: dowel draws, you colour. Everything that is the same in every
product is here — the scroll that must not wrap, the gutter that must not be
selectable, the copy button, the marking of lines, the accessibility. What
differs is the one thing you pass in.

```tsx
<CodeBlock code={source} caption="vite.config.ts" numbered highlight={[12, 13]} />
```

**Without `tokens` the block is monochrome and completely usable.** That is the
honest default: most code in an interface is four lines of a command, where
colour adds nothing.

**With `tokens`, colour arrives from any highlighter.** The shape is lines of
`{ text, kind }`, and the mapping is about twenty lines whichever one you use:

```tsx
import { codeToTokens } from 'shiki'

const { tokens } = await codeToTokens(source, { lang: 'ts', theme: 'none' })
const lines = tokens.map((line) =>
  line.map((token) => ({ text: token.content, kind: kindOf(token) })),
)

<CodeBlock code={source} tokens={lines} />
```

**The eight kinds are the ones that mean the same thing in every language** —
`keyword`, `string`, `number`, `comment`, `name`, `type`, `punctuation`, `meta`.
A highlighter's own theme names fifty; the rest are one grammar's vocabulary
and do not travel, so fold them into the nearest of these. The colours are the
[`--syntax-*` tokens](/dowel/reference/tokens/), fixed across the line like the
series palette: `if` should not be magenta in one product and cobalt in
another.

They are measured as *text*. Every slot clears 4.5:1 against this component's
own surface in both themes — which is why they are not the series palette,
whose light values sink to 1.90:1 at this size. A filled bar can be pale; a
12px glyph cannot.

**The line numbers are not selectable.** Select a numbered block, paste, and a
gutter drawn without `user-select: none` arrives with its number welded to the
front of every line. It is invisible until somebody pastes, which is why it is
a test rather than something to look at.

**`firstLine` numbers an excerpt from where it was lifted.** An excerpt
numbered from 1 sends the reader to the wrong place in the file, which is worse
than not numbering it at all. `highlight` is stated in the numbering the reader
sees, so an excerpt starting at 100 marks 101 as its second row.

**A marked line carries a rule as well as a tint**, because a wash of accent is
invisible to a reader who does not see the hue and easy to miss for one who
does.

**It scrolls rather than wraps.** A wrapped line of code lies about where it
ends, and indentation is how code is read. `wrap` exists for the case where the
"code" is really a long single-line value — a URL, a token, a stack frame —
which scrolls forever and reads no better for it.

**The copy button is [CopyButton](/components/copy-button/)** and appears only
when you name it. Nothing here has a default English string: a string this
component invents is one your product cannot translate.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `code` | `string` | | Required — and what lands on the clipboard, always |
| `tokens` | `CodeToken[][]` | | Lines of `{ text, kind }`. Without it, one colour |
| `caption` | `string` | | A file name, a path, a language |
| `numbered` | `boolean` | `false` | For code meant to be referred to |
| `firstLine` | `number` | `1` | Where the numbering starts |
| `highlight` | `number[]` | | Lines to mark, in the reader's numbering |
| `copyLabel` | `string` | | Brings the copy button, and names it |
| `copiedLabel` | `string` | `copyLabel` | Announced after a successful copy |
| `onCopy` | `(ok) => void` | | `false` means the clipboard refused |
| `wrap` | `boolean` | `false` | For a long value that is not really code |
| `size` | `sm` `md` | `md` | 10px and 12px |

### `CodeToken`

```ts
interface CodeToken {
  text: string
  kind?: 'keyword' | 'string' | 'number' | 'comment'
      | 'name' | 'type' | 'punctuation' | 'meta'
}
```

`kind` is left out for text the highlighter had no opinion about, which then
takes the ordinary foreground.
