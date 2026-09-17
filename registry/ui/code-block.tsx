import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'dowel-ui'
import { CopyButton } from './copy-button'

/*
 * Code, shown inside a product.
 *
 * The frame around a piece of code is the same everywhere and is written again
 * in every product: the scroll that must not wrap, the gutter of line numbers
 * that must not be selectable, the copy button, the caption saying which file
 * this is, and the marking of the lines the reader was sent here to look at.
 * All of that is here.
 *
 * WHAT IS DELIBERATELY NOT HERE IS THE HIGHLIGHTER. A registry component is
 * copied into a product and becomes its file, so whatever this imports becomes
 * that product's dependency for good. Shiki is over a megabyte of grammars
 * before a language is chosen and resolves asynchronously, which would give
 * this component a loading state for text already in memory; Prism is
 * synchronous and mutates globals. Either one decides, on the product's
 * behalf, which languages it ships - which is not a primitive's decision to
 * make.
 *
 * So the split is: this draws, the product colours. `tokens` takes lines of
 * `{ text, kind }` from any highlighter - a mapping is about twenty lines -
 * and the eight kinds are the ones that mean the same thing in every language.
 * Without `tokens` the block renders the plain string and is completely
 * usable, which is the honest default: most code in an interface is four lines
 * of a command, where colour adds nothing.
 *
 * The colours are `--syntax-*`, fixed like the series palette: `if` should not
 * be magenta in one product and cobalt in another. They are measured as TEXT,
 * against the hardest surface a block sits on rather than the typical one -
 * every one clears 4.5:1 in both themes. That is why they are not the series
 * palette, whose light values sink to 1.90:1 at this size.
 */

export const codeBlockVariants = cva(
  // `group` so the copy button reveals on hover of the whole block rather than
  // only once the pointer has found a button it cannot see; `relative` because
  // a block with no caption has nowhere to put that button but over the code.
  'group relative overflow-hidden rounded-md border border-line bg-soft font-mono',
  {
    variants: {
      size: {
        sm: 'text-2xs',
        md: 'text-sm',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

/** The eight distinctions worth drawing in every language. A highlighter's own
 * theme names fifty; the rest are one grammar's vocabulary and do not travel,
 * so they fold into the nearest of these. */
export type TokenKind =
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  /** An identifier: a variable, a function, a property. */
  | 'name'
  /** A type name, a class, a constructor. */
  | 'type'
  | 'punctuation'
  /** What surrounds the code rather than being it: a decorator, an attribute,
   * a shell prompt, a diff marker. */
  | 'meta'

export interface CodeToken {
  text: string
  /** Left out for text that takes the ordinary foreground - whitespace,
   * anything the highlighter had no opinion about. */
  kind?: TokenKind
}

/* A record rather than a template string, because Tailwind reads class names
 * out of the source: `text-syntax-${kind}` compiles to nothing, and the block
 * would render in the default colour with no error anywhere. */
const tokenColor: Record<TokenKind, string> = {
  keyword: 'text-syntax-keyword',
  string: 'text-syntax-string',
  number: 'text-syntax-number',
  comment: 'text-syntax-comment',
  name: 'text-syntax-name',
  type: 'text-syntax-type',
  punctuation: 'text-syntax-punctuation',
  meta: 'text-syntax-meta',
}

export interface CodeBlockProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onCopy'>,
    VariantProps<typeof codeBlockVariants> {
  /** The code, as it should land on the clipboard. Always required, even when
   * `tokens` is given: what is copied is the text, not a reassembly of the
   * highlighting. */
  code: string
  /** The same code, coloured. Lines of tokens - one array per line, and the
   * newlines are the array boundaries rather than characters in the text.
   * Left out, the block draws `code` in one colour. */
  tokens?: CodeToken[][]
  /** Shown above the code: a file name, a path, a language. It is what brings
   * the header; without one the copy button floats over the code instead,
   * because a strip holding nothing but a button that hides until hover is
   * empty furniture. */
  caption?: string
  /** Numbers down the left. Off by default: they are for code a reader is
   * meant to refer to, and on a two-line command they are furniture. */
  numbered?: boolean
  /** Where the numbering starts, for an excerpt lifted out of a file. */
  firstLine?: number
  /** Lines to mark, in the same numbering the reader sees. */
  highlight?: readonly number[]
  /** Brings the copy button, and names it for a screen reader. Required to
   * have one, and deliberately without a default: a string this component
   * invents is a string the product cannot translate. */
  copyLabel?: string
  /** Announced after a successful copy. Required alongside `copyLabel`. */
  copiedLabel?: string
  /** Told what happened, for a product that wants its own toast. */
  onCopy?: (ok: boolean) => void
  /**
   * Let long lines wrap instead of scrolling.
   *
   * Off by default, and that is the right default for code: a wrapped line
   * lies about where it ends, and indentation is how code is read. It exists
   * for the case where the "code" is really a long single-line value - a URL,
   * a token, a stack frame - which scrolls forever and reads no better for it.
   */
  wrap?: boolean
}

export function CodeBlock({
  code,
  tokens,
  caption,
  numbered = false,
  firstLine = 1,
  highlight,
  copyLabel,
  copiedLabel,
  onCopy,
  wrap = false,
  size,
  className,
  ...props
}: CodeBlockProps) {
  /* The trailing newline almost every file ends with would draw an empty final
   * row - and, with numbering on, a number against nothing. It is stripped for
   * drawing only; `code` is what gets copied, unchanged. */
  const lines: CodeToken[][] =
    tokens ?? code.replace(/\n$/, '').split('\n').map((text) => [{ text }])
  const marked = new Set(highlight ?? [])

  /* Built once. Where it lands is the only thing that differs: inside the
   * header when there is one, and over the code when there is not - which is
   * why the block is `relative`. */
  const copy =
    copyLabel === undefined ? null : (
      <CopyButton
        value={code}
        label={copyLabel}
        copiedLabel={copiedLabel ?? copyLabel}
        onCopy={onCopy}
        className={caption === undefined ? 'absolute right-1.5 top-1.5 z-10 bg-raise' : undefined}
      />
    )

  return (
    <div className={cn(codeBlockVariants({ size }), className)} {...props}>
      {/*
       * The header exists for the caption. The copy button goes in it when
       * there is one, and over the code when there is not.
       *
       * The first version drew a header whenever there was EITHER, and a live
       * run showed what that is: a block holding a command, with no caption,
       * got a 34px strip containing one button that is invisible until hover.
       * Empty furniture on the commonest shape there is.
       *
       * Not `<figcaption>`: this is a div, and a caption claiming to be one
       * without a `<figure>` around it is a lie to a screen reader.
       */}
      {caption === undefined ? (
        copy
      ) : (
        <div className="flex items-center gap-2 border-b border-line bg-softer px-3 py-1.5">
          <span className="grow truncate text-2xs text-dim">{caption}</span>
          {copy}
        </div>
      )}

      {/*
       * `<pre>` inside the scroller rather than around it, so the horizontal
       * scrollbar belongs to the code and the header stays put above it.
       *
       * `tabIndex={0}` is not decoration: a region that scrolls has to be
       * reachable by the keyboard, or a reader who does not use a pointer
       * cannot see the right-hand end of a long line. It carries a role and a
       * label for the same reason.
       */}
      <pre
        tabIndex={0}
        className={cn(
          'overflow-x-auto py-2 leading-relaxed',
          // Restored here because a product's shell usually turns selection
          // off - and code that cannot be selected cannot be taken away.
          'select-text',
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
        )}
      >
        <code className="block">
          {lines.map((line, index) => {
            const number = firstLine + index
            return (
              <span
                key={number}
                className={cn(
                  'flex px-3',
                  /* A left rule as well as a tint: a marked line that says so
                   * only by a wash of accent is a line nobody notices, and one
                   * that a reader who does not see the hue never notices at
                   * all. */
                  marked.has(number) &&
                    'border-l-2 border-accent bg-accent-soft pl-[calc(0.75rem-2px)]',
                )}
              >
                {numbered && (
                  /*
                   * `user-select: none` is the whole reason the numbers are
                   * drawn here rather than in a counter or a background: a
                   * reader who selects the block to copy it must not get "1"
                   * welded to the front of every line. That is the defect this
                   * gutter exists to avoid, and it is invisible until someone
                   * pastes.
                   */
                  <span
                    className="mr-3 shrink-0 select-none text-right tabular-nums text-faint"
                    style={{ width: `${String(firstLine + lines.length - 1).length}ch` }}
                    aria-hidden
                  >
                    {number}
                  </span>
                )}
                {/* `break-words` alongside the wrapping, not instead of it.
                  * `pre-wrap` breaks at spaces, and the case `wrap` exists for
                  * - a URL, a token, a stack frame - has none: a live run
                  * showed a JWT sitting 320px outside a block that had asked
                  * to wrap. Only `overflow-wrap` breaks inside a word. */}
                <span
                  className={cn(
                    'min-w-0',
                    wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
                  )}
                >
                  {/* A line with nothing on it still needs its height, or a
                    * blank line between two paragraphs of code closes up and
                    * the numbering drifts away from the file. */}
                  {line.length === 0 ? (
                    '\n'
                  ) : (
                    line.map((token, at) => (
                      <span
                        key={at}
                        className={token.kind === undefined ? undefined : tokenColor[token.kind]}
                      >
                        {token.text}
                      </span>
                    ))
                  )}
                </span>
              </span>
            )
          })}
        </code>
      </pre>
    </div>
  )
}
