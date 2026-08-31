import type { Rule } from 'eslint'

/*
 * `no-raw-color` - the rule behind the line's oldest convention.
 *
 * Two things are forbidden in a component, and they are the same mistake seen
 * from either end:
 *
 *   - a raw colour (`#d9569e`, `rgb(...)`, `bg-zinc-800`), because a colour
 *     without a name in the vocabulary cannot follow the product's accent and
 *     will not swap when the theme does;
 *   - a `dark:` utility, because it says the component knows which theme it is
 *     in. It does not, and must not: the token underneath changes instead.
 *
 * The check is deliberately textual. What matters is what ends up in a
 * `className`, and that string is assembled from literals in `cva` variant
 * maps, ternaries and template pieces - places a type-aware rule would have to
 * follow anyway. So every string literal in the file is read, and the ones
 * that look like a colour are reported.
 *
 * It runs on components, not on the theme: the theme is where raw colour is
 * supposed to live, and it is CSS, which this never sees.
 */

/** A hex colour: `#abc`, `#aabbcc`, `#aabbccdd`. Word-bounded at the end so a
 * hash-prefixed word (`#section-title`) is not mistaken for one. */
const HEX = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{1,5})?\b/

/** A CSS colour function with numeric arguments. `color-mix` and `oklch(from
 * var(--accent-base) ...)` are how the theme derives colour and are allowed -
 * what is forbidden is naming a colour outright. */
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab)\s*\(/

/** Tailwind's stock palette, as it appears inside a utility: `bg-zinc-800`,
 * `hover:text-red-500/50`, `border-slate-200`. The line drops the stock
 * palette from the theme, so these do not compile - but they are written by
 * habit and by every code generator, and the error they produce points at CSS
 * rather than at the file that asked. */
const STOCK_PALETTE =
  /\b(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/

/** A `dark:` variant, anywhere in a class string. */
const DARK_VARIANT = /(?:^|[\s"'`])dark:/

/** `white` and `black` as Tailwind utilities: `bg-white`, `text-black/60`.
 * They are colours with no name in the vocabulary and no way to follow a
 * theme - white chrome stays white when the ground turns white. */
const ABSOLUTE = /\b(?:bg|text|border|fill|stroke|ring|outline|divide|shadow|from|via|to)-(?:white|black)\b/

interface Finding {
  message: string
}

/** What is wrong with this string, if anything. Exported for the test: the
 * matching is the whole rule, and testing it directly is what lets a mutation
 * to any single pattern show up as a failure. */
export function findRawColor(text: string): Finding | undefined {
  if (DARK_VARIANT.test(text)) {
    return {
      message:
        'A `dark:` utility makes the component know which theme it is in. Use a token - the theme swaps it underneath.',
    }
  }
  if (HEX.test(text)) {
    return {
      message:
        'A raw colour cannot follow the product accent or the theme. Use a token from the dowel vocabulary.',
    }
  }
  if (COLOR_FUNCTION.test(text)) {
    return {
      message:
        'A raw colour cannot follow the product accent or the theme. Use a token from the dowel vocabulary.',
    }
  }
  if (STOCK_PALETTE.test(text)) {
    return {
      message:
        "Tailwind's stock palette is dropped from the theme, so this compiles to nothing. Use a token from the dowel vocabulary.",
    }
  }
  if (ABSOLUTE.test(text)) {
    return {
      message:
        '`white` and `black` do not change with the theme. Use `text-text`, `bg-bg` or another token.',
    }
  }
  return undefined
}

export const noRawColor: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid raw colours and `dark:` utilities in components; every colour goes through a dowel token.',
      url: 'https://lacodda.github.io/dowel/guides/tokens/',
    },
    schema: [],
  },
  create(context) {
    const report = (node: Rule.Node, text: string) => {
      const finding = findRawColor(text)
      if (finding) context.report({ node, message: finding.message })
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') report(node, node.value)
      },
      TemplateElement(node) {
        // A template element carries no cooked value when the template is
        // tagged with an invalid escape; the raw text is always there.
        report(node as Rule.Node, node.value.cooked ?? node.value.raw)
      },
    }
  },
}
