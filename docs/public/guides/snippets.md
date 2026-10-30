# Snippets for your editor

Source: https://lacodda.github.io/dowel/guides/snippets

Typing a component is mostly remembering it: which props it cannot do without,
what its variants are called, whether it takes children. A snippet remembers
for you - if it is right about the version you have.

```console
$ npx dowel snippets --write
Wrote .vscode/dowel.code-snippets: 24 snippets for 11 components. Type dw- in a .tsx file.
```

Type `dw-` in a `.tsx` or `.jsx` file and the components appear, each under
its file's name: `dw-button`, `dw-date-picker`, `dw-select-popup`.

```tsx
<Button variant="ghost">
  |
</Button>
```

## What a snippet asks for

- **What the component requires**, as a tab stop each - a string between
  quotes, anything else between braces, a boolean by its name alone. A pair
  required only together (`onRetry` with `retryLabel`) is left out: the
  snippet cannot know whether you want the pair.
- **Its variants**, as a list to choose from, the default first - so taking
  the first choice changes nothing.
- **Children**, when the component takes them: it is written open and closed,
  with the cursor inside. One that takes nothing closes itself.

Optional props are left out. They are on the component's page, and in the
editor over the copied file - their descriptions are the doc comments the
documentation tables are read from.

## Only what the project has

The command reads which components the project has copied - the same way
[`dowel diff`](/dowel/guides/migration/#what-you-changed-since) finds them - and
writes snippets for those and no others. A snippet for a component that is
not there would insert something that does not compile.

It reads the props from the `dowel-ui` you installed, not from the site, so
the snippets describe the components of that release. Run it again after
adding a component or upgrading; the file says at the top that it is
generated, and it is overwritten.

Without `--write` it prints what it would write and writes nothing, like
[`codemod`](/dowel/guides/migration/#codemod). `--json` prints the snippets
instead, for an editor other than VS Code.
