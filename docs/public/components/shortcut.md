# Shortcut

Source: https://lacodda.github.io/dowel/components/shortcut

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#shortcut

A bound shortcut, and a field it deliberately does not fire into.

## Notes

Not a component — a hook and two predicates. There is nothing to draw, which
is why the page is mostly about a default.

Binding a key is four lines everyone can write. The two decisions inside those
four lines are what this exists for.

### A shortcut must not fire while someone is typing

This is the default, and it is the point. A keystroke aimed at an `<input>`, a
`<textarea>` or anything `contenteditable` belongs to that thing, always.

It is the bug nobody can describe afterwards. `Mod+K` inside a text editor
means "delete to end of line"; a palette opening on top of that looks like the
application misheard, and the person reporting it can only say that sometimes
the wrong thing happens when they type. Every product writes this check
eventually, usually after the bug report, and usually forgetting
`contenteditable`.

`whileTyping: true` turns it off, and there is exactly one shape of shortcut
that wants it: one belonging to the field itself — `Escape` closing the box it
is typed in. Never one that takes the person somewhere else.

### `Mod` is command on Apple platforms and control everywhere else

The other half. A shortcut hard-coded to `ctrlKey` is dead on every Mac; one
hard-coded to `metaKey` is dead everywhere else. `Mod` matches whichever the
machine sends.

It is deliberately the same word [`Kbd`](/dowel/components/kbd/) draws by, so
one array can be passed to both and **what is bound and what is shown cannot
disagree** — which is how a hint ends up promising `Ctrl+K` on a machine where
the shortcut is `⌘K`.

### The match is exact, in both directions

`['Mod', 'K']` fires on `Mod+K` and on nothing else. Not on `Mod+Shift+K`,
which is usually a different command entirely — "open in a new window" next to
"open". And a bare `['K']` does not fire while a modifier is held, which is the
direction that is easier to miss: a loose bare key swallows every shortcut in
the application that shares its letter.

```tsx
import { useShortcut } from '@/components/ui/shortcut'

useShortcut(['Mod', 'K'], () => setPaletteOpen(true))

// Belongs to the field, so it fires even while typing.
useShortcut(['Escape'], close, { whileTyping: true })

// Only on the screens that have the thing it opens.
useShortcut(['Mod', 'S'], save, { enabled: canSave })
```

A match calls `preventDefault`, so the browser does not also scroll the page
or open its own find bar over what just opened.

The handler may be written inline. It is read through a ref, so a caller
passing a fresh arrow function on every render does not rebind the listener —
which is how these end up firing twice.

## API

### `useShortcut(shortcut, onPress, options?)`

| Argument | Type | Default | |
| --- | --- | --- | --- |
| `shortcut` | `string[]` | | As `['Mod', 'K']`. `Mod`, `Shift` and `Alt` are the modifiers; the rest is the key |
| `onPress` | `(event: KeyboardEvent) => void` | | Given the original event, for a product that has to look at it |
| `options.enabled` | `boolean` | `true` | `false` binds nothing at all |
| `options.whileTyping` | `boolean` | `false` | `true` fires into fields as well. See above before reaching for it |

### `matchesShortcut(event, shortcut): boolean`

The comparison on its own, for a product that already owns the handler and
only needs the question answered. Exact on every modifier.

### `isTypingTarget(target): boolean`

Whether the event landed on something that owns its own keys — an `<input>`, a
`<textarea>`, or anything `contenteditable`.

## Where it is already used

[`SearchField`](/dowel/components/search-field/) takes a `shortcut` array and
binds it with this hook, and
[`CommandPalette`](/dowel/components/command-palette/) is opened with it: the
palette has no trigger to point at, and the one it does have is a keystroke.
