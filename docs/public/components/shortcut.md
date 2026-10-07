# Shortcut

Source: https://lacodda.github.io/dowel/components/shortcut

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#shortcut

Press any key: what it is as a shortcut, and how this platform writes it.

## Notes

Not a component — the notation, and the functions that read a keystroke into
it. Binding a key is [`commands`](/dowel/components/commands/)' job; drawing
one is [`Kbd`](/dowel/components/kbd/)'s. Both speak this.

### The notation

A shortcut is a string, written the way it is read:

```text
Mod+K        Mod+Shift+P        ?        Escape        Alt+ArrowLeft        G D
```

- **`Mod`** is command on Apple platforms and control everywhere else. A
  shortcut hard-coded to `ctrlKey` is dead on every Mac, one hard-coded to
  `metaKey` dead everywhere else.
- **`Ctrl`** is the control key itself, which only means something different
  on a Mac — `Ctrl+Tab` switches tabs there, where `Mod+Tab` belongs to the
  system. Off a Mac, `Ctrl+K` *is* `Mod+K`: one keystroke, spelled one way.
- **`Alt`** and **`Shift`** are what they say. There is no `Cmd`: that is `Mod`.
- **A space** separates the steps of a sequence. `G D` is G, then D.
- **Keys** are a Latin letter, a digit, a character such as `?` or `[`, or a
  name: `Escape`, `Enter`, `Tab`, `Space`, `Backspace`, `Delete`, `Home`,
  `End`, `PageUp`, `PageDown`, the four arrows, `F1`–`F24`. The plus key is
  `Mod++` or `Mod+Plus`.

Case does not matter, and `Esc`, `Up` and `Option` are read as `Escape`,
`ArrowUp` and `Alt` — `normalizeKeys` writes any of them the one way. Two
spellings of one key are how two commands end up on it without a conflict ever
being seen, so there is one.

A string, not an array, because a shortcut has to live in more places than
code: in a settings file where someone rebound it, in the hint beside a
button, in the sheet that lists every key, and in the comparison that says two
commands share one.

### A character carries its own Shift

`?` is Shift+/ on one keyboard and Shift+7 on another, and the person pressing
it means the question mark on both. So `?` is written `?` — and `Shift+/` is
**refused**, with a message saying to write the character instead. The same
for `Shift+1`: write `!`.

Under a command modifier a digit is a place on the keyboard rather than a
character, so `Mod+Shift+1` is a shortcut of its own, and allowed.

### A letter is found by its place, when the layout does not type Latin

On a Russian layout, `Ctrl+P` arrives with `event.key` set to `з`. Matching on
that makes every shortcut in the application stop working the moment someone
switches language to write a sentence — which, for the people the line is made
for, is several times an hour.

So a letter is the letter the key types when the layout types Latin, and the
key's place when it does not. A German keyboard's `Mod+Z` is still the key
marked Z, wherever it sits; a Russian keyboard's is the key that types я. The
same goes for punctuation a non-Latin layout puts a letter on (`х` is where `[`
is), for Option letters on a Mac (`©` is Option+G), and for the number row
under a command modifier (a French keyboard types `&` on the key `Mod+1` is
pressed on).

### What is not a shortcut

A modifier pressed alone, a key in the middle of an input method's
composition, and AltGr typing a character — Polish `ą` arrives as Ctrl+Alt+A
on Windows, and it is a letter, not a command. Off a Mac, anything with the
Windows key: it belongs to the system.

## API

### `parseKeys(keys, apple?): Stroke[]`

The steps of a shortcut. Throws on anything it cannot read, and says why — a
shortcut is written in code, and a typo in one is a key that silently never
fires.

### `normalizeKeys(keys, apple?): string`

A shortcut in its one spelling: `mod+shift+p` is `Mod+Shift+P`, `Esc` is
`Escape`, and off a Mac `Ctrl+K` is `Mod+K`.

### `strokeOf(event, apple?): Stroke | null` and `keysOf(event, apple?): string | null`

What a keystroke is, as one step — or `null` when it is not a shortcut. `keysOf`
writes it down: what a settings screen recording a new binding stores.

### `sameStroke(a, b): boolean`

Exact on every modifier, in both directions: `Mod+K` is not `Mod+Shift+K`, and
a bare `K` is not `Ctrl+K`.

### `isTypingTarget(target): boolean`

Whether the event landed somewhere that owns its own keys: a text input, a
textarea, a select, or anything editable — including an element *inside* an
editable one, which is what `target` is for a bold word in an editable
paragraph. A checkbox holds no text, so a key on it is not typing.

### `typesInField(stroke): boolean`

Whether a field uses this key — a character, Space, Enter, Tab, the arrows,
Home and End, deleting. Only Escape, the function keys and anything held with
Mod, Ctrl or Alt are not.

### `ariaKeyShortcuts(keys, apple?): string | undefined`

The shortcuts in `aria-keyshortcuts` form — `Control+K`, or `Meta+K` on a Mac —
for the button or menu item that does the same thing. The attribute separates
*alternatives* with a space, so a sequence written into it would claim its
first key alone does the job; sequences are left out.

```tsx
<Button aria-keyshortcuts={ariaKeyShortcuts(useCommandKeys('save'))}>{t('save')}</Button>
```

### `isApplePlatform(): boolean`

Whether this machine writes and reads shortcuts the Apple way. Every function
above takes `apple` as its last argument and defaults to this.
