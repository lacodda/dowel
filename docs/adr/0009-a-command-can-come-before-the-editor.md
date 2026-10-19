# ADR 0009: A command can take its key before the editor, and be offered though its key is local

- Status: accepted
- Date: 2026-10-19
- Refines: [0008](0008-one-list-of-commands.md)

## Context

ADR 0008 answers a key in the bubble phase and leaves alone a key that something nearer already handled. That is right for a dialog's Escape or a list's arrows, and wrong for an editor with a keymap of its own. CodeMirror handles dozens of `Mod` keys and calls `preventDefault` on each, so a command the person rebound onto `Mod+D` is listed with `Mod+D` in the sheet and in the palette's hint and does nothing inside the editor - the promised-but-not-answered key ADR 0008 exists to end.

The second gap came from the same product. scheda, whose command list dowel's was partly built from, answers its reading-mode and folding keys only inside a note (`within` the editor), and offers those commands in its palette, because their work acts on the editor the person was last in wherever the focus is now. ADR 0008 keeps every `within` command out of the palette.

## Decision

- **`capture: true` answers a command on the way down.** The list listens in both phases and asks the same question in each; the phase only decides when the answer is acted on. A command declared `capture` takes the key before whatever has the focus; every other command waits for the bubble phase as before. Where a key is answered - fields, `within`, dialogs - does not change with the phase, and a sequence begun in one phase can finish in the other.
- **`offered` says whether a palette offers a command.** It defaults to what ADR 0008 decided - offered unless declared `within` - and either way can be said outright: `true` for a local key whose work needs no focus, `false` for the command that opens the palette.
- **The names of the keys move to the notation.** `keyLabel` lives in `shortcut`, so a product without Tailwind prints keys under the same names `Kbd` draws. `Kbd` still exports it.

## Consequences

A settings screen that records keys while `capture` commands are declared listens on the window in the capture phase, which runs before the list's own listener on the document.

A product built around an editor declares its commands `capture` - in practice all of them - and a dialog or a list inside it still keeps the keys it handles, because those commands are not on them.

Rejected: a filter wrapped around the editor's keymap, to make it decline the keys the list holds. It would need every keymap of the editor, including the ones its extensions add, and would have to follow every rebinding by reconfiguring the editor.
