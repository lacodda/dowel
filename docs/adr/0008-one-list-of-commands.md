# ADR 0008: Keys are written once, in one notation, into one list per window

- Status: accepted
- Date: 2026-10-07

## Context

Every product of the line that grew a command palette wrote each key three times: in the listener that answers it, in the palette row that hints at it, and in the help sheet that lists it. kilna had a listener deciding intents by hand (`keys.ts`), a `keys` field on each palette command, and a `KeyboardSheet` with rows typed out - partly generated from its screens, partly not. scheda had a real list of commands with rebinding and scopes, in a notation of its own (`Ctrl+Shift+P`) that has no word for the command key on a Mac. dowel itself shipped `useShortcut(['Mod', 'K'], fn)`, which bound a key that no list could see.

Two defects followed from that, and both were silent. The three places drifted: a sheet promising a key the listener no longer answered, a hint showing a key that had been rebound. And the match read `event.key`, which on a Russian layout is `л` for the key marked K - so every shortcut built on dowel, and kilna's `g` chords, stopped working whenever the people the line is made for switched language to write.

## Decision

**A shortcut is a string in one notation.** `Mod+K`, `Mod+Shift+P`, `?`, `Escape`; a space separates the steps of a sequence (`G D`); several strings are alternatives. A string because a key has to live in a settings file after a rebinding, in a hint, in a sheet and in a comparison - an array cannot say "then", and a rebinding cannot be stored as a component's argument. There is one spelling per key: a character carries its own Shift, so `?` is written `?` and `Shift+/` is refused; off an Apple platform `Ctrl` folds into `Mod`. Two spellings of one keystroke would be two commands on it with no conflict ever detected.

**A keystroke is read the way a person means it.** A letter is the letter the layout types when it types Latin, and the key's place (`event.code`) when it does not; the number row under a command modifier is read by place; any other character is the character typed. AltGr chords, input-method composition and the Windows key are not shortcuts.

**There is one list of commands per window, and it is the module, not a provider.** A component declares `{ id, label, group, keys, run }` for as long as it is mounted; the keyboard, the palette and `ShortcutsDialog` all read that list. There is one keyboard per window; two providers would be two listeners on the same keys, which is the very conflict the list exists to catch. `useShortcut` is removed: a global key that is not a command is a key the sheet cannot list and the conflict check cannot see.

**Where a key is answered is decided by the list, once.** Not in a text field unless the command is declared `whileTyping`, which is refused on any key a field uses. A plain key - one without Mod, Ctrl or Alt - not inside a dialog, a menu, a listbox or a tree, unless the command is declared `within` that place. Plain Enter and Space only with nothing focused. A command declared `within` an element answers only inside it, and there before the rest of the window.

**A conflict is resolved and reported, not left to chance.** Same keys, or one the prefix of another's sequence, in the same place: the command declared first in tree order keeps them, and loses nothing; the other loses them in the keyboard, the palette's hint and the sheet at once, and the console names both. Tree order rather than effect order, because effects run children first and would hand a shell's own key to whatever screen is mounted inside it.

## Consequences

`Kbd`, `SearchField` and `CommandPaletteInput` take the notation string instead of an array, and `SearchField`'s shortcut is a command with an id and a label - a breaking change for kilna and lyrid, whose migration is one line per call site.

A product's sheet of shortcuts has no rows of its own and cannot be a version behind. A key handled by something else - Escape in a dialog - is declared without a `run`, so the sheet lists it and the conflict check sees it.

A rebinding is `setKeymap({ id: keys })`, which is why a command's id has to be stable across sessions. What a settings screen stores is user data: an unreadable entry is reported and skipped, never thrown.

The store is module state. Tests that declare commands rely on unmounting between tests, and anything that sets a keymap has to reset it. A product rendering two React roots shares one list, which is what one keyboard means.
