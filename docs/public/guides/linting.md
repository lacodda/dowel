# The lint rules

Source: https://lacodda.github.io/dowel/guides/linting

Three conventions hold the system together, and all are easy to state and easy
to break:

- **a component never writes a colour down** — it names one from the
  vocabulary, and the theme decides what the name means, in dark, in light and
  in each product's accent;
- **no screen uses a native `<select>`** — the browser draws that popup itself,
  in the operating system's chrome, and no CSS reaches inside it;
- **no date or number is formatted in the browser's language** — it is written
  in the language the interface is.

`dowel-ui` ships the rules that enforce them.

## Turn it on

```js
// eslint.config.js
import dowel from 'dowel-ui/eslint'

export default [
  // ...your config
  ...dowel.configs.recommended,
]
```

The plugin comes with the package, so a product that has the theme already has
the rule. ESLint is an optional peer: nothing installs it on your behalf.

## `no-raw-color`

```tsx
// ✗ A colour the theme cannot reach.
<div className="bg-[#d9569e]" />
<div className="border-zinc-800" />
<div style={{ color: 'rgb(217 86 158)' }} />

// ✗ A component deciding which theme it is in.
<div className="bg-white dark:bg-neutral-900" />

// ✓ Names from the vocabulary. Both themes, every accent, one class list.
<div className="bg-raise border border-line text-text" />
<button className="bg-accent text-on-accent hover:bg-accent-2" />
```

The two errors are separate because the two fixes are:

- **a raw colour** is swapped for the token that means what it was trying to
  mean;
- **a `dark:` utility** is deleted. There is nothing to replace it with — the
  token underneath already changes.

Tailwind's stock palette (`zinc-800`, `red-500`) is reported too. The line
drops it from the theme deliberately, so those classes compile to nothing; the
rule points at the file that wrote one instead of leaving you to find a colour
that silently did not arrive.

`bg-white` and `text-black` are the same mistake in shorter clothes: white
chrome stays white when the ground turns white.

With an opacity, though, they are allowed:

```tsx
// ✓ A scrim is made of black. A caption over a photograph is made of white.
<div className="fixed inset-0 bg-black/50" />
<span className="text-white/70">{caption}</span>
```

Neither is a theme colour that failed to get a name — that is what a
translucent veil and ink on an arbitrary image are actually made of, which is
why the theme keeps `--color-white` and `--color-black` on purpose. kilna, the
first product to run this rule, had eleven of them and every one was right.

### What it leaves alone

The rule reads string literals in TypeScript and TSX — where a class list is
assembled. It never reads CSS, because the theme is the one place raw colour
belongs: that is what a token *is*.

Two exemptions are worth copying into your own config:

```js
{
  // Data that is *about* colour - a brand registry, a chart palette - and
  // tests that must write a colour to have something to check.
  files: ['src/brand.ts', '**/*.test.{ts,tsx}'],
  rules: { 'dowel/no-raw-color': 'off' },
}
```

If a component needs a colour that has no name yet, the answer is a new token,
not an exemption. A colour worth using is worth a word.

## `no-native-select`

```tsx
// ✗ The browser's own dropdown, in the operating system's chrome.
<select value={value} onChange={onChange}>
  <option value="a">A</option>
</select>

// ✓ The component. Same job, drawn by the product.
<Select items={items} value={value} onValueChange={setValue}>
  …
</Select>
```

A `<select>` cannot be made to look like the rest of an application. The
browser renders its popup itself, with the operating system's fonts and
spacing, and no amount of CSS reaches inside. On a screen where every other
control is the product's own, the one native dropdown reads as a foreign
object — and on Windows it reads as a foreign object from 1998.

`<option>` and `<optgroup>` are reported too: they exist only inside a
`<select>`, so one on its own is either a `<select>` being assembled somewhere
else or a misunderstanding.

The rule is about the **element**, never about the name. `<Select>` from this
set renders `<button role="combobox">` and no native element at all, which is
what the convention was always asking for.

:::note
This rule is the line's oldest convention, from atlas, where it was written as
"`<select>` never — PopoverSelect". The component here is called `Select`,
because that is what people search the registry for; the rule is what keeps the
promise the old name was carrying.
:::

## `no-implicit-locale`

```tsx
// ✗ The browser's language, whatever the interface is written in.
date.toLocaleDateString([], { weekday: 'short' })
count.toLocaleString()
new Intl.DateTimeFormat(undefined, { dateStyle: 'long' })

// ✓ The application's language, from one place.
const locale = useLocale()
date.toLocaleDateString(locale, { weekday: 'short' })
new Intl.NumberFormat(locale).format(count)
```

A call with no locale, with `[]` or with `undefined` asks for the *browser's*
language. When that differs from the interface's — an English product in a
browser set to Russian — the screen shows English headings over Russian
weekdays, and nothing is wrong enough to fail. kasl-server shipped exactly
that.

`useLocale()` from `dowel-ui` answers the question once: an explicit locale if
you pass one, else the nearest `LocaleProvider`, else the page's
`<html lang>`, else English. `<html lang>` is the attribute a screen reader
already reads the page by, so a product that sets it for accessibility has set
its date format too; it is watched, so switching language by changing it
re-renders every date. The dowel primitives that format — `NumberFormat`,
`RelativeTime`, `Calendar`, the pickers, `TimeField`, `NumberField` — all ask
`useLocale()`, and their plain helpers (`formatNumber`, `formatRelative`,
`formatTime`, `sortRows`) take the locale as a required argument.

The rule reports the three `toLocale*String` methods and the `Intl`
formatters. A variable passed as the locale is not reported: naming one is the
decision the rule asks for.
